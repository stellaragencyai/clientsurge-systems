[CmdletBinding()]
param(
    [string]$TargetBranch = 'main',
    [int]$DebounceSeconds = 45,
    [switch]$AutoPublish,
    [switch]$Once,
    [switch]$AllowNonMain,
    [switch]$DryRun,
    [switch]$SkipBuild,
    [switch]$SkipTests,
    [string]$CommitMessagePrefix = 'chore(base44): auto sync'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (& git rev-parse --show-toplevel).Trim()
if (-not $repoRoot) {
    throw 'Not inside a git repository.'
}

Set-Location $repoRoot

$includePatterns = @(
    '^base44/(functions|entities|automations|agents)/',
    '^src/',
    '^public/',
    '^tests/',
    '^scripts/base44/',
    '^index\.html$',
    '^package(-lock)?\.json$',
    '^vite\.config\.js$',
    '^tailwind\.config\.js$',
    '^postcss\.config\.js$'
)

$excludePatterns = @(
    '^\.env',
    '\.log$',
    '^node_modules/',
    '^dist/',
    '^reports/',
    '^private-data/',
    '^base44/\.app\.jsonc$',
    '^base44/\.app\.old-broken-copy\.jsonc$'
)

function Invoke-Step {
    param([Parameter(Mandatory = $true)][string]$Command)

    Write-Host "> $Command" -ForegroundColor Cyan
    & pwsh -NoProfile -Command $Command
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $Command"
    }
}

function Convert-ToRepoPath {
    param([Parameter(Mandatory = $true)][string]$Path)

    return $Path.Replace('\', '/')
}

function Test-IncludedPath {
    param([Parameter(Mandatory = $true)][string]$Path)

    $normalized = Convert-ToRepoPath $Path

    foreach ($exclude in $excludePatterns) {
        if ($normalized -match $exclude) {
            return $false
        }
    }

    foreach ($include in $includePatterns) {
        if ($normalized -match $include) {
            return $true
        }
    }

    return $false
}

function Get-ChangedPublishPaths {
    $paths = @()

    foreach ($line in (& git status --porcelain=v1)) {
        if (-not $line -or $line.Length -lt 4) {
            continue
        }

        $path = $line.Substring(3).Trim()
        if ($path -match ' -> ') {
            $path = ($path -split ' -> ')[-1]
        }

        $path = $path.Trim('"')
        if (Test-IncludedPath $path) {
            $paths += $path
        }
    }

    return @($paths | Sort-Object -Unique)
}

function Assert-BranchReady {
    $branch = (& git branch --show-current).Trim()
    if (-not $branch) {
        throw 'Cannot auto-publish from a detached HEAD.'
    }

    if (-not $AllowNonMain -and $branch -ne $TargetBranch) {
        throw "Auto-publish is configured for '$TargetBranch', but current branch is '$branch'. Switch to $TargetBranch or pass -AllowNonMain."
    }

    Invoke-Step 'git fetch origin --prune'

    $remoteBranch = "origin/$branch"
    & git rev-parse --verify $remoteBranch *> $null
    if ($LASTEXITCODE -eq 0) {
        $behindCount = [int]((& git rev-list --count "HEAD..$remoteBranch").Trim())
        if ($behindCount -gt 0) {
            throw "Refusing to auto-push because '$branch' is behind $remoteBranch by $behindCount commit(s). Pull/rebase first."
        }
    }

    return $branch
}

function Invoke-AutoSyncPublish {
    $changedPaths = @(Get-ChangedPublishPaths)
    if ($changedPaths.Count -eq 0) {
        Write-Host 'No publishable changes detected.' -ForegroundColor DarkYellow
        return
    }

    Write-Host 'Publishable changes detected:' -ForegroundColor Yellow
    $changedPaths | ForEach-Object { Write-Host "  $_" }

    if ($DryRun) {
        Write-Host 'Dry run complete. No files staged, committed, pushed, or published.' -ForegroundColor Green
        return
    }

    $branch = Assert-BranchReady

    foreach ($path in $changedPaths) {
        Invoke-Step ("git add -- `"{0}`"" -f $path)
    }

    & git diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host 'No staged changes after filtering.' -ForegroundColor DarkYellow
        return
    }

    if (-not $SkipBuild) {
        Invoke-Step 'npm run build'
    }

    if (-not $SkipTests) {
        Invoke-Step 'node --test tests/adminLoginFlow.test.js tests/base44PublishAutomation.test.js'
    }

    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    Invoke-Step ("git commit -m `"{0}: {1}`"" -f $CommitMessagePrefix, $timestamp)
    Invoke-Step ("git push origin {0}" -f $branch)

    if ($AutoPublish) {
        Invoke-Step 'node scripts/base44/publish-ui-clicker.mjs --yes'
    }
    else {
        Invoke-Step 'base44 dashboard open'
        Write-Host 'GitHub push complete. Base44 dashboard opened; click Publish to release.' -ForegroundColor Yellow
        Write-Host 'Run with -AutoPublish to click Publish automatically after push.'
    }
}

Write-Host "Base44 auto sync watcher started in $repoRoot" -ForegroundColor Green
Write-Host "Branch target: $TargetBranch"
Write-Host "Debounce:      $DebounceSeconds seconds"
Write-Host "AutoPublish:   $AutoPublish"
Write-Host 'Press Ctrl+C to stop.'

if ($Once) {
    Invoke-AutoSyncPublish
    exit 0
}

$pending = $false
$lastChangeAt = Get-Date
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $repoRoot
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

$action = {
    $eventPath = $Event.SourceEventArgs.FullPath
    $relative = [System.IO.Path]::GetRelativePath($repoRoot, $eventPath)
    if (Test-IncludedPath $relative) {
        $script:pending = $true
        $script:lastChangeAt = Get-Date
        Write-Host "Detected change: $relative"
    }
}

$subscriptions = @(
    Register-ObjectEvent $watcher Created -Action $action,
    Register-ObjectEvent $watcher Changed -Action $action,
    Register-ObjectEvent $watcher Deleted -Action $action,
    Register-ObjectEvent $watcher Renamed -Action $action
)

try {
    while ($true) {
        Start-Sleep -Seconds 5
        if (-not $pending) {
            continue
        }

        $ageSeconds = ((Get-Date) - $lastChangeAt).TotalSeconds
        if ($ageSeconds -lt $DebounceSeconds) {
            continue
        }

        $pending = $false
        try {
            Invoke-AutoSyncPublish
        }
        catch {
            Write-Host "Auto sync/publish failed: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host 'Watcher is still running. Fix the issue and save a file to retry.' -ForegroundColor Yellow
        }
    }
}
finally {
    foreach ($subscription in $subscriptions) {
        Unregister-Event -SubscriptionId $subscription.Id -ErrorAction SilentlyContinue
    }
    $watcher.Dispose()
}
