[CmdletBinding()]
param(
    [string]$RepoPath = 'C:\Users\nolan\Code\ClientSurge\clientsurge-publish-runner',
    [string]$TaskName = 'ClientSurge-Base44-AutoPublish',
    [int]$IntervalMinutes = 1,
    [string]$BrowserProfileDir = (Join-Path $env:USERPROFILE '.base44\publish-browser-profile'),
    [switch]$StartNow
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (& git -C $RepoPath rev-parse --show-toplevel).Trim()
if (-not $repoRoot) { throw "RepoPath is not a git repository: $RepoPath" }
if ((& git -C $repoRoot branch --show-current).Trim() -ne 'main') {
    throw "The auto-publish runner must be on main: $repoRoot"
}
if (@(& git -C $repoRoot status --porcelain=v1).Count -gt 0) {
    throw "The auto-publish runner must be clean: $repoRoot"
}

$scriptPath = Join-Path $repoRoot 'scripts/base44/watch-main-publish.ps1'
$pwshPath = (Get-Command pwsh.exe).Source
$arguments = @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', "`"$scriptPath`"",
    '-Once',
    '-FallbackToUiClick',
    '-SkipStagingMirrors',
    '-BrowserProfileDir', "`"$BrowserProfileDir`""
)
$action = New-ScheduledTaskAction -Execute $pwshPath -Argument ($arguments -join ' ') -WorkingDirectory $repoRoot
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 30)
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null

if ($StartNow) { Start-ScheduledTask -TaskName $TaskName }
Write-Host "Installed '$TaskName' every $IntervalMinutes minute(s)." -ForegroundColor Green
Write-Host "Runner:  $repoRoot"
Write-Host "Profile: $BrowserProfileDir"
