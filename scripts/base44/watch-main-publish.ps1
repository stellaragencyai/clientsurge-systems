[CmdletBinding()]
param(
    [string]$TargetBranch = 'main',
    [string]$AppId = '69dc4a79656fdba136d413d3',
    [string]$VerifyUrl = 'https://clientsurgesystems.com',
    [int]$PollSeconds = 60,
    [switch]$Once,
    [switch]$SkipTests,
    [switch]$SkipBuild,
    [switch]$DryRun,
    [switch]$FallbackToUiClick,
    [switch]$SkipGitHubChecks,
    [switch]$SkipStagingMirrors,
    [string]$BrowserProfileDir = (Join-Path $env:USERPROFILE '.base44\publish-browser-profile'),
    [int]$UiStatusTimeoutSeconds = 90,
    [int]$GitHubCheckTimeoutSeconds = 1800,
    [ValidateSet('Primary', 'Failover', 'MirrorOnly')]
    [string]$PublisherRole = 'Primary',
    [int]$FailoverDelayMinutes = 3
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-Step {
    param([Parameter(Mandatory = $true)][string]$Command)

    Write-Host "> $Command" -ForegroundColor Cyan
    & pwsh -NoProfile -Command $Command
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $Command"
    }
}

function Test-WranglerAuthenticated {
    $output = & npx wrangler whoami 2>&1
    $text = ($output | Out-String)
    return ($LASTEXITCODE -eq 0 -and $text -notmatch 'not authenticated')
}

function Invoke-ProductionSecurityVerification {
    Write-Host "> npm run verify:production-security" -ForegroundColor Cyan
    & npm run verify:production-security
    if ($LASTEXITCODE -eq 0) {
        return
    }

    if (-not (Test-WranglerAuthenticated)) {
        Write-Host "Production security verification is waiting on Wrangler login; Base44 publish remains successful." -ForegroundColor Yellow
        Write-Host "Run npm run cloudflare:security:login, then npm run cloudflare:security:release to close the edge-security gap." -ForegroundColor Yellow
        return
    }

    throw 'Production security verification failed after Base44 publish.'
}

function Ensure-LocalProductionEnv {
    $envPath = Join-Path $repoRoot '.env.local'
    $examplePath = Join-Path $repoRoot '.env.example'

    if (-not (Test-Path $envPath)) {
        if (-not (Test-Path $examplePath)) {
            throw 'Missing .env.local and .env.example; cannot prepare production publish environment.'
        }
        Copy-Item -Path $examplePath -Destination $envPath
        Write-Host 'Created mirror .env.local from .env.example for production publish checks.' -ForegroundColor Yellow
    }

    $envText = Get-Content -Path $envPath -Raw
    if ($envText -notmatch 'VITE_BASE44_APP_ID=69dc4a79656fdba136d413d3' -or $envText -notmatch 'VITE_BASE44_APP_BASE_URL=https://clientsurgesystems\.com') {
        throw '.env.local is not configured for the production Base44 app and clientsurgesystems.com.'
    }
}

$repoRoot = (& git rev-parse --show-toplevel).Trim()
if (-not $repoRoot) {
    throw 'Not inside a git repository.'
}
Set-Location $repoRoot

$stateDir = Join-Path $repoRoot 'logs/base44-publish'
New-Item -ItemType Directory -Force -Path $stateDir | Out-Null
$statePath = Join-Path $stateDir 'last-published-main.txt'
$base44BrowserProfileDir = $BrowserProfileDir
$uiStatusPath = Join-Path $stateDir 'ui-publish-status.json'

