[CmdletBinding()]
param(
    [string]$RepoPath = 'C:\Users\nolan\Code\ClientSurge\clientsurge-systems',
    [string]$MirrorPath = 'C:\Users\nolan\Code\ClientSurge\clientsurge-systems-main-mirror',
    [string]$RepoUrl = 'https://github.com/stellaragencyai/clientsurge-systems.git',
    [string]$Branch = 'main',
    [string]$ActiveRef = '',
    [string]$TaskName = 'ClientSurge-Base44-SyncMirror',
    [int]$IntervalMinutes = 1,
    [int]$WatchdogIntervalMinutes = 5,
    [ValidateSet('Primary', 'Failover', 'MirrorOnly')]
    [string]$PublisherRole = 'MirrorOnly',
    [int]$FailoverDelayMinutes = 3,
    [switch]$InstallDependencies,
    [switch]$PublishAfterUpdate,
    [switch]$SkipPublishTests,
    [switch]$SkipGitHubChecks,
    [switch]$SkipWatchdog
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-Native {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [string[]]$Arguments = @(),
        [string]$WorkingDirectory = (Get-Location).Path
    )

    Push-Location $WorkingDirectory
    try {
        Write-Host "> $FilePath $($Arguments -join ' ')" -ForegroundColor Cyan
        & $FilePath @Arguments
        if ($LASTEXITCODE -ne 0) {
            throw "Command failed with exit code ${LASTEXITCODE}: $FilePath $($Arguments -join ' ')"
        }
    }
    finally {
        Pop-Location
    }
}

if (-not (Test-Path $RepoPath)) {
    $repoParent = Split-Path -Parent $RepoPath
    New-Item -ItemType Directory -Force -Path $repoParent | Out-Null
    Invoke-Native git @('clone', $RepoUrl, $RepoPath) $repoParent
}

$repoRoot = (& git -C $RepoPath rev-parse --show-toplevel).Trim()
if (-not $repoRoot) {
    throw "Active repo path is not a git repository: $RepoPath"
}

$originUrl = (& git -C $repoRoot remote get-url origin).Trim()
if (-not $originUrl) {
    Invoke-Native git @('-C', $repoRoot, 'remote', 'add', 'origin', $RepoUrl) $repoRoot
}

Invoke-Native pwsh @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', (Join-Path $repoRoot 'scripts/sync/ensure-base44-sync-mirror.ps1'),
    '-RepoUrl', $RepoUrl,
    '-MirrorPath', $MirrorPath,
    '-Branch', $Branch
) $repoRoot

if ($InstallDependencies -or -not (Test-Path (Join-Path $MirrorPath 'node_modules'))) {
    Invoke-Native npm @('ci') $MirrorPath
}

try {
    Invoke-Native node @(
        'scripts/base44/check-app-access.mjs',
        '--app-id', '69dc4a79656fdba136d413d3',
        '--verify-url', 'https://clientsurgesystems.com',
        '--json'
    ) $repoRoot
}
catch {
    Write-Host "Base44 production app access check failed. Run 'base44 login' on this machine, then rerun this bootstrap." -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Yellow
}

$installArgs = @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', (Join-Path $repoRoot 'scripts/sync/install-base44-sync-task.ps1'),
    '-RepoPath', $repoRoot,
    '-MirrorPath', $MirrorPath,
    '-TaskName', $TaskName,
    '-IntervalMinutes', $IntervalMinutes,
    '-PublisherRole', $PublisherRole,
    '-FailoverDelayMinutes', $FailoverDelayMinutes
)
if ($ActiveRef) {
    $installArgs += @('-ActiveRef', $ActiveRef)
}
if ($PublishAfterUpdate) {
    $installArgs += '-PublishAfterUpdate'
}
if ($SkipPublishTests) {
    $installArgs += '-SkipPublishTests'
}
if ($SkipGitHubChecks) {
    $installArgs += '-SkipGitHubChecks'
}

Invoke-Native pwsh $installArgs $repoRoot

if (-not $SkipWatchdog) {
    $watchdogArgs = @(
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', (Join-Path $repoRoot 'scripts/sync/install-base44-watchdog-task.ps1'),
        '-RepoPath', $repoRoot,
        '-MirrorPath', $MirrorPath,
        '-ActiveRef', $(if ($ActiveRef) { $ActiveRef } else { '' }),
        '-PublisherRole', $PublisherRole,
        '-FailoverDelayMinutes', $FailoverDelayMinutes,
        '-IntervalMinutes', $WatchdogIntervalMinutes
    )
    if ($SkipPublishTests) {
        $watchdogArgs += '-SkipPublishTests'
    }
    if ($SkipGitHubChecks) {
        $watchdogArgs += '-SkipGitHubChecks'
    }

    Invoke-Native pwsh $watchdogArgs $repoRoot
}

Write-Host "ClientSurge sync bootstrap complete." -ForegroundColor Green
Write-Host "Role: $PublisherRole"
Write-Host "Active repo: $repoRoot"
Write-Host "Clean mirror: $MirrorPath"
Write-Host "Task: $TaskName every $IntervalMinutes minute(s)"
if (-not $SkipWatchdog) {
    Write-Host "Watchdog: ClientSurge-Automation-Watchdog every $WatchdogIntervalMinutes minute(s)"
}
