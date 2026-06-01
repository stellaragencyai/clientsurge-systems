[CmdletBinding()]
param(
    [switch]$AutoClickPublish,
    [switch]$SkipBuild,
    [switch]$SkipTests,
    [switch]$DryRunClick
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

$backendPattern = '^(base44/(functions|entities|automations|agents)/|base44/\.app\.jsonc|base44/config\.jsonc)'
$statusPaths = @(
    & git status --short |
        ForEach-Object { $_.Substring(3).Trim() } |
        Where-Object { $_ }
)
$upstream = (& git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>$null)
$unpushedPaths = @()
if ($LASTEXITCODE -eq 0 -and $upstream) {
    $unpushedPaths = @(& git diff --name-only "$upstream..HEAD" 2>$null | Where-Object { $_ })
}

$backendChanges = @($statusPaths + $unpushedPaths | Sort-Object -Unique | Where-Object { $_ -replace '\\', '/' -match $backendPattern })

if ($backendChanges.Count -eq 0) {
    Write-Host 'No backend/Base44 changes detected. Nothing to publish.' -ForegroundColor DarkYellow
    exit 0
}

Write-Host 'Backend/Base44 changes detected:' -ForegroundColor Yellow
$backendChanges | ForEach-Object { Write-Host "  $_" }

if (-not $SkipBuild) {
    Invoke-Step 'npm run build'
}

if (-not $SkipTests) {
    Invoke-Step 'node --test tests/adminLoginFlow.test.js tests/base44FunctionsCheck.test.js'
}

Invoke-Step 'base44 dashboard open'

if ($AutoClickPublish -or $DryRunClick) {
    $clickMode = if ($AutoClickPublish) { '--yes' } else { '--dry-run' }
    Invoke-Step "node scripts/base44/publish-ui-clicker.mjs $clickMode"
}
else {
    Write-Host ''
    Write-Host 'Base44 dashboard opened. Review the synced changes, then click Publish.' -ForegroundColor Yellow
    Write-Host 'To let the helper click Publish after checks, rerun with:'
    Write-Host '  pwsh -File scripts/base44/publish-backend-changes.ps1 -AutoClickPublish'
}
