# Double-click launcher: start MiMo with CDP port, then apply wallpaper skin.
# Paths are machine-specific; edit here if the install moves.
param(
  [string]$AppPath = 'D:\mimo\Xiaomi MiMo\Xiaomi MiMo.exe',
  [int]$Port = 9346,
  [string]$Profile = 'profiles/mimo-desktop.json',
  [string]$Image = 'C:\Users\神\Desktop\wallpaper动态壁纸_1_小羊（主页娶图）_来自小红书网页版.jpg',
  [string]$Lang = 'zh-CN',
  [switch]$Restore
)
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
$ewp = Join-Path $root 'bin\ewp.js'
$log = Join-Path $PSScriptRoot 'launcher.log'
$waitReadyPath = Join-Path $PSScriptRoot 'wait-ready.js'

function Write-Log([string]$Message) {
  $line = '[{0}] {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
  Add-Content -LiteralPath $log -Value $line -Encoding UTF8
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
  [IO.File]::WriteAllText($tmp, $src, [Text.UTF8Encoding]::new($true))
  $null = & node $tmp $P 2>&1 | Out-String
  return ($LASTEXITCODE -eq 0)
}

Write-Log "start port=$Port restore=$Restore imageExists=$(Test-Path -LiteralPath $Image)"
$mimo = Get-Process -Name 'Xiaomi MiMo' -ErrorAction SilentlyContinue

if ($mimo -and -not (Test-CdpPort $Port)) {
  Write-Log 'app running without CDP; restarting with debug port'
  $mimo | Stop-Process -Force
  Start-Sleep -Seconds 2
  $mimo = $null
}

if (-not $mimo) {
  if (-not (Test-Path -LiteralPath $AppPath)) {
    Write-Log "App not found: $AppPath"
    exit 1
  }
  Write-Log "launching $AppPath --remote-debugging-port=$Port"
  Start-Process -FilePath $AppPath -ArgumentList ("--remote-debugging-port=" + $Port)
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

$profilePath = if ([System.IO.Path]::IsPathRooted($Profile)) { $Profile } else { Join-Path $root $Profile }
$applyArgs = @('apply', '--profile', $profilePath, '--port', "$Port", '--lang', $Lang)
if (Test-Path -LiteralPath $Image) {
  $applyArgs += @('--image', $Image)
} else {
  Write-Log "Image not found: $Image"
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
