[CmdletBinding()]
param(
    [string]$RepoPath = 'C:\Users\nolan\Code\ClientSurge\clientsurge-systems',
    [string]$MirrorPath = 'C:\Users\nolan\Code\ClientSurge\clientsurge-systems-main-mirror',
    [string]$ActiveRef = 'merge/base44-69f-into-production-69dc-pushable',
    [ValidateSet('Primary', 'Failover', 'MirrorOnly')]
    [string]$PublisherRole = 'Primary',
    [int]$FailoverDelayMinutes = 3,
    [switch]$SkipPublishTests,
    [switch]$SkipGitHubChecks,
    [switch]$NoRepairTasks
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
        $output = & $FilePath @Arguments 2>&1
        $exitCode = $LASTEXITCODE
        foreach ($line in @($output)) {
            if ($line -is [System.Management.Automation.ErrorRecord]) {
                Write-Host $line.ToString() -ForegroundColor Red
            }
            else {
                Write-Host $line
            }
        }
        if ($exitCode -ne 0 -and -not $AllowFailure) {
            throw "Command failed with exit code ${exitCode}: $FilePath $($Arguments -join ' ')"
        }
        return $exitCode
    }
    finally {
        Pop-Location
    }
}

function Get-SyncStatus {
    param([Parameter(Mandatory = $true)][string]$Label)

    Push-Location $RepoPath
    try {
        $output = & node scripts/sync/audit-sync-status.mjs --json --ignore-active-worktree 2>&1
        $exitCode = $LASTEXITCODE
        $text = ($output | Out-String).Trim()
        $parsed = $null
        $parseError = $null

        if ($text) {
            try {
                $parsed = $text | ConvertFrom-Json
            }
            catch {
                $parseError = $_.Exception.Message
            }
        }

        return [pscustomobject]@{
            label = $Label
            ok = ($exitCode -eq 0 -and $null -ne $parsed -and $parsed.summary.ok)
            exit_code = $exitCode
            report = $parsed
            parse_error = $parseError
            raw = if ($parseError) { $text } else { $null }
        }
    }
    finally {
        Pop-Location
    }
}

function Get-Failures {
    param($Status)

    if ($null -eq $Status -or $null -eq $Status.report -or $null -eq $Status.report.summary) {
        return @('Sync status could not be parsed.')
    }

    return @($Status.report.summary.failures)
}

function Test-NeedsTaskRepair {
    param([string[]]$Failures)

    foreach ($failure in $Failures) {
        if ($failure -match 'scheduled task|task is missing|task is failing') {
            return $true
        }
    }
    return $false
}

$repoRoot = (& git -C $RepoPath rev-parse --show-toplevel).Trim()
if (-not $repoRoot) {
    throw "RepoPath is not a git repository: $RepoPath"
}

$RepoPath = $repoRoot
$machine = $env:COMPUTERNAME
$logDir = Join-Path $RepoPath "logs/base44-sync/$machine"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$actions = New-Object System.Collections.Generic.List[object]
$before = @(Get-SyncStatus -Label 'before') | Select-Object -Last 1
$beforeFailures = Get-Failures -Status $before

if (-not $before.ok) {
    $updateArgs = @(
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-File', (Join-Path $RepoPath 'scripts/sync/update-base44-sync-mirror.ps1'),
        '-RepoPath', $RepoPath,
        '-MirrorPath', $MirrorPath,
        '-ActiveRef', $ActiveRef,
        '-PublishAfterUpdate',
        '-PublisherRole', $PublisherRole,
        '-FailoverDelayMinutes', $FailoverDelayMinutes
    )
    if ($SkipPublishTests) { $updateArgs += '-SkipPublishTests' }
    if ($SkipGitHubChecks) { $updateArgs += '-SkipGitHubChecks' }

    $updateExit = Invoke-Native pwsh $updateArgs $RepoPath -AllowFailure
    $actions.Add([pscustomobject]@{
        action = 'update-mirror-and-publish-if-needed'
        exit_code = $updateExit
    }) | Out-Null

    if (-not $NoRepairTasks -and (Test-NeedsTaskRepair -Failures $beforeFailures)) {
        $repairArgs = @(
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-File', (Join-Path $RepoPath 'scripts/sync/repair-base44-automation.ps1'),
            '-RepoPath', $RepoPath,
            '-MirrorPath', $MirrorPath,
            '-ActiveRef', $ActiveRef,
            '-PublisherRole', $PublisherRole,
            '-FailoverDelayMinutes', $FailoverDelayMinutes,
            '-PublishAfterUpdate'
        )
        if ($SkipPublishTests) { $repairArgs += '-SkipPublishTests' }
        if ($SkipGitHubChecks) { $repairArgs += '-SkipGitHubChecks' }

        $repairExit = Invoke-Native pwsh $repairArgs $RepoPath -AllowFailure
        $actions.Add([pscustomobject]@{
            action = 'repair-scheduled-tasks'
            exit_code = $repairExit
        }) | Out-Null
    }
}
else {
    $actions.Add([pscustomobject]@{
        action = 'none'
        exit_code = 0
        reason = 'sync-status-ok'
    }) | Out-Null
}

$after = @(Get-SyncStatus -Label 'after') | Select-Object -Last 1
$report = [ordered]@{
    ok = [bool]$after.ok
    checked_at = (Get-Date).ToUniversalTime().ToString('o')
    machine = $machine
    repo_path = $RepoPath
    mirror_path = $MirrorPath
    publisher_role = $PublisherRole
    before = $before
    actions = @($actions.ToArray())
    after = $after
}

$reportPath = Join-Path $logDir 'automation-watchdog-latest.json'
Set-Content -Path $reportPath -Value ($report | ConvertTo-Json -Depth 12) -Encoding UTF8

Write-Host "Automation watchdog report: $reportPath" -ForegroundColor Green
if ($after.ok) {
    Write-Host "ClientSurge sync automation is healthy." -ForegroundColor Green
}
else {
    Write-Host "ClientSurge sync automation still needs attention." -ForegroundColor Yellow
}

$report | ConvertTo-Json -Depth 12
if (-not $after.ok) {
    exit 1
}
