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
    [switch]$FallbackToUiClick
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

Write-Host "Watching origin/$TargetBranch for production Base44 publish." -ForegroundColor Green
Write-Host "App:    $AppId"
Write-Host "Verify: $VerifyUrl"

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
