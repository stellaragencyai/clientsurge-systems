[CmdletBinding()]
param(
    [switch]$UseLiveKey,
    [switch]$SkipLogin,
    [string]$WebhookForwardTo = "",
    [string]$PublishableKey = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-StripeCli {
    $cmd = Get-Command stripe -ErrorAction SilentlyContinue
    if ($cmd) {
        return $cmd.Source
    }

    $wingetPath = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages\Stripe.StripeCli_Microsoft.Winget.Source_8wekyb3d8bbwe\stripe.exe"
    if (Test-Path $wingetPath) {
        return $wingetPath
    }

    throw "Stripe CLI was not found. Install it first with: winget install --id Stripe.StripeCli --source winget"
}

function Mask-Secret {
    param([string]$Value)
    if ([string]::IsNullOrWhiteSpace($Value)) {
        return "missing"
    }
    if ($Value.Length -le 12) {
        return "$($Value.Substring(0, [Math]::Min(4, $Value.Length)))..."
    }
    return "$($Value.Substring(0, 7))...$($Value.Substring($Value.Length - 4))"
}

function Read-StripeConfigValue {
    param(
        [string]$ConfigPath,
        [string]$Name
    )

    if (-not (Test-Path $ConfigPath)) {
        return ""
    }

    $pattern = "^\s*$([regex]::Escape($Name))\s*=\s*['`"]([^'`"]+)['`"]"
    foreach ($line in Get-Content -Path $ConfigPath) {
        if ($line -match $pattern) {
            return $Matches[1]
        }
    }

    return ""
}

function Invoke-StripeLogin {
    param([string]$StripeExe)

    Write-Host "Starting Stripe CLI browser authorization..." -ForegroundColor Cyan
    $loginJson = & $StripeExe login --non-interactive | Out-String
    if ($LASTEXITCODE -ne 0) {
        throw "stripe login --non-interactive failed."
    }

    $login = $loginJson | ConvertFrom-Json
    Write-Host "Pairing code: $($login.verification_code)" -ForegroundColor Yellow
    Write-Host "Opening Stripe authorization page in your browser..." -ForegroundColor Cyan
    Start-Process $login.browser_url

    if ($login.next_step -notmatch "--complete '([^']+)'") {
        throw "Could not parse Stripe CLI completion URL."
    }

    $completeUrl = $Matches[1]
    Write-Host "Waiting for Stripe approval..." -ForegroundColor Cyan
    & $StripeExe login --complete $completeUrl
    if ($LASTEXITCODE -ne 0) {
        throw "Stripe CLI login did not complete. Approve the browser prompt and rerun this script."
    }
}

$stripeExe = Resolve-StripeCli
$configPath = Join-Path $env:USERPROFILE ".config\stripe\config.toml"

Write-Host "Stripe CLI: $stripeExe"
& $stripeExe version

if (-not $SkipLogin -and -not (Test-Path $configPath)) {
    Invoke-StripeLogin -StripeExe $stripeExe
}

$testModeKey = Read-StripeConfigValue -ConfigPath $configPath -Name "test_mode_api_key"
$liveModeKey = Read-StripeConfigValue -ConfigPath $configPath -Name "live_mode_api_key"
$testModePubKey = Read-StripeConfigValue -ConfigPath $configPath -Name "test_mode_pub_key"
$liveModePubKey = Read-StripeConfigValue -ConfigPath $configPath -Name "live_mode_pub_key"
$selectedKey = if ($UseLiveKey) { $liveModeKey } else { $testModeKey }
$selectedPubKey = if ($UseLiveKey) { $liveModePubKey } else { $testModePubKey }

if ($selectedKey) {
    [Environment]::SetEnvironmentVariable("STRIPE_SECRET_KEY", $selectedKey, "User")
    $env:STRIPE_SECRET_KEY = $selectedKey
    Write-Host "Set STRIPE_SECRET_KEY in the user environment: $(Mask-Secret $selectedKey)" -ForegroundColor Green

    if ($UseLiveKey) {
        [Environment]::SetEnvironmentVariable("STRIPE_LIVE_SECRET_KEY", $selectedKey, "User")
        $env:STRIPE_LIVE_SECRET_KEY = $selectedKey
        Write-Host "Set STRIPE_LIVE_SECRET_KEY in the user environment: $(Mask-Secret $selectedKey)" -ForegroundColor Green
    }
}
else {
    Write-Host "No Stripe CLI API key found in $configPath yet." -ForegroundColor Yellow
}

if ($PublishableKey) {
    if ($PublishableKey -notmatch "^pk_(test|live)_") {
        throw "PublishableKey must start with pk_test_ or pk_live_."
    }
    [Environment]::SetEnvironmentVariable("STRIPE_PUBLISHABLE_KEY", $PublishableKey, "User")
    $env:STRIPE_PUBLISHABLE_KEY = $PublishableKey
    Write-Host "Set STRIPE_PUBLISHABLE_KEY in the user environment: $(Mask-Secret $PublishableKey)" -ForegroundColor Green
}
elseif ($selectedPubKey) {
    [Environment]::SetEnvironmentVariable("STRIPE_PUBLISHABLE_KEY", $selectedPubKey, "User")
    $env:STRIPE_PUBLISHABLE_KEY = $selectedPubKey
    Write-Host "Set STRIPE_PUBLISHABLE_KEY in the user environment from Stripe CLI config: $(Mask-Secret $selectedPubKey)" -ForegroundColor Green
}
else {
    Write-Host "STRIPE_PUBLISHABLE_KEY is not set by Stripe CLI. Copy it from Stripe Dashboard API keys if the frontend needs it." -ForegroundColor Yellow
}

if ($WebhookForwardTo) {
    if (-not $selectedKey) {
        throw "Cannot create a local webhook signing secret until Stripe CLI auth is complete."
    }

    Write-Host "Requesting local Stripe webhook signing secret without printing the raw value..." -ForegroundColor Cyan
    $webhookSecret = (& $stripeExe listen --print-secret --forward-to $WebhookForwardTo 2>$null | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $webhookSecret -notmatch "^whsec_") {
        throw "Could not retrieve a Stripe CLI webhook signing secret."
    }

    [Environment]::SetEnvironmentVariable("STRIPE_WEBHOOK_SECRET", $webhookSecret, "User")
    $env:STRIPE_WEBHOOK_SECRET = $webhookSecret
    Write-Host "Set STRIPE_WEBHOOK_SECRET in the user environment: $(Mask-Secret $webhookSecret)" -ForegroundColor Green
}

Write-Host "Done. Open a new terminal for persisted user environment variables to appear automatically." -ForegroundColor Green
