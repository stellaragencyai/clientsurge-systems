[CmdletBinding()]
param(
    [string]$RepoPath = (Get-Location).Path,
    [string]$ActiveRef = 'HEAD',
    [string]$IncomingRef = 'origin/main',
    [string]$OutputDir = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Set-Location $RepoPath
$repoRoot = (& git rev-parse --show-toplevel).Trim()
Set-Location $repoRoot

$criticalPatterns = @(
    '^src/App\.jsx$',
    '^src/lib/AuthContext\.jsx$',
    '^src/components/forms/',
    '^src/components/admin/',
    '^src/components/portal/',
    '^src/pages/(Store|Book|Contact|Login)\.jsx$',
    '^base44/functions/',
    '^base44/entities/',
    '^base44/automations/',
    '^package(-lock)?\.json$',
    '^vite\.config\.js$'
)

git fetch origin --prune | Out-Null

$activeBase = (& git merge-base $ActiveRef $IncomingRef 2>$null).Trim()
if (-not $activeBase) {
    $activeBase = 'HEAD'
}

$incomingFiles = @(& git diff --name-only $activeBase $IncomingRef | Where-Object { $_ })
$activeFiles = @(& git diff --name-only $activeBase $ActiveRef | Where-Object { $_ })
$overlap = @($incomingFiles | Where-Object { $activeFiles -contains $_ } | Sort-Object -Unique)
$criticalIncoming = @(
    $incomingFiles | Where-Object {
        $file = $_
        $criticalPatterns | Where-Object { $file -match $_ } | Select-Object -First 1
    } | Sort-Object -Unique
)

$classification = 'safe'
if ($overlap.Count -gt 0) {
    $classification = 'conflict'
}
elseif ($criticalIncoming.Count -gt 0) {
    $classification = 'review'
}

$result = [ordered]@{
    repo = $repoRoot
    active_ref = $ActiveRef
    incoming_ref = $IncomingRef
    classification = $classification
    incoming_count = $incomingFiles.Count
    active_count = $activeFiles.Count
    overlap = $overlap
    critical_incoming = $criticalIncoming
    checked_at = (Get-Date).ToString('o')
}

$json = $result | ConvertTo-Json -Depth 6
$text = @(
    "Classification: $classification",
    "Incoming: $($incomingFiles.Count)",
    "Active: $($activeFiles.Count)",
    "Overlap: $($overlap.Count)",
    '',
    'Overlap files:',
    ($overlap -join [Environment]::NewLine),
    '',
    'Critical incoming files:',
    ($criticalIncoming -join [Environment]::NewLine)
) -join [Environment]::NewLine

if ($OutputDir) {
    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
    Set-Content -Path (Join-Path $OutputDir 'latest-overlap.json') -Value $json -Encoding UTF8
    Set-Content -Path (Join-Path $OutputDir 'latest-overlap.txt') -Value $text -Encoding UTF8
}

Write-Output $text