function Get-Base44PublishStatus {
    param([string]$ExpectedText = '')
    if (Test-Path $uiStatusPath) {
        Remove-Item -LiteralPath $uiStatusPath -Force
    }

    Write-Host '> Checking Base44 editor for unpublished changes' -ForegroundColor Cyan
    $statusArgs = @('scripts/base44/publish-ui-clicker.mjs', '--status', '--headless', '--app-id', $AppId, '--profile-dir', $base44BrowserProfileDir, '--timeout-ms', ($UiStatusTimeoutSeconds * 1000), '--output', $uiStatusPath)
    if ($ExpectedText) { $statusArgs += @('--expect-text', $ExpectedText) }
    $nodeOutput = & node @statusArgs 2>&1
    $nodeExitCode = $LASTEXITCODE
    foreach ($line in @($nodeOutput)) { Write-Host $line }
    if ($nodeExitCode -ne 0 -or -not (Test-Path $uiStatusPath)) {
        throw 'Could not determine whether Base44 has unpublished changes. Refresh the dedicated publisher profile.'
    }

    $status = Get-Content -LiteralPath $uiStatusPath -Raw | ConvertFrom-Json
    if (-not $status.ok -or $null -eq $status.pending_publish) {
        throw 'Base44 publish status proof was incomplete.'
    }
    return $status
}

function Get-RemoteSha {
    Invoke-Step 'git fetch origin --prune'
    return (& git rev-parse "origin/$TargetBranch").Trim()
}

function Test-AppAlreadyPublishedByPrimary {
    param([Parameter(Mandatory = $true)][string]$Sha)

    if ($FailoverDelayMinutes -gt 0) {
        Write-Host "Failover publisher waiting $FailoverDelayMinutes minute(s) for primary desktop." -ForegroundColor Yellow
        Start-Sleep -Seconds ($FailoverDelayMinutes * 60)
    }

    $commitDateRaw = (& git show -s --format=%cI $Sha).Trim()
    if (-not $commitDateRaw) {
        Write-Host "Could not read commit time for $Sha; failover will publish." -ForegroundColor Yellow
        return $false
    }
    $commitDate = Convert-ToDateTimeOffset -Value $commitDateRaw

    $accessJson = & node scripts/base44/check-app-access.mjs --app-id $AppId --verify-url $VerifyUrl --json
    if ($LASTEXITCODE -ne 0 -or -not $accessJson) {
        Write-Host "Could not confirm Base44 app access; failover will publish." -ForegroundColor Yellow
        return $false
    }

    $status = $accessJson | ConvertFrom-Json
    if (-not $status.updated_date) {
        Write-Host "Base44 app updated_date was unavailable; failover will publish." -ForegroundColor Yellow
        return $false
    }

    $appUpdated = Convert-ToDateTimeOffset -Value $status.updated_date
    if ($appUpdated -ge $commitDate) {
        Set-Content -Path $statePath -Value $Sha -Encoding UTF8
        Write-Host "Primary appears to have published $Sha at $($status.updated_date); failover recorded the SHA and stood down." -ForegroundColor Green
        return $true
    }

    Write-Host "Base44 app updated at $($status.updated_date), before commit $commitDateRaw; failover will publish." -ForegroundColor Yellow
    return $false
}

