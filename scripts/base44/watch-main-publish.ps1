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

$repoRoot = (& git rev-parse --show-toplevel).Trim()
if (-not $repoRoot) {
    throw 'Not inside a git repository.'
}
Set-Location $repoRoot

$stateDir = Join-Path $repoRoot 'logs/base44-publish'
New-Item -ItemType Directory -Force -Path $stateDir | Out-Null
$statePath = Join-Path $stateDir 'last-published-main.txt'

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

    if (-not $SkipBuild) {
        Invoke-Step 'npm run build'
    }
    if (-not $SkipTests) {
        Invoke-Step 'npm run test:node'
        Invoke-Step 'npm run test:deno'
        Invoke-Step 'node --test tests/base44PublishAutomation.test.js tests/adminLoginFlow.test.js'
    }

    if ($DryRun) {
        Write-Host "Dry run: would publish $Sha to Base44 app $AppId." -ForegroundColor Green
        return
    }

    try {
        Invoke-Step "node scripts/base44/publish-deploy-endpoint.mjs --app-id $AppId --verify-url $VerifyUrl"
    }
    catch {
        if (-not $FallbackToUiClick) {
            throw
        }
        Write-Host "Deploy endpoint failed; falling back to UI clicker: $($_.Exception.Message)" -ForegroundColor Yellow
        Invoke-Step 'node scripts/base44/publish-ui-clicker.mjs --yes'
    }

    Set-Content -Path $statePath -Value $Sha -Encoding UTF8
    Write-Host "Recorded published main SHA: $Sha" -ForegroundColor Green

    if (-not $SkipTests) {
        Invoke-Step "npm run smoke:public-routes -- --base-url=$VerifyUrl"
        Invoke-Step 'npm run verify:production-security'
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

do {
    try {
        $remoteSha = Get-RemoteSha
        $lastSha = if (Test-Path $statePath) { (Get-Content $statePath -Raw).Trim() } else { '' }
        if ($remoteSha -and $remoteSha -ne $lastSha) {
            Write-Host "New origin/$TargetBranch SHA detected: $remoteSha" -ForegroundColor Yellow
            Invoke-ProductionPublish -Sha $remoteSha
        }
        else {
            Write-Host "No unpublished origin/$TargetBranch change detected."
        }
    }
    catch {
        Write-Host "Publish watcher failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    if ($Once) { break }
    Start-Sleep -Seconds $PollSeconds
} while ($true)
