[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string]$RepoPath = 'C:\Users\nolan\Code\ClientSurge\clientsurge-systems',
    [string]$MirrorPath = 'C:\Users\nolan\Code\ClientSurge\clientsurge-systems-main-mirror',
    [string]$TaskName = 'ClientSurge Base44 Production Sync',
    [int]$IntervalMinutes = 15,
    [ValidateSet('Primary', 'Failover', 'MirrorOnly')]
    [string]$PublisherRole = 'Primary',
    [int]$FailoverDelayMinutes = 3,
    [string]$ActiveRef = '',
    [switch]$SkipPublishTests,
    [switch]$SkipGitHubChecks,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$productionAppId = '69dc4a79656fdba136d413d3'
$productionUrl = 'https://clientsurgesystems.com'

if (-not (Test-Path $RepoPath)) {
    throw "RepoPath does not exist: $RepoPath"
}

$installer = Join-Path $RepoPath 'scripts/sync/install-base44-sync-task.ps1'
if (-not (Test-Path $installer)) {
    throw "Base44 sync task installer was not found: $installer"
}

$publisherScript = Join-Path $RepoPath 'scripts/base44/watch-main-publish.ps1'
if (-not (Test-Path $publisherScript)) {
    throw "Base44 production publisher was not found: $publisherScript"
}

$publisherText = Get-Content -Path $publisherScript -Raw
if ($publisherText -notmatch [regex]::Escape($productionAppId) -or $publisherText -notmatch [regex]::Escape($productionUrl)) {
    throw "Refusing to install: watch-main-publish.ps1 is not locked to $productionAppId and $productionUrl."
}

$argsList = @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', "`"$installer`"",
    '-RepoPath', "`"$RepoPath`"",
    '-MirrorPath', "`"$MirrorPath`"",
    '-TaskName', "`"$TaskName`"",
    '-IntervalMinutes', $IntervalMinutes,
    '-PublishAfterUpdate',
    '-PublisherRole', $PublisherRole,
    '-FailoverDelayMinutes', $FailoverDelayMinutes
)

if ($ActiveRef) {
    $argsList += @('-ActiveRef', "`"$ActiveRef`"")
}
if ($SkipPublishTests) {
    $argsList += '-SkipPublishTests'
}
if ($SkipGitHubChecks) {
    $argsList += '-SkipGitHubChecks'
}

$commandPreview = "pwsh $($argsList -join ' ')"
Write-Host "Production app: $productionAppId" -ForegroundColor Cyan
Write-Host "Verify URL:     $productionUrl" -ForegroundColor Cyan
Write-Host "Task name:      $TaskName" -ForegroundColor Cyan
Write-Host "Role:           $PublisherRole" -ForegroundColor Cyan
Write-Host "Interval:       $IntervalMinutes minute(s)" -ForegroundColor Cyan
Write-Host "Command:        $commandPreview" -ForegroundColor DarkGray

if ($DryRun) {
    Write-Host 'Dry run only. No scheduled task was installed.' -ForegroundColor Yellow
    exit 0
}

if ($PSCmdlet.ShouldProcess($TaskName, 'Install scheduled Base44 production sync task')) {
    & pwsh @argsList
    if ($LASTEXITCODE -ne 0) {
        throw "Scheduled task installer failed with exit code $LASTEXITCODE."
    }
}

Write-Host "Installed controlled Base44 production sync task for $productionUrl." -ForegroundColor Green
Write-Host "This task watches origin/main via a clean mirror, runs checks, then publishes only the locked production Base44 app." -ForegroundColor Green
