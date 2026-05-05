param(
    [string]$RepoPath = (Get-Location).Path,
    [string]$MirrorPath,
    [string]$MirrorBranch = "codex/base44-main-mirror"
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

if (Test-Path -LiteralPath $MirrorPath) {
    throw "MirrorPath already exists. Refusing to overwrite: $MirrorPath"
}

Push-Location $repo
try {
    git fetch origin --prune | Out-Null

    $existingBranch = git branch --list $MirrorBranch
    if (-not [string]::IsNullOrWhiteSpace($existingBranch)) {
        throw "Mirror branch already exists locally: $MirrorBranch"
    }

    git worktree add -b $MirrorBranch $MirrorPath origin/main
    Write-Output "Created sync mirror at $MirrorPath on branch $MirrorBranch tracking origin/main."
}
finally {
    Pop-Location
}
