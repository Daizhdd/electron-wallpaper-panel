# Double-click launcher: start the target Electron app with CDP, then apply wallpaper.
# Configure via scripts/launcher.config.json (copy launcher.config.example.json).
param(
  [string]$AppPath,
  [int]$Port,
  [string]$Profile,
  [string]$Image,
  [string]$Lang,
  [string]$ProcessName,
  [switch]$Restore
)
$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot 'launcher-common.ps1')

$cfg = Get-LauncherConfig
if (-not $AppPath) { $AppPath = '' }
if (-not $Port) { $Port = [int]$cfg.port }
if (-not $Port) { $Port = 9346 }
if (-not $Profile) { $Profile = [string]$cfg.profile }
if (-not $Profile) { $Profile = 'profiles/generic-electron.json' }
if (-not $PSBoundParameters.ContainsKey('Image')) { $Image = [string]$cfg.image }
if (-not $Lang) { $Lang = [string]$cfg.lang }
if (-not $ProcessName) { $ProcessName = [string]$cfg.processName }
if (-not $ProcessName) { $ProcessName = 'Xiaomi MiMo' }

$root = $script:RepoRoot
$ewp = Join-Path $root 'bin\ewp.js'
$log = Join-Path $PSScriptRoot 'launcher.log'
$waitReadyPath = Join-Path $PSScriptRoot 'wait-ready.js'
$profilePath = Resolve-RepoPath $Profile
$imagePath = if ($Image) { Expand-EnvPath $Image } else { '' }

function Write-Log([string]$Message) {
  $line = '[{0}] {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
  try { Add-Content -LiteralPath $log -Value $line -Encoding UTF8 } catch { }
  Write-Host $line
}

function Test-CdpPort {
  param([int]$P)
  try {
    $c = New-Object Net.Sockets.TcpClient
    $c.Connect('127.0.0.1', $P)
    $c.Close()
    return $true
  } catch { return $false }
}

function Wait-CdpPort {
  param([int]$P, [int]$TimeoutSec = 60)
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    if (Test-CdpPort $P) { return $true }
    Start-Sleep -Milliseconds 400
  }
  return $false
}

function Invoke-Ewp {
  param([string[]]$EwpArgs)
  $out = & node $ewp @EwpArgs 2>&1 | Out-String
  $code = $LASTEXITCODE
  return [pscustomobject]@{ Code = $code; Output = $out.Trim() }
}

function Wait-RendererReady {
  param([int]$P, [int]$TimeoutSec = 60)
  $null = & node $waitReadyPath --port $P --timeout-ms ($TimeoutSec * 1000) 2>&1 | Out-String
  return ($LASTEXITCODE -eq 0)
}

function Test-SkinActive {
  param([int]$P)
  $src = @'
const { evalOnPage } = require('../lib/cdp');
evalOnPage(Number(process.argv[2]), '(()=>({skin:document.documentElement.getAttribute("data-ewp-skin"),style:!!document.getElementById("ewp-wallpaper-skin")}))()')
  .then(v => { const j = JSON.parse(v); process.exit(j.skin === 'on' && j.style ? 0 : 1); })
  .catch(() => process.exit(1));
'@
  $tmp = Join-Path $PSScriptRoot 'skin-check.js'
  try { [IO.File]::WriteAllText($tmp, $src, [Text.UTF8Encoding]::new($true)) } catch { return $false }
  $null = & node $tmp $P 2>&1 | Out-String
  return ($LASTEXITCODE -eq 0)
}

$resolvedApp = Find-AppPath -Configured $AppPath -ProfilePath $profilePath -ProcessName $ProcessName
Write-Log "start port=$Port profile=$profilePath process=$ProcessName app=$resolvedApp image=$imagePath restore=$Restore"

$running = if ($ProcessName) { Get-Process -Name $ProcessName -ErrorAction SilentlyContinue } else { $null }

if ($running -and -not (Test-CdpPort $Port)) {
  Write-Log 'app running without CDP; restarting with debug port'
  $running | Stop-Process -Force
  Start-Sleep -Seconds 2
  $running = $null
}

if (-not $running) {
  if (-not $resolvedApp -or -not (Test-Path -LiteralPath $resolvedApp)) {
    Write-Log "App not found. Set appPath in scripts/launcher.config.json (see launcher.config.example.json). Tried profile exeHints for $profilePath"
    exit 1
  }
  Write-Log "launching $resolvedApp --remote-debugging-port=$Port"
  Start-Process -FilePath $resolvedApp -ArgumentList ("--remote-debugging-port=" + $Port)
  if (-not (Wait-CdpPort $Port -TimeoutSec 60)) {
    Write-Log "Timed out waiting for CDP port $Port"
    exit 1
  }
  Write-Log 'CDP port is up'
} else {
  Write-Log 'app already running with CDP; will re-apply only'
}

if (-not (Wait-RendererReady -P $Port -TimeoutSec 60)) {
  Write-Log 'Renderer probe timed out; trying apply anyway...'
} else {
  Write-Log 'renderer ready'
}

if ($Restore) {
  $r = Invoke-Ewp @('restore', '--port', "$Port")
  Write-Log "restore exit=$($r.Code) $($r.Output)"
  exit $r.Code
}

if (-not (Test-Path -LiteralPath $profilePath)) {
  Write-Log "profile not found: $profilePath"
  exit 1
}

$applyArgs = @('apply', '--profile', $profilePath, '--port', "$Port")
if ($Lang) { $applyArgs += @('--lang', $Lang) }
if ($imagePath -and (Test-Path -LiteralPath $imagePath)) {
  $applyArgs += @('--image', $imagePath)
} else {
  Write-Log "No image configured/found (image=$imagePath); use the floating panel to pick one."
}

Write-Log ('apply: ' + ($applyArgs -join ' '))
$ap = Invoke-Ewp $applyArgs
Write-Log "apply exit=$($ap.Code) $($ap.Output)"
if ($ap.Code -ne 0) { exit $ap.Code }

$deadline = (Get-Date).AddSeconds(8)
while ((Get-Date) -lt $deadline) {
  Start-Sleep -Milliseconds 600
  if (Test-SkinActive -P $Port) {
    Write-Log 'skin active'
    exit 0
  }
}
Write-Log 'Skin not sticky yet; re-applying...'
$ap2 = Invoke-Ewp $applyArgs
Write-Log "re-apply exit=$($ap2.Code) $($ap2.Output)"
exit $ap2.Code
