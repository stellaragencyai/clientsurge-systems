[CmdletBinding()]
param(
    [string]$RepoPath = 'C:\Users\nolan\Code\ClientSurge\clientsurge-systems',
    [string]$TaskName = 'ClientSurge-Cloudflare-Security-Edge',
    [int]$IntervalMinutes = 5
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptPath = Join-Path $RepoPath 'scripts/cloudflare/monitor-security-edge.ps1'
if (-not (Test-Path $scriptPath)) {
    throw "Monitor script not found: $scriptPath"
}

$args = @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', "`"$scriptPath`"",
    '-RepoPath', "`"$RepoPath`""
)

$pwshPath = (Get-Command pwsh.exe).Source
$action = New-ScheduledTaskAction -Execute $pwshPath -Argument ($args -join ' ')
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null

Write-Host "Installed scheduled task '$TaskName' every $IntervalMinutes minute(s)." -ForegroundColor Green
