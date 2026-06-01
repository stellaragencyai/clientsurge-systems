[CmdletBinding()]
param(
    [string]$RepoPath = 'C:\Users\nolan\Code\ClientSurge\clientsurge-systems',
    [string]$LogDir = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-Captured {
    param(
        [Parameter(Mandatory = $true)][string]$Command,
        [switch]$AllowFailure
    )

    $output = & pwsh -NoProfile -Command $Command 2>&1
    $code = $LASTEXITCODE
    if ($code -ne 0 -and -not $AllowFailure) {
        throw "Command failed with exit code ${code}: $Command`n$($output -join "`n")"
    }

    return [pscustomobject]@{
        Command = $Command
        ExitCode = $code
        Output = $output
    }
}

function Write-State {
    param(
        [Parameter(Mandatory = $true)][string]$Status,
        [string]$Message = '',
        [object]$Details = $null
    )

    $state = [ordered]@{
        checked_at = (Get-Date).ToUniversalTime().ToString('o')
        machine = $env:COMPUTERNAME
        status = $Status
        message = $Message
        details = $Details
    }

    $statePath = Join-Path $LogDir 'latest-security-edge-status.json'
    $state | ConvertTo-Json -Depth 8 | Set-Content -Path $statePath -Encoding UTF8
    Write-Host "$Status - $Message"
}

function Test-RouteBypassFailure {
    param([string]$Text)

    return (
        $Text -match 'header:content-security-policy' -and
        $Text -match 'content-security-policy missing' -and
        $Text -match 'header:permissions-policy' -and
        $Text -match 'permissions-policy missing'
    )
}

if (-not (Test-Path $RepoPath)) {
    throw "RepoPath does not exist: $RepoPath"
}

Set-Location $RepoPath

if (-not $LogDir) {
    $LogDir = Join-Path $RepoPath "logs/cloudflare-security/$env:COMPUTERNAME"
}
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

$verify = Invoke-Captured 'npm run verify:production-security' -AllowFailure
if ($verify.ExitCode -eq 0) {
    Write-State -Status 'verified' -Message 'Production security verification already passes.' -Details @{
        verify = $verify.Output -join "`n"
    }
    exit 0
}

$whoami = Invoke-Captured 'npx wrangler whoami' -AllowFailure
$whoamiText = $whoami.Output -join "`n"
if ($whoami.ExitCode -ne 0 -or $whoamiText -match 'not authenticated') {
    Write-State -Status 'auth_required' -Message 'Wrangler is not authenticated; Cloudflare edge deploy is waiting for login.' -Details @{
        verify = $verify.Output -join "`n"
        wrangler = $whoamiText
    }
    exit 0
}

try {
    $release = Invoke-Captured 'npm run cloudflare:security:release'
    Write-State -Status 'released' -Message 'Cloudflare security edge was deployed and verified.' -Details @{
        release = $release.Output -join "`n"
    }
}
catch {
    $releaseText = $_.Exception.Message
    $postReleaseVerify = Invoke-Captured 'npm run verify:production-security' -AllowFailure
    $postReleaseVerifyText = $postReleaseVerify.Output -join "`n"
    if (Test-RouteBypassFailure $postReleaseVerifyText) {
        Write-State -Status 'route_bypassed' -Message 'Wrangler is authenticated and deploy was attempted, but production traffic is still missing Worker security headers. Public DNS/orange-to-orange or custom-domain routing is likely bypassing the zone Worker route for clientsurgesystems.com.' -Details @{
            verify_before = $verify.Output -join "`n"
            verify_after = $postReleaseVerifyText
            release_error = $releaseText
            wrangler = $whoamiText
        }
        Write-Warning "Cloudflare Worker route appears bypassed by live traffic after deploy. Check Cloudflare DNS/proxy/custom-domain routing for an orange-to-orange or externally managed apex record."
        exit 0
    }

    Write-State -Status 'release_failed' -Message $_.Exception.Message -Details @{
        verify = $verify.Output -join "`n"
        wrangler = $whoamiText
    }
    throw
}
