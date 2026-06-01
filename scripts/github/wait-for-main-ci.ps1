[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Sha,
    [string]$Branch = 'main',
    [string]$Workflow = 'clientsurge-release-gate.yml',
    [int]$TimeoutSeconds = 1800,
    [int]$PollSeconds = 20
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw 'GitHub CLI is required for the release gate. Install/authenticate gh or rerun with -SkipGitHubChecks.'
}

function Get-WorkflowRuns {
    $json = & gh run list `
        --workflow $Workflow `
        --branch $Branch `
        --commit $Sha `
        --limit 5 `
        --json status,conclusion,url,headSha,workflowName,createdAt,updatedAt 2>&1

    if ($LASTEXITCODE -ne 0) {
        throw "Could not read GitHub workflow runs for $Workflow on $Branch@$Sha. $json"
    }

    if (-not $json) {
        return @()
    }

    return @($json | ConvertFrom-Json)
}

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
Write-Host "Waiting for GitHub release gate '$Workflow' on $Branch@$Sha." -ForegroundColor Cyan

do {
    $runs = @(Get-WorkflowRuns)
    $run = $runs | Where-Object { $_.headSha -eq $Sha } | Sort-Object updatedAt -Descending | Select-Object -First 1

    if ($null -eq $run) {
        Write-Host "No release-gate run found yet for $Sha; waiting $PollSeconds second(s)." -ForegroundColor Yellow
    }
    elseif ($run.status -eq 'completed' -and $run.conclusion -eq 'success') {
        Write-Host "GitHub release gate passed: $($run.url)" -ForegroundColor Green
        exit 0
    }
    elseif ($run.status -eq 'completed') {
        throw "GitHub release gate finished with conclusion '$($run.conclusion)': $($run.url)"
    }
    else {
        Write-Host "GitHub release gate is $($run.status): $($run.url)" -ForegroundColor Yellow
    }

    if ((Get-Date) -ge $deadline) {
        throw "Timed out waiting for GitHub release gate '$Workflow' on $Branch@$Sha."
    }

    Start-Sleep -Seconds $PollSeconds
} while ($true)

