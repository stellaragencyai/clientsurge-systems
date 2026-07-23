[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$StagingAppId,

    [string]$VerifyUrl = '',

    [switch]$DryRun,
    [switch]$SkipInstall,
    [switch]$SkipTests,
    [switch]$SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ProductionAppId = '69dc4a79656fdba136d413d3'

if ($StagingAppId -eq $ProductionAppId) {
    throw 'This Phase 1 runner is staging-only and refuses the production Base44 app ID.'
}

if ($StagingAppId -notmatch '^[0-9a-fA-F]{24}$') {
    throw "Invalid Base44 staging app ID: $StagingAppId"
}

if (-not $DryRun -and [string]::IsNullOrWhiteSpace($VerifyUrl)) {
    throw '-VerifyUrl is required for a real staging deployment.'
}

$repoRoot = (& git rev-parse --show-toplevel).Trim()
if (-not $repoRoot) {
    throw 'Not inside the ClientSurge Git repository.'
}

Set-Location $repoRoot

$dirty = @(& git status --porcelain=v1)
if ($dirty.Count -gt 0) {
    throw 'Refusing to build an exact artifact from a dirty worktree. Commit or stash local changes first.'
}

$sourceSha = (& git rev-parse HEAD).Trim()
$sourceBranch = (& git branch --show-current).Trim()

Write-Host 'ClientSurge Base44 exact-artifact staging proof' -ForegroundColor Cyan
Write-Host "Repository:  $repoRoot"
Write-Host "Branch:      $sourceBranch"
Write-Host "Source SHA:  $sourceSha"
Write-Host "Staging app: $StagingAppId"
Write-Host "Verify URL:  $VerifyUrl"
Write-Host "Dry run:     $DryRun"

if (-not $SkipInstall) {
    Write-Host '> npm ci' -ForegroundColor Cyan
    & npm ci
    if ($LASTEXITCODE -ne 0) {
        throw "npm ci failed with exit code $LASTEXITCODE"
    }
}

$nodeArgs = @(
    'scripts/release/deploy-base44-exact-artifact.mjs',
    '--app-id', $StagingAppId,
    '--sha', $sourceSha,
    '--environment', 'staging',
    '--output', 'tmp/base44-exact-artifact-staging-proof.json'
)

if (-not [string]::IsNullOrWhiteSpace($VerifyUrl)) {
    $nodeArgs += @('--verify-url', $VerifyUrl)
}
if ($DryRun) {
    $nodeArgs += '--dry-run'
}
if ($SkipTests) {
    $nodeArgs += '--skip-tests'
}
if ($SkipBuild) {
    $nodeArgs += '--skip-build'
}

Write-Host "> node $($nodeArgs -join ' ')" -ForegroundColor Cyan
& node @nodeArgs
if ($LASTEXITCODE -ne 0) {
    throw "Exact-artifact staging proof failed with exit code $LASTEXITCODE"
}

Write-Host ''
Write-Host 'Staging proof completed successfully.' -ForegroundColor Green
Write-Host 'Proof: tmp/base44-exact-artifact-staging-proof.json'
Write-Host 'Manifest: dist/release.json'
