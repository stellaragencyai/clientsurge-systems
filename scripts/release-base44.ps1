[CmdletBinding()]
param(
    [ValidateSet('auto', 'app-code', 'backend-platform')]
    [string]$PublishMode = 'auto',
    [switch]$SkipBuild,
    [switch]$SkipPush,
    [switch]$SkipOpenDashboard,
    [string[]]$TestCommands = @('node --test tests/seoBreadcrumb.test.js'),
    [string[]]$LintPaths = @(),
    [switch]$SkipFetch,
    [switch]$SkipLint,
    [switch]$RunProductionSecurityGate
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

function Get-TrackedStatusLines {
    $lines = @(& git status --short)
    return @($lines | Where-Object { $_ -and ($_ -notmatch '^\?\?\s') })
}

function Get-RelativeDiffBase {
    param(
        [string]$RemoteBranch
    )

    $mergeBase = (& git merge-base HEAD $RemoteBranch 2>$null).Trim()
    if ($LASTEXITCODE -eq 0 -and $mergeBase) {
        return $mergeBase
    }

    return 'HEAD~1'
}

function Resolve-PublishMode {
    param(
        [string]$RequestedMode,
        [string]$RepoRoot
    )

    if ($RequestedMode -ne 'auto') {
        return $RequestedMode
    }

    if (Test-Path (Join-Path $RepoRoot 'base44/.app.jsonc')) {
        return 'app-code'
    }

    return 'backend-platform'
}

function Test-EslintEligiblePath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $normalized = $Path.Replace('\', '/')
    if ($normalized -eq 'src/Layout.jsx') {
        return $true
    }

    return $normalized -match '^src/(components|pages)/.+\.(js|mjs|cjs|jsx)$'
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
$statusLines = Get-TrackedStatusLines
$allStatusLines = @(& git status --short)
$requestedRemoteBranch = if ($branch) { "origin/$branch" } else { 'origin/main' }
$remoteBranch = $requestedRemoteBranch

Write-Host "Repo:   $repoRoot"
Write-Host "Branch: $branch"
Write-Host "HEAD:   $head"

if ($allStatusLines.Count -gt 0) {
    Write-Host 'Working tree has uncommitted changes:' -ForegroundColor Yellow
    $allStatusLines | ForEach-Object { Write-Host "  $_" }
}

if (-not $SkipFetch) {
    Invoke-CommandString 'git fetch origin --prune'
}

& git rev-parse --verify $remoteBranch *> $null
if ($LASTEXITCODE -ne 0) {
    $remoteBranch = 'origin/main'
    & git rev-parse --verify $remoteBranch *> $null
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not resolve a remote branch for comparison. Expected origin/<current-branch> or origin/main.'
    }
}

$aheadCount = [int]((& git rev-list --count "$remoteBranch..HEAD").Trim())
$behindCount = [int]((& git rev-list --count "HEAD..$remoteBranch").Trim())
$publishModeResolved = Resolve-PublishMode -RequestedMode $PublishMode -RepoRoot $repoRoot

Write-Host "Remote: $remoteBranch"
Write-Host "Ahead:  $aheadCount"
Write-Host "Behind: $behindCount"
Write-Host "Mode:   $publishModeResolved"

if (-not $SkipPush -and $behindCount -gt 0) {
    throw "Refusing to push because '$branch' is behind $remoteBranch by $behindCount commit(s). Pull/rebase first or re-run with -SkipPush."
}

if (-not $SkipPush -and $statusLines.Count -gt 0) {
    throw 'Refusing to push with tracked uncommitted changes. Commit or stash them first, or re-run with -SkipPush.'
}

if (-not $SkipBuild) {
    Invoke-CommandString 'npm run build'
}

foreach ($testCommand in $TestCommands) {
    if ([string]::IsNullOrWhiteSpace($testCommand)) {
        continue
    }

    if ($testCommand -match 'tests/[^^\s"'']+') {
        $testPath = $Matches[0]
        if (-not (Test-Path $testPath)) {
            Write-Host "Skipping missing test target: $testPath" -ForegroundColor Yellow
            continue
        }
    }

    Invoke-CommandString $testCommand
}

if (-not $SkipLint) {
    $resolvedLintPaths = @($LintPaths | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })

    if ($resolvedLintPaths.Count -eq 0) {
        $diffBase = Get-RelativeDiffBase -RemoteBranch $remoteBranch
        $resolvedLintPaths = @(
            & git diff --name-only $diffBase HEAD -- '*.js' '*.jsx' '*.ts' '*.tsx' 2>$null |
                Where-Object { $_ -and (Test-Path $_) -and (Test-EslintEligiblePath $_) }
        )
    }

    $resolvedLintPaths = @($resolvedLintPaths | Where-Object { Test-EslintEligiblePath $_ } | Sort-Object -Unique)

    if ($resolvedLintPaths.Count -gt 0) {
        $quotedPaths = $resolvedLintPaths | ForEach-Object { '"' + $_ + '"' }
        Invoke-CommandString ("npx eslint -- {0}" -f ($quotedPaths -join ' '))
    }
    else {
        Write-Host 'Skipping lint: no ESLint-configured changed source files detected.' -ForegroundColor DarkYellow
    }
}

if (-not $SkipPush) {
    if ($branch -ne 'main') {
        throw "Refusing to push because the current branch is '$branch'. Switch to 'main' or re-run with -SkipPush."
    }

    if ($aheadCount -gt 0) {
        Invoke-CommandString 'git push origin main'
    }
    else {
        Write-Host 'Skipping push: local branch is already up to date with origin/main.' -ForegroundColor DarkYellow
    }
}

switch ($publishModeResolved) {
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
        Write-Host '  3. Run: npm run verify:production-security'
    }
}

if ($RunProductionSecurityGate) {
    Invoke-CommandString 'npm run verify:production-security'
}
else {
    Write-Host ''
    Write-Host 'Production security gate not run automatically.' -ForegroundColor DarkYellow
    Write-Host 'After Base44 Publish completes, run:' -ForegroundColor Yellow
    Write-Host '  npm run verify:production-security'
    Write-Host 'Use -RunProductionSecurityGate only after the live publish has finished.'
}
