[CmdletBinding()]
param(
    [string]$TargetBranch = 'main',
    [string]$RepoPath = 'C:\Users\nolan\Code\ClientSurge\clientsurge-systems-main-mirror',
    [int]$PollSeconds = 60,
    [switch]$Once,
    [switch]$SkipGitHubChecks,
    [switch]$AllowUiFallback
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-Checked {
    param([Parameter(Mandatory = $true)][string]$Command)
    Write-Host "> $Command" -ForegroundColor Cyan
    & pwsh -NoProfile -Command $Command
    if ($LASTEXITCODE -ne 0) { throw "Command failed with exit code ${LASTEXITCODE}: $Command" }
}

if (-not (Test-Path $RepoPath)) { throw "Clean release mirror not found: $RepoPath" }
Set-Location $RepoPath

$stateDir = Join-Path $RepoPath 'logs/base44-publish'
New-Item -ItemType Directory -Force -Path $stateDir | Out-Null
$statePath = Join-Path $stateDir 'last-exact-release-main.txt'

Write-Host "Watching origin/$TargetBranch for exact-artifact production releases." -ForegroundColor Green
Write-Host "Mirror: $RepoPath"
Write-Host "Poll:   $PollSeconds seconds"

do {
    try {
        $dirty = @(& git status --porcelain=v1)
        if ($dirty.Count -gt 0) { throw 'Release mirror is dirty. Refusing to publish.' }

        Invoke-Checked 'git fetch origin --prune'
        Invoke-Checked "git checkout $TargetBranch"
        Invoke-Checked "git merge --ff-only origin/$TargetBranch"

        $sha = (& git rev-parse HEAD).Trim()
        $lastSha = if (Test-Path $statePath) { (Get-Content $statePath -Raw).Trim() } else { '' }

        if ($sha -and $sha -ne $lastSha) {
            Write-Host "New main commit detected: $sha" -ForegroundColor Yellow

            if (-not $SkipGitHubChecks) {
                Invoke-Checked "pwsh -NoProfile -File scripts/github/wait-for-main-ci.ps1 -Sha $sha -Branch $TargetBranch -TimeoutSeconds 1800"
            }

            $env:RELEASE_SHA = $sha
            $env:RELEASE_BRANCH = $TargetBranch
            $env:BASE44_APP_ID = '69dc4a79656fdba136d413d3'
            $env:RELEASE_BASE_URL = 'https://clientsurgesystems.com'
            $env:ALLOW_BASE44_ENDPOINT_FALLBACK = 'true'
            $env:ALLOW_BASE44_UI_FALLBACK = if ($AllowUiFallback) { 'true' } else { 'false' }
            $env:SKIP_NPM_INSTALL = 'false'
            $env:SKIP_RELEASE_TESTS = 'false'

            Invoke-Checked 'node scripts/release/deploy-production-site.mjs'
            Set-Content -Path $statePath -Value $sha -Encoding UTF8
            Write-Host "Production verified at exact commit $sha" -ForegroundColor Green
        }
        else {
            Write-Host 'No unpublished main commit detected.'
        }
    }
    catch {
        Write-Host "Automatic production release failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host 'The previous production release remains active. The watcher will retry on the next cycle.' -ForegroundColor Yellow
    }

    if ($Once) { break }
    Start-Sleep -Seconds $PollSeconds
} while ($true)
