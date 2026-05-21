[CmdletBinding()]
param(
    [ValidateSet('app-code', 'backend-platform')]
    [string]$PublishMode = 'app-code',
    [switch]$SkipBuild,
    [switch]$SkipPush,
    [switch]$SkipOpenDashboard,
    [string[]]$TestCommands = @('node --test tests/seoBreadcrumb.test.js'),
    [string[]]$LintPaths = @()
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-CommandString {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command
    )

    Write-Host "> $Command" -ForegroundColor Cyan
    & pwsh -NoProfile -Command $Command
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $Command"
    }
}

function Assert-Tool {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required tool '$Name' was not found in PATH."
    }
}

Assert-Tool git
Assert-Tool npm
Assert-Tool base44
Assert-Tool pwsh

$repoRoot = (& git rev-parse --show-toplevel).Trim()
if (-not $repoRoot) {
    throw 'Not inside a git repository.'
}

Set-Location $repoRoot

$branch = (& git rev-parse --abbrev-ref HEAD).Trim()
$head = (& git rev-parse --short HEAD).Trim()
$statusLines = @(& git status --short)

Write-Host "Repo:   $repoRoot"
Write-Host "Branch: $branch"
Write-Host "HEAD:   $head"

if ($statusLines.Count -gt 0) {
    Write-Host 'Working tree has uncommitted changes:' -ForegroundColor Yellow
    $statusLines | ForEach-Object { Write-Host "  $_" }
}

if (-not $SkipBuild) {
    Invoke-CommandString 'npm run build'
}

foreach ($testCommand in $TestCommands) {
    if ([string]::IsNullOrWhiteSpace($testCommand)) {
        continue
    }

    if ($testCommand -match 'tests/[^\s"'']+') {
        $testPath = $Matches[0]
        if (-not (Test-Path $testPath)) {
            Write-Host "Skipping missing test target: $testPath" -ForegroundColor Yellow
            continue
        }
    }

    Invoke-CommandString $testCommand
}

if ($LintPaths.Count -gt 0) {
    $quotedPaths = $LintPaths | ForEach-Object { '"' + $_ + '"' }
    Invoke-CommandString ("npx eslint -- {0}" -f ($quotedPaths -join ' '))
}

if (-not $SkipPush) {
    if ($branch -ne 'main') {
        throw "Refusing to push because the current branch is '$branch'. Switch to 'main' or re-run with -SkipPush."
    }

    Invoke-CommandString 'git push origin main'
}

switch ($PublishMode) {
    'backend-platform' {
        Invoke-CommandString 'base44 deploy -y'
        Write-Host 'Base44 backend-platform deploy complete.' -ForegroundColor Green
    }

    'app-code' {
        Write-Host ''
        Write-Host 'This repo uses the Base44 app-code / GitHub sync publish flow.' -ForegroundColor Green
        Write-Host 'GitHub is the source sync path; the live release still requires clicking Publish in Base44.'

        if (-not $SkipOpenDashboard) {
            Invoke-CommandString 'base44 dashboard open'
        }

        Write-Host ''
        Write-Host 'Next step:' -ForegroundColor Yellow
        Write-Host '  1. Wait for the GitHub sync to finish in Base44 if needed.'
        Write-Host '  2. Click Publish in the Base44 UI.'
    }
}
