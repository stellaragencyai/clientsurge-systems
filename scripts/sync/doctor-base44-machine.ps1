[CmdletBinding()]
param(
    [string]$RepoPath = 'C:\Users\nolan\Code\ClientSurge\clientsurge-systems',
    [string]$MirrorPath = 'C:\Users\nolan\Code\ClientSurge\clientsurge-systems-main-mirror',
    [ValidateSet('Primary', 'Failover', 'MirrorOnly')]
    [string]$ExpectedPublisherRole = 'Primary',
    [switch]$Json
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-Captured {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [string[]]$Arguments = @(),
        [string]$WorkingDirectory = $RepoPath
    )

    try {
        Push-Location $WorkingDirectory
        try {
            $output = & $FilePath @Arguments 2>&1
            return [pscustomobject]@{
                ok = ($LASTEXITCODE -eq 0)
                status = $LASTEXITCODE
                output = (($output | Out-String).Trim())
            }
        }
        finally {
            Pop-Location
        }
    }
    catch {
        return [pscustomobject]@{
            ok = $false
            status = $null
            output = $_.Exception.Message
        }
    }
}

function Get-CommandCheck {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [string[]]$VersionArgs = @('--version'),
        [string]$WorkingDirectory = $RepoPath
    )

    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $command) {
        return [pscustomobject]@{
            installed = $false
            path = $null
            version = $null
            ok = $false
        }
    }

    $version = Invoke-Captured $Name $VersionArgs $WorkingDirectory
    return [pscustomobject]@{
        installed = $true
        path = $command.Source
        version = ($version.output -split "\r?\n")[0]
        ok = $version.ok
    }
}

function Get-GitCheckout {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (-not (Test-Path $Path)) {
        return [pscustomobject]@{
            exists = $false
            branch = $null
            sha = $null
            clean = $false
            origin = $null
        }
    }

    $branch = Invoke-Captured git @('-C', $Path, 'branch', '--show-current')
    $sha = Invoke-Captured git @('-C', $Path, 'rev-parse', 'HEAD')
    $status = Invoke-Captured git @('-C', $Path, 'status', '--porcelain=v1')
    $origin = Invoke-Captured git @('-C', $Path, 'remote', 'get-url', 'origin')

    return [pscustomobject]@{
        exists = $true
        branch = $branch.output
        sha = $sha.output
        clean = ($status.ok -and [string]::IsNullOrWhiteSpace($status.output))
        origin = $origin.output
    }
}

function Get-TaskCheck {
    param([Parameter(Mandatory = $true)][string]$TaskName)

    try {
        $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
        $info = Get-ScheduledTaskInfo -TaskName $TaskName -ErrorAction Stop
        $argument = ($task.Actions | Select-Object -First 1).Arguments
        return [pscustomobject]@{
            installed = $true
            state = $task.State.ToString()
            last_task_result = $info.LastTaskResult
            next_run_time = $info.NextRunTime
            argument = $argument
        }
    }
    catch {
        return [pscustomobject]@{
            installed = $false
            state = 'Missing'
            last_task_result = $null
            next_run_time = $null
            argument = $null
            error = $_.Exception.Message
        }
    }
}

function Read-JsonCommand {
    param([Parameter(Mandatory = $true)][pscustomobject]$CommandResult)

    if (-not $CommandResult.ok -or [string]::IsNullOrWhiteSpace($CommandResult.output)) {
        return $null
    }
    try {
        return $CommandResult.output | ConvertFrom-Json
    }
    catch {
        return [pscustomobject]@{
            parse_error = $true
            raw = $CommandResult.output
        }
    }
}

$repoRoot = (& git -C $RepoPath rev-parse --show-toplevel 2>$null).Trim()
if ($repoRoot) { $RepoPath = $repoRoot }

$node = Get-CommandCheck node
$npm = Get-CommandCheck npm
$git = Get-CommandCheck git
$deno = Get-CommandCheck deno
$gh = Get-CommandCheck gh
$base44 = Get-CommandCheck base44 @('--version')
$wrangler = Invoke-Captured npx @('wrangler', 'whoami') $RepoPath
$ghAuth = Invoke-Captured gh @('auth', 'status') $RepoPath
$base44Whoami = Invoke-Captured base44 @('whoami') $RepoPath
$syncStatus = Invoke-Captured npm @('run', 'sync:status', '--', '--json') $RepoPath
$syncStatusJson = Read-JsonCommand $syncStatus

$tasks = [pscustomobject]@{
    base44 = Get-TaskCheck 'ClientSurge-Base44-SyncMirror'
    cloudflare = Get-TaskCheck 'ClientSurge-Cloudflare-Security-Edge'
}