function Invoke-ProductionPublish {
    param([Parameter(Mandatory = $true)][string]$Sha)

    $currentBranch = (& git branch --show-current).Trim()
    $dirty = @(& git status --porcelain=v1)
    if ($currentBranch -ne $TargetBranch) {
        throw "Refusing to publish from '$currentBranch'. Run this watcher from a clean $TargetBranch mirror."
    }
    if ($dirty.Count -gt 0) {
        throw "Refusing to publish from dirty '$TargetBranch'. Commit/stash first or run from a clean mirror."
    }

    Invoke-Step "git merge --ff-only origin/$TargetBranch"
    $localSha = (& git rev-parse HEAD).Trim()
    if ($localSha -ne $Sha) {
        throw "Local $TargetBranch is at $localSha after fast-forward, expected $Sha."
    }

    if ($PublisherRole -eq 'MirrorOnly') {
        Write-Host "Publisher role is MirrorOnly; synced $Sha without publishing." -ForegroundColor Yellow
        Set-Content -Path $statePath -Value $Sha -Encoding UTF8
        return
    }

    if ($PublisherRole -eq 'Failover' -and (Test-AppAlreadyPublishedByPrimary -Sha $Sha)) {
        return
    }

    if (-not $SkipGitHubChecks) {
        Invoke-Step "pwsh -NoProfile -File scripts/github/wait-for-main-ci.ps1 -Sha $Sha -Branch $TargetBranch -TimeoutSeconds $GitHubCheckTimeoutSeconds"
    }

    Ensure-LocalProductionEnv

    if (-not $SkipBuild) {
        Invoke-Step 'npm run build'
    }
    if (-not $SkipTests) {
        Invoke-Step 'npm run test:release-gate:node'
    }

    if ($DryRun) {
        Write-Host "Dry run: would publish $Sha to Base44 app $AppId." -ForegroundColor Green
        return
    }

    try {
        Invoke-Step "node scripts/base44/publish-deploy-endpoint.mjs --app-id $AppId --verify-url $VerifyUrl --profile-dir `"$base44BrowserProfileDir`" --summary"
    }
    catch {
        if (-not $FallbackToUiClick) {
            throw
        }
        Write-Host "Deploy endpoint failed; falling back to UI clicker: $($_.Exception.Message)" -ForegroundColor Yellow
        Invoke-Step "node scripts/base44/publish-ui-clicker.mjs --yes --headless --app-id $AppId --profile-dir `"$base44BrowserProfileDir`" --verify-url $VerifyUrl --output `"$(Join-Path $stateDir 'ui-publish-proof.json')`""
    }

    Set-Content -Path $statePath -Value $Sha -Encoding UTF8
    Write-Host "Recorded published main SHA: $Sha" -ForegroundColor Green

    if (-not $SkipStagingMirrors) {
        Invoke-Step 'node scripts/base44/publish-all-apps.mjs --staging-only'
    }

    if (-not $SkipTests) {
        Invoke-Step "npm run smoke:public-routes -- --base-url=$VerifyUrl"
        Invoke-ProductionSecurityVerification
    }
}

function Convert-ToDateTimeOffset {
    param([Parameter(Mandatory = $true)][string]$Value)

    $normalized = $Value.Trim()
    if ($normalized -notmatch '(Z|[+-]\d{2}:\d{2})$') {
        $normalized = "${normalized}Z"
    }
    return [DateTimeOffset]::Parse($normalized)
}

Write-Host "Watching origin/$TargetBranch for production Base44 publish." -ForegroundColor Green
Write-Host "App:    $AppId"
Write-Host "Verify: $VerifyUrl"
Write-Host "Role:   $PublisherRole"
Write-Host "Profile: $base44BrowserProfileDir"

do {
    try {
        $remoteSha = Get-RemoteSha
        $lastSha = if (Test-Path $statePath) { (Get-Content $statePath -Raw).Trim() } else { '' }
        $gitChanged = $remoteSha -and $remoteSha -ne $lastSha
        $commitTitle = if ($gitChanged) { (& git show -s --format=%s $remoteSha).Trim() } else { '' }
        $syncMarker = if ($commitTitle.Length -gt 32) { $commitTitle.Substring(0, 32) } else { $commitTitle }
        $base44Status = Get-Base44PublishStatus -ExpectedText $syncMarker
        $base44Pending = [bool]$base44Status.pending_publish
        $expectedSyncVisible = -not $gitChanged -or [bool]$base44Status.expected_sync_visible
        if ($base44Pending -and $expectedSyncVisible) {
            if ($gitChanged) {
                Write-Host "New origin/$TargetBranch SHA and Base44 unpublished changes detected: $remoteSha" -ForegroundColor Yellow
            }
            else {
                Write-Host 'Base44 editor changes detected without a new GitHub SHA.' -ForegroundColor Yellow
            }
            Invoke-ProductionPublish -Sha $remoteSha
        }
        elseif ($gitChanged -and -not $expectedSyncVisible) {
            Write-Host "New origin/$TargetBranch SHA detected, but its commit title is not visible in Base44 sync activity yet. The next poll will retry." -ForegroundColor Yellow
        }
        elseif ($gitChanged) {
            Write-Host "New origin/$TargetBranch SHA detected, but Base44 has not synced it yet. The next poll will retry." -ForegroundColor Yellow
        }
        else {
            Write-Host "No unpublished GitHub or Base44 change detected."
        }
    }
    catch {
        Write-Host "Publish watcher failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    if ($Once) { break }
    Start-Sleep -Seconds $PollSeconds
} while ($true)
