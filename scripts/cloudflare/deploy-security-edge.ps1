[CmdletBinding()]
param(
    [string]$ConfigPath = 'wrangler.clientsurge-security.toml',
    [switch]$Login,
    [switch]$SkipDryRun,
    [switch]$SkipVerify
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-Step {
    param([Parameter(Mandatory = $true)][string]$Command)

    Write-Host "> $Command" -ForegroundColor Cyan
    & pwsh -NoProfile -Command $Command
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $Command"
    }
}

if ($Login) {
    Invoke-Step 'npx wrangler login'
}

$whoami = & npx wrangler whoami 2>&1
if ($LASTEXITCODE -ne 0 -or ($whoami -join "`n") -match 'not authenticated') {
    throw "Cloudflare Wrangler is not authenticated. Run: npm run cloudflare:security:login"
}

if (-not $SkipDryRun) {
    Invoke-Step "npx wrangler deploy --config $ConfigPath --dry-run"
}

Invoke-Step "npx wrangler deploy --config $ConfigPath"

if (-not $SkipVerify) {
    Invoke-Step 'npm run verify:production-security'
}

Write-Host "Cloudflare security edge deploy complete." -ForegroundColor Green