$recommendations = New-Object System.Collections.Generic.List[string]
if (-not $node.installed -or -not $npm.installed) { $recommendations.Add('Install Node.js/npm, then run npm ci.') }
if (-not $git.installed) { $recommendations.Add('Install Git and clone github.com/stellaragencyai/clientsurge-systems.') }
if (-not $deno.installed) { $recommendations.Add('Install Deno so npm run test:deno can run on this machine.') }
if (-not $ghAuth.ok) { $recommendations.Add('Run gh auth login or gh auth refresh -h github.com -s workflow.') }
if (-not $base44Whoami.ok) { $recommendations.Add('Run base44 login for the Base44 account that can access both ClientSurge apps.') }
if ($wrangler.output -match 'not authenticated') { $recommendations.Add('Run npm run cloudflare:security:login when ready to release the Cloudflare edge Worker.') }
if (-not $tasks.base44.installed -or [int]($tasks.base44.last_task_result ?? 1) -ne 0) { $recommendations.Add('Run npm run sync:repair-automation -- -PublishAfterUpdate -PublisherRole ' + $ExpectedPublisherRole + ' -StartTasks.') }
if (-not $tasks.cloudflare.installed -or [int]($tasks.cloudflare.last_task_result ?? 1) -ne 0) { $recommendations.Add('Run npm run sync:repair-automation -- -PublishAfterUpdate -PublisherRole ' + $ExpectedPublisherRole + ' -StartTasks.') }
if ($ExpectedPublisherRole -and $tasks.base44.argument -and $tasks.base44.argument -notmatch "-PublisherRole\s+$ExpectedPublisherRole") {
    $recommendations.Add("Base44 scheduled task is not configured for expected publisher role $ExpectedPublisherRole.")
}

$syncOk = $false
if ($null -ne $syncStatusJson -and $null -ne $syncStatusJson.summary) {
    $syncOk = $syncStatusJson.summary.ok -eq $true
}
$report = [pscustomobject]@{
    ok = ($syncOk -and $node.installed -and $npm.installed -and $git.installed -and $deno.installed -and $ghAuth.ok -and $base44Whoami.ok -and $tasks.base44.installed -and $tasks.cloudflare.installed)
    checked_at = (Get-Date).ToUniversalTime().ToString('o')
    machine = $env:COMPUTERNAME
    expected_publisher_role = $ExpectedPublisherRole
    repo_path = $RepoPath
    mirror_path = $MirrorPath
    tools = [pscustomobject]@{
        git = $git
        node = $node
        npm = $npm
        deno = $deno
        gh = $gh
        base44 = $base44
    }
    auth = [pscustomobject]@{
        github = [pscustomobject]@{ ok = $ghAuth.ok; output = $ghAuth.output }
        base44 = [pscustomobject]@{ ok = $base44Whoami.ok; output = $base44Whoami.output }
        cloudflare = [pscustomobject]@{ ok = ($wrangler.ok -and $wrangler.output -notmatch 'not authenticated'); output = $wrangler.output }
    }
    checkouts = [pscustomobject]@{
        active = Get-GitCheckout $RepoPath
        mirror = Get-GitCheckout $MirrorPath
    }
    tasks = $tasks
    sync_status = $syncStatusJson
    recommendations = @($recommendations)
}

$logDir = Join-Path $RepoPath "logs/base44-sync/$env:COMPUTERNAME"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$reportPath = Join-Path $logDir 'machine-doctor-latest.json'
Set-Content -Path $reportPath -Value ($report | ConvertTo-Json -Depth 10) -Encoding UTF8

if ($Json) {
    $report | ConvertTo-Json -Depth 10
}
else {
    Write-Host "ClientSurge Machine Doctor" -ForegroundColor Green
    Write-Host "Machine: $($report.machine)"
    Write-Host "Overall: $(if ($report.ok) { 'OK' } else { 'ATTENTION' })"
    Write-Host "Active: $($report.checkouts.active.branch) $($report.checkouts.active.sha) clean=$($report.checkouts.active.clean)"
    Write-Host "Mirror: $($report.checkouts.mirror.branch) $($report.checkouts.mirror.sha) clean=$($report.checkouts.mirror.clean)"
    Write-Host "Sync status: $(if ($syncOk) { 'OK' } else { 'ATTENTION' })"
    Write-Host "GitHub auth: $($report.auth.github.ok)"
    Write-Host "Base44 auth: $($report.auth.base44.ok)"
    Write-Host "Cloudflare auth: $($report.auth.cloudflare.ok)"
    Write-Host "Base44 task: installed=$($tasks.base44.installed) last=$($tasks.base44.last_task_result)"
    Write-Host "Cloudflare task: installed=$($tasks.cloudflare.installed) last=$($tasks.cloudflare.last_task_result)"
    Write-Host "Report: $reportPath"
    if ($recommendations.Count -gt 0) {
        Write-Host ''
        Write-Host 'Recommendations:' -ForegroundColor Yellow
        foreach ($item in $recommendations) {
            Write-Host "- $item"
        }
    }
}

if (-not $report.ok) {
    exit 1
}
