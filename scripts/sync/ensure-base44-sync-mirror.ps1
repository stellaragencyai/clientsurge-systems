[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$RepoUrl,
    [Parameter(Mandatory = $true)][string]$MirrorPath,
    [string]$Branch = 'main'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not (Test-Path $MirrorPath)) {
    git clone --branch $Branch $RepoUrl $MirrorPath
    if ($LASTEXITCODE -ne 0) { throw "Failed to clone $RepoUrl to $MirrorPath" }
}

Set-Location $MirrorPath
$repoRoot = (& git rev-parse --show-toplevel).Trim()
if (-not $repoRoot) { throw "Mirror path is not a git repository: $MirrorPath" }

git fetch origin --prune
if ($LASTEXITCODE -ne 0) { throw 'git fetch failed.' }

git checkout $Branch
if ($LASTEXITCODE -ne 0) { throw "Could not checkout $Branch." }

git reset --hard "origin/$Branch"
if ($LASTEXITCODE -ne 0) { throw "Could not fast-reset mirror to origin/$Branch." }

Write-Host "Mirror ready: $repoRoot -> origin/$Branch" -ForegroundColor Green
