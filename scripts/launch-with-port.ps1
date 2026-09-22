param(
  [Parameter(Mandatory)][string]$AppPath,
  [int]$Port = 9346,
  [string]$Profile = "profiles/generic-electron.json",
  [string]$Image
)
$ErrorActionPreference = 'Stop'
Start-Process -FilePath $AppPath -ArgumentList ("--remote-debugging-port=" + $Port)
$deadline = (Get-Date).AddSeconds(60)
while ((Get-Date) -lt $deadline) {
  try {
    $c = New-Object Net.Sockets.TcpClient
    $c.Connect('127.0.0.1', $Port); $c.Close(); break
  } catch { Start-Sleep -Milliseconds 400 }
}
$root = Split-Path -Parent $PSScriptRoot
$ewp = Join-Path $root 'bin\ewp.js'
$args2 = @($ewp, 'apply', '--profile', $Profile, '--port', "$Port")
if ($Image) { $args2 += @('--image', $Image) }
& node @args2
