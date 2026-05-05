param(
    [string]$RepoPath = (Get-Location).Path,
    [string]$ActiveRef = "",
    [string]$IncomingRef = "origin/main",
    [string]$OutputPath = ""
)

$ErrorActionPreference = "Stop"

function Resolve-RepoPath {
    param([string]$PathValue)

    $resolved = (Resolve-Path -LiteralPath $PathValue).Path
    if (-not (Test-Path -LiteralPath (Join-Path $resolved ".git"))) {
        throw "RepoPath is not a git repository: $resolved"
    }

    return $resolved
}

function Get-CurrentBranch {
    param([string]$Repo)

    $branch = (git -C $Repo branch --show-current).Trim()
    if ([string]::IsNullOrWhiteSpace($branch)) {
        throw "Could not determine current branch for $Repo"
    }

    return $branch
}

function Get-ChangedFiles {
    param(
        [string]$Repo,
        [string]$FromRef,
        [string]$ToRef
    )

    $mergeBase = (git -C $Repo merge-base $FromRef $ToRef).Trim()
    if ([string]::IsNullOrWhiteSpace($mergeBase)) {
        throw "Could not determine merge-base for $FromRef and $ToRef"
    }

    $files = git -C $Repo diff --name-only "$mergeBase..$ToRef"
    return @{
        merge_base = $mergeBase
        files = @($files | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    }
}

function Test-PathMatch {
    param(
        [string]$PathValue,
        [string[]]$Patterns
    )

    foreach ($pattern in $Patterns) {
        if ($PathValue -like $pattern) {
            return $true
        }
    }

    return $false
}

$repo = Resolve-RepoPath -PathValue $RepoPath

Push-Location $repo
try {
    git fetch origin --prune | Out-Null

    if ([string]::IsNullOrWhiteSpace($ActiveRef)) {
        $ActiveRef = Get-CurrentBranch -Repo $repo
    }

    $incomingChanged = Get-ChangedFiles -Repo $repo -FromRef $ActiveRef -ToRef $IncomingRef
    $activeChanged = Get-ChangedFiles -Repo $repo -FromRef $IncomingRef -ToRef $ActiveRef

    $incomingFiles = @($incomingChanged.files)
    $activeFiles = @($activeChanged.files)
    $overlapFiles = @($incomingFiles | Where-Object { $activeFiles -contains $_ } | Sort-Object -Unique)
    $dirtyFiles = @((git -C $repo status --porcelain | ForEach-Object { $_.Substring(3) }) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })

    $criticalPatterns = @(
        "base44/functions/*",
        "base44/entities/*",
        "src/App.jsx",
        "src/main.jsx",
        "src/pages/Contact*",
        "src/pages/Book*",
        "src/pages/Store*",
        "src/pages/ClientPortal*",
        "src/pages/Admin*",
        "src/components/forms/*",
        "src/components/leads/*",
        "src/components/store/*",
        "src/lib/app-params.js",
        "src/lib/analytics.js",
        "index.html",
        "package.json",
        "vite.config.js"
    )

    $reviewPatterns = @(
        "src/components/landing/*",
        "src/components/industry/*",
        "src/pages/*",
        "public/*",
        "tests/*",
        "qa/*"
    )

    $safePatterns = @(
        ".agents/*",
        "docs/*",
        "scripts/*",
        "README.md",
        "src/*README*",
        "src/*REPORT*",
        "src/*CHECKLIST*",
        "src/*GUIDE*",
        "src/*ROADMAP*",
        "src/*SUMMARY*",
        "src/*PLAN*"
    )

    $criticalIncoming = @($incomingFiles | Where-Object { Test-PathMatch -PathValue $_ -Patterns $criticalPatterns } | Sort-Object -Unique)
    $criticalOverlap = @($overlapFiles | Where-Object { Test-PathMatch -PathValue $_ -Patterns $criticalPatterns } | Sort-Object -Unique)
    $reviewIncoming = @($incomingFiles | Where-Object { Test-PathMatch -PathValue $_ -Patterns $reviewPatterns } | Sort-Object -Unique)
    $dirtyCritical = @($dirtyFiles | Where-Object { Test-PathMatch -PathValue $_ -Patterns $criticalPatterns } | Sort-Object -Unique)

    $classification = "safe"
    $reasons = New-Object System.Collections.Generic.List[string]

    if ($criticalOverlap.Count -gt 0) {
        $classification = "conflict"
        $reasons.Add("Incoming mainline changes overlap active branch changes in business-critical files.")
    }
    elseif ($overlapFiles.Count -gt 0) {
        $classification = "review"
        $reasons.Add("Incoming mainline changes overlap active branch work in non-critical files.")
    }
    elseif ($criticalIncoming.Count -gt 0) {
        $classification = "review"
        $reasons.Add("Incoming mainline changes touch critical paths even though they do not overlap current branch work.")
    }
    elseif ($reviewIncoming.Count -gt 0) {
        $classification = "review"
        $reasons.Add("Incoming mainline changes touch user-facing or test surfaces that should be reviewed before ingestion.")
    }

    if ($dirtyCritical.Count -gt 0 -and $classification -ne "conflict") {
        $classification = "review"
        $reasons.Add("The current worktree has uncommitted changes in critical files.")
    }

    $safeIncoming = @($incomingFiles | Where-Object { Test-PathMatch -PathValue $_ -Patterns $safePatterns } | Sort-Object -Unique)

    if ($incomingFiles.Count -eq 0) {
        $classification = "safe"
        $reasons.Clear()
        $reasons.Add("No incoming mainline changes relative to the active branch.")
    }

    $result = [pscustomobject]@{
        timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss zzz")
        repo = $repo
        active_ref = $ActiveRef
        incoming_ref = $IncomingRef
        incoming_merge_base = $incomingChanged.merge_base
        active_merge_base = $activeChanged.merge_base
        classification = $classification
        reasons = @($reasons)
        incoming_files = $incomingFiles
        active_only_files = $activeFiles
        overlapping_files = $overlapFiles
        incoming_critical_files = $criticalIncoming
        overlapping_critical_files = $criticalOverlap
        dirty_files = $dirtyFiles
        dirty_critical_files = $dirtyCritical
        incoming_safe_files = $safeIncoming
    }

    if (-not [string]::IsNullOrWhiteSpace($OutputPath)) {
        $outputDir = Split-Path -Path $OutputPath -Parent
        if (-not [string]::IsNullOrWhiteSpace($outputDir)) {
            New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
        }
        $result | ConvertTo-Json -Depth 6 | Set-Content -Path $OutputPath -Encoding UTF8
    }

    $result | ConvertTo-Json -Depth 6
}
finally {
    Pop-Location
}
