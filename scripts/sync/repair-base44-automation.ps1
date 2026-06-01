[CmdletBinding()]
param(
    [string]$RepoPath = 'C:\Users\nolan\Code\ClientSurge\clientsurge-systems',
    [string]$MirrorPath = 'C:\Users\nolan\Code\ClientSurge\clientsurge-systems-main-mirror',
    [string]$ActiveRef = 'merge/base44-69f-into-production-69dc-pushable',
    [ValidateSet('Primary', 'Failover', 'MirrorOnly')]
    [string]$PublisherRole = 'Primary',
    [int]$FailoverDelayMinutes = 3,
    [int]$Base44IntervalMinutes = 1,
    [int]$CloudflareIntervalMinutes = 5,
    [switch]$PublishAfterUpdate,
    [switch]$StartTasks,
    [switch]$SkipPublishTests,
    [switch]$SkipGitHubChecks
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-Native {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [string[]]$Arguments = @(),
        [string]$WorkingDirectory = $RepoPath,
        [switch]$AllowFailure
    )

    Push-Location $WorkingDirectory
    try {
        Write-Host "> $FilePath $($Arguments -join ' ')" -ForegroundColor Cyan
        & $FilePath @Arguments
        if ($LASTEXITCODE -ne 0 -and -not $AllowFailure) {
            throw "Command failed with exit code ${LASTEXITCODE}: $FilePath $($Arguments -join ' ')"
        }
    }
    finally {
        Pop-Location
    }
}

function Get-TaskHealth {
    param([Parameter(Mandatory = $true)][string]$TaskName)

    try {
        $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
        $info = Get-ScheduledTaskInfo -TaskName $TaskName -ErrorAction Stop
        return [pscustomobject]@{
            task_name = $TaskName
            installed = $true
            state = $task.State.ToString()
            last_run_time = $info.LastRunTime
            next_run_time = $info.NextRunTime
            last_task_result = $info.LastTaskResult
        }
    }
    catch {
        return [pscustomobject]@{
            task_name = $TaskName
            installed = $false
            state = 'Missing'
            last_run_time = $null
            next_run_time = $null
            last_task_result = $null
            error = $_.Exception.Message
        }
    }
}

$repoRoot = (& git -C $RepoPath rev-parse --show-toplevel).Trim()
if (-not $repoRoot) {
    throw "RepoPath is not a git repository: $RepoPath"
}

$RepoPath = $repoRoot
$base44TaskName = 'ClientSurge-Base44-SyncMirror'
$cloudflareTaskName = 'ClientSurge-Cloudflare-Security-Edge'

$base44InstallArgs = @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', (Join-Path $RepoPath 'scripts/sync/install-base44-sync-task.ps1'),
    '-RepoPath', $RepoPath,
    '-MirrorPath', $MirrorPath,
    '-TaskName', $base44TaskName,
    '-ActiveRef', $ActiveRef,
    '-IntervalMinutes', $Base44IntervalMinutes,
    '-PublisherRole', $PublisherRole,
    '-FailoverDelayMinutes', $FailoverDelayMinutes
)
if ($PublishAfterUpdate) { $base44InstallArgs += '-PublishAfterUpdate' }
if ($SkipPublishTests) { $base44InstallArgs += '-SkipPublishTests' }
if ($SkipGitHubChecks) { $base44InstallArgs += '-SkipGitHubChecks' }

Invoke-Native pwsh $base44InstallArgs $RepoPath

Invoke-Native pwsh @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', (Join-Path $RepoPath 'scripts/cloudflare/install-security-edge-monitor-task.ps1'),
    '-RepoPath', $RepoPath,
    '-TaskName', $cloudflareTaskName,
    '-IntervalMinutes', $CloudflareIntervalMinutes
) $RepoPath

if ($StartTasks) {
    Write-Host "Starting repaired scheduled tasks for health refresh." -ForegroundColor Yellow
    Start-ScheduledTask -TaskName $base44TaskName
    Start-ScheduledTask -TaskName $cloudflareTaskName
    Start-Sleep -Seconds 20
}

$base44 = Get-TaskHealth -TaskName $base44TaskName
$cloudflare = Get-TaskHealth -TaskName $cloudflareTaskName
$report = [pscustomobject]@{
    ok = ($base44.installed -and $cloudflare.installed -and [int]$base44.last_task_result -eq 0 -and [int]$cloudflare.last_task_result -eq 0)
    checked_at = (Get-Date).ToUniversalTime().ToString('o')
    repo_path = $RepoPath
    mirror_path = $MirrorPath
    tasks = [pscustomobject]@{
        base44 = $base44
        cloudflare = $cloudflare
    }
}

$logDir = Join-Path $RepoPath 'logs/base44-sync'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$reportPath = Join-Path $logDir 'automation-repair-latest.json'
Set-Content -Path $reportPath -Value ($report | ConvertTo-Json -Depth 6) -Encoding UTF8

Write-Host "Automation repair report: $reportPath" -ForegroundColor Green
$report | ConvertTo-Json -Depth 6

Invoke-Native npm @('run', 'sync:status') $RepoPath -AllowFailure

if (-not $report.ok) {
    exit 1
}

