[CmdletBinding()]
param(
    [string]$RepoPath = 'C:\Users\nolan\Code\ClientSurge\clientsurge-systems-main-mirror',
    [string]$TaskName = 'ClientSurge-Exact-Production-Release',
    [int]$IntervalMinutes = 1,
    [switch]$AllowUiFallback,
    [switch]$StartNow
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not (Test-Path $RepoPath)) { throw "Release mirror not found: $RepoPath" }
$watcher = Join-Path $RepoPath 'scripts\base44\watch-main-exact-release.ps1'
if (-not (Test-Path $watcher)) { throw "Watcher not found: $watcher" }

$arguments = @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', ('"' + $watcher + '"'),
    '-RepoPath', ('"' + $RepoPath + '"'),
    '-Once'
)
if ($AllowUiFallback) { $arguments += '-AllowUiFallback' }

$action = New-ScheduledTaskAction -Execute 'pwsh.exe' -Argument ($arguments -join ' ') -WorkingDirectory $RepoPath
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 45)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
Write-Host "Installed scheduled task: $TaskName" -ForegroundColor Green
Write-Host "Mirror: $RepoPath"
Write-Host "Interval: every $IntervalMinutes minute(s)"
Write-Host "The task publishes only a clean main checkout and records success only after exact live SHA verification."

if ($StartNow) {
    Start-ScheduledTask -TaskName $TaskName
    Write-Host 'Task started.' -ForegroundColor Green
}
