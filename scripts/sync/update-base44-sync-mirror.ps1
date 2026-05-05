param(
    [string]$RepoPath = (Get-Location).Path,
    [string]$MirrorPath,
    [string]$MirrorBranch = "codex/base44-main-mirror",
    [string]$LogRoot = "",
    [string]$ActiveRef = "",
    [string]$IncomingRef = "origin/main"
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

$repo = (Resolve-Path -LiteralPath $RepoPath).Path
Require-Value -Name "MirrorPath" -Value $MirrorPath

if (-not (Test-Path -LiteralPath (Join-Path $repo ".git"))) {
    throw "RepoPath is not a git repository: $repo"
}

if (-not (Test-Path -LiteralPath $MirrorPath)) {
    throw "MirrorPath does not exist: $MirrorPath"
}

$mirror = (Resolve-Path -LiteralPath $MirrorPath).Path
$classifierPath = Join-Path $repo "scripts\sync\classify-base44-overlap.ps1"

if ([string]::IsNullOrWhiteSpace($LogRoot)) {
    $LogRoot = Join-Path $repo "logs\base44-sync\$env:COMPUTERNAME"
}

New-Item -ItemType Directory -Path $LogRoot -Force | Out-Null

Push-Location $repo
try {
    git fetch origin --prune | Out-Null

    $mirrorStatus = git -C $mirror status --porcelain
    if (-not [string]::IsNullOrWhiteSpace($mirrorStatus)) {
        throw "Mirror worktree is dirty. Refusing to update automatically: $mirror"
    }

    $currentBranch = (git -C $mirror branch --show-current).Trim()
    if ($currentBranch -ne $MirrorBranch) {
        throw "Mirror branch mismatch. Expected $MirrorBranch but found $currentBranch."
    }

    $beforeSha = (git -C $mirror rev-parse HEAD).Trim()
    $beforeTitle = (git -C $mirror log -1 --pretty=%s).Trim()

    git -C $mirror fetch origin --prune | Out-Null
    git -C $mirror merge --ff-only origin/main | Out-Null

    $afterSha = (git -C $mirror rev-parse HEAD).Trim()
    $afterTitle = (git -C $mirror log -1 --pretty=%s).Trim()
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss zzz")

    $summary = [pscustomobject]@{
        timestamp = $timestamp
        repo = $repo
        mirror = $mirror
        branch = $MirrorBranch
        before_sha = $beforeSha
        before_title = $beforeTitle
        after_sha = $afterSha
        after_title = $afterTitle
        changed = ($beforeSha -ne $afterSha)
    }

    $jsonPath = Join-Path $LogRoot "latest.json"
    $textPath = Join-Path $LogRoot "latest.txt"

    $summary | ConvertTo-Json -Depth 5 | Set-Content -Path $jsonPath -Encoding UTF8
    @(
        "timestamp: $timestamp"
        "mirror: $mirror"
        "branch: $MirrorBranch"
        "before: $beforeSha $beforeTitle"
        "after:  $afterSha $afterTitle"
        "changed: $($beforeSha -ne $afterSha)"
    ) | Set-Content -Path $textPath -Encoding UTF8

    if (-not [string]::IsNullOrWhiteSpace($ActiveRef) -and (Test-Path -LiteralPath $classifierPath)) {
        $overlapJsonPath = Join-Path $LogRoot "latest-overlap.json"
        $overlapTextPath = Join-Path $LogRoot "latest-overlap.txt"

        try {
            $rawOverlap = powershell -NoProfile -ExecutionPolicy Bypass -File $classifierPath `
                -RepoPath $repo `
                -ActiveRef $ActiveRef `
                -IncomingRef $IncomingRef `
                -OutputPath $overlapJsonPath

            $overlap = $rawOverlap | ConvertFrom-Json
            @(
                "timestamp: $($overlap.timestamp)"
                "active_ref: $($overlap.active_ref)"
                "incoming_ref: $($overlap.incoming_ref)"
                "classification: $($overlap.classification)"
                "reasons: $([string]::Join(' | ', $overlap.reasons))"
            ) | Set-Content -Path $overlapTextPath -Encoding UTF8
        }
        catch {
            $errorPath = Join-Path $LogRoot "latest-overlap-error.txt"
            $_ | Out-String | Set-Content -Path $errorPath -Encoding UTF8
            Write-Warning "Overlap classification failed: $($_.Exception.Message)"
        }
    }

    if ($beforeSha -ne $afterSha) {
        Write-Output "Mirror updated to $afterSha ($afterTitle)"
    }
    else {
        Write-Output "Mirror already up to date at $afterSha ($afterTitle)"
    }
}
finally {
    Pop-Location
}
