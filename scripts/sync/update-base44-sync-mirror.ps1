[CmdletBinding()]
param(
    [string]$RepoPath = 'C:\Users\nolan\Code\ClientSurge\clientsurge-systems',
    [string]$MirrorPath = 'C:\Users\nolan\Code\ClientSurge\clientsurge-systems-main-mirror',
    [string]$Branch = 'main',
    [string]$ActiveRef = '',
    [switch]$PublishAfterUpdate
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoUrl = (& git -C $RepoPath remote get-url origin).Trim()
if (-not $repoUrl) { throw "Could not resolve origin URL from $RepoPath" }

if (-not (Test-Path $MirrorPath)) {
    & pwsh -NoProfile -File (Join-Path $RepoPath 'scripts/sync/ensure-base44-sync-mirror.ps1') -RepoUrl $repoUrl -MirrorPath $MirrorPath -Branch $Branch
}

Set-Location $MirrorPath
$dirty = @(& git status --porcelain=v1)
if ($dirty.Count -gt 0) {
    throw "Mirror worktree is dirty: $MirrorPath"
}

git fetch origin --prune
if ($LASTEXITCODE -ne 0) { throw 'git fetch failed.' }
git checkout $Branch
if ($LASTEXITCODE -ne 0) { throw "Could not checkout $Branch." }
git merge --ff-only "origin/$Branch"
if ($LASTEXITCODE -ne 0) { throw "Mirror cannot fast-forward to origin/$Branch." }

$sha = (& git rev-parse HEAD).Trim()
$title = (& git log -1 --pretty=%s).Trim()
$machine = $env:COMPUTERNAME
$logDir = Join-Path $RepoPath "logs/base44-sync/$machine"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
Set-Content -Path (Join-Path $logDir 'latest-sync.txt') -Value "$sha $title" -Encoding UTF8

if ($ActiveRef) {
    & pwsh -NoProfile -File (Join-Path $RepoPath 'scripts/sync/classify-base44-overlap.ps1') -RepoPath $RepoPath -ActiveRef $ActiveRef -IncomingRef "origin/$Branch" -OutputDir $logDir
}

if ($PublishAfterUpdate) {
    & pwsh -NoProfile -File (Join-Path $MirrorPath 'scripts/base44/watch-main-publish.ps1') -Once
}

Write-Host "Mirror updated to $sha $title" -ForegroundColor Green
