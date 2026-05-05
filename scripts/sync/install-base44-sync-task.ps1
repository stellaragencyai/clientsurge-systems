param(
    [string]$RepoPath = (Get-Location).Path,
    [string]$MirrorPath,
    [string]$MirrorBranch = "codex/base44-main-mirror",
    [int]$IntervalMinutes = 15,
    [string]$TaskName = "ClientSurge-Base44-SyncMirror",
    [string]$ActiveRef = ""
)

$ErrorActionPreference = "Stop"

function Require-Value {
    param(
        [string]$Name,
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "Missing required parameter: $Name"
    }
}

Require-Value -Name "MirrorPath" -Value $MirrorPath

$repo = (Resolve-Path -LiteralPath $RepoPath).Path
$scriptPath = Join-Path $repo "scripts\sync\update-base44-sync-mirror.ps1"

if (-not (Test-Path -LiteralPath $scriptPath)) {
    throw "Update script not found: $scriptPath"
}

if ($IntervalMinutes -lt 5) {
    throw "IntervalMinutes must be at least 5."
}

$escapedScript = '"' + $scriptPath + '"'
$escapedRepo = '"' + $repo + '"'
$escapedMirror = '"' + $MirrorPath + '"'
$escapedBranch = '"' + $MirrorBranch + '"'
$escapedActiveRef = '"' + $ActiveRef + '"'

$runnerDir = Join-Path $env:LOCALAPPDATA "ClientSurge"
$runnerPath = Join-Path $runnerDir "base44-sync-runner.ps1"
New-Item -ItemType Directory -Path $runnerDir -Force | Out-Null

$runnerContent = @"
& $escapedScript -RepoPath $escapedRepo -MirrorPath $escapedMirror -MirrorBranch $escapedBranch$(if (-not [string]::IsNullOrWhiteSpace($ActiveRef)) { " -ActiveRef $escapedActiveRef" } else { "" })
"@

Set-Content -Path $runnerPath -Value $runnerContent -Encoding UTF8

$taskCommand = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "' + $runnerPath + '"'

$taskOutput = & schtasks.exe /Create /TN $TaskName /TR $taskCommand /SC MINUTE /MO $IntervalMinutes /F 2>&1
if ($LASTEXITCODE -ne 0) {
    throw "Failed to install scheduled task '$TaskName'. Output: $taskOutput"
}

Write-Output "Installed scheduled task '$TaskName' to update the Base44 sync mirror every $IntervalMinutes minutes."
