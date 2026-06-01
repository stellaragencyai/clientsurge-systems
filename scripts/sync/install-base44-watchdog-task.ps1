[CmdletBinding()]
param(
    [string]$RepoPath = 'C:\Users\nolan\Code\ClientSurge\clientsurge-systems',
    [string]$MirrorPath = 'C:\Users\nolan\Code\ClientSurge\clientsurge-systems-main-mirror',
    [string]$TaskName = 'ClientSurge-Automation-Watchdog',
    [string]$ActiveRef = 'merge/base44-69f-into-production-69dc-pushable',
    [ValidateSet('Primary', 'Failover', 'MirrorOnly')]
    [string]$PublisherRole = 'Primary',
    [int]$FailoverDelayMinutes = 3,
    [int]$IntervalMinutes = 5,
    [switch]$SkipPublishTests,
    [switch]$SkipGitHubChecks,
    [switch]$NoRepairTasks
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (& git -C $RepoPath rev-parse --show-toplevel).Trim()
if (-not $repoRoot) {
    throw "RepoPath is not a git repository: $RepoPath"
}

$RepoPath = $repoRoot
$scriptPath = Join-Path $RepoPath 'scripts/sync/watchdog-base44-automation.ps1'
$args = @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', "`"$scriptPath`"",
    '-RepoPath', "`"$RepoPath`"",
    '-MirrorPath', "`"$MirrorPath`"",
    '-ActiveRef', "`"$ActiveRef`"",
    '-PublisherRole', $PublisherRole,
    '-FailoverDelayMinutes', $FailoverDelayMinutes
)
if ($SkipPublishTests) { $args += '-SkipPublishTests' }
if ($SkipGitHubChecks) { $args += '-SkipGitHubChecks' }
if ($NoRepairTasks) { $args += '-NoRepairTasks' }

$pwshPath = (Get-Command pwsh.exe).Source
$action = New-ScheduledTaskAction -Execute $pwshPath -Argument ($args -join ' ')
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null

Write-Host "Installed scheduled task '$TaskName' every $IntervalMinutes minute(s)." -ForegroundColor Green
