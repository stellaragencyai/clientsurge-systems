[CmdletBinding()]
param(
    [string]$RepoPath = 'C:\Users\nolan\Code\ClientSurge\clientsurge-systems',
    [string]$MirrorPath = 'C:\Users\nolan\Code\ClientSurge\clientsurge-systems-main-mirror',
    [string]$TaskName = 'ClientSurge Base44 Main Mirror Sync',
    [string]$ActiveRef = '',
    [int]$IntervalMinutes = 15,
    [switch]$PublishAfterUpdate
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptPath = Join-Path $RepoPath 'scripts/sync/update-base44-sync-mirror.ps1'
$args = @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', "`"$scriptPath`"",
    '-RepoPath', "`"$RepoPath`"",
    '-MirrorPath', "`"$MirrorPath`""
)
if ($ActiveRef) {
    $args += @('-ActiveRef', "`"$ActiveRef`"")
}
if ($PublishAfterUpdate) {
    $args += '-PublishAfterUpdate'
}

$action = New-ScheduledTaskAction -Execute 'pwsh.exe' -Argument ($args -join ' ')
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null

Write-Host "Installed scheduled task '$TaskName' every $IntervalMinutes minute(s)." -ForegroundColor Green
