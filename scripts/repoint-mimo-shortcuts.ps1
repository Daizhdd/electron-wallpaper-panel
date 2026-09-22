# Repoint Xiaomi MiMo shortcuts at the skinned launcher. Backs up each .lnk first.
$ErrorActionPreference = 'Stop'
$launcher = Join-Path $PSScriptRoot 'start-mimo-skinned.bat'
$launcherDir = $PSScriptRoot
$iconPath = 'D:\mimo\Xiaomi MiMo\Xiaomi MiMo.exe,0'
$backupDir = Join-Path $PSScriptRoot 'backup-shortcuts'
$reportPath = Join-Path $PSScriptRoot 'shortcut-report.txt'
if (-not (Test-Path -LiteralPath $launcher)) { throw "launcher missing: $launcher" }
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$out = New-Object System.Collections.Generic.List[string]
$shell = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')
$targets = @(
  @{ Id = '01-Desktop'; Path = (Join-Path $desktop 'Xiaomi MiMo.lnk') },
  @{ Id = '02-StartMenu'; Path = (Join-Path "$env:APPDATA\Microsoft\Windows\Start Menu\Programs" 'Xiaomi MiMo.lnk') },
  @{ Id = '03-TaskBarPin'; Path = (Join-Path "$env:APPDATA\Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar" 'Xiaomi MiMo.lnk') }
)
foreach ($t in $targets) {
  $p = $t.Path
  if (-not (Test-Path -LiteralPath $p)) { $out.Add("[SKIP] not found: $p"); continue }
  $backup = Join-Path $backupDir ("$($t.Id)-Xiaomi MiMo.lnk")
  Copy-Item -LiteralPath $p -Destination $backup -Force
  $out.Add("[BACKUP] $p -> $backup")
  $before = $shell.CreateShortcut($p)
  $out.Add("  before: target=$($before.TargetPath)")
  $s = $shell.CreateShortcut($p)
  $s.TargetPath = $launcher
  $s.Arguments = ''
  $s.WorkingDirectory = $launcherDir
  $s.IconLocation = $iconPath
  $s.Description = 'Xiaomi MiMo (wallpaper skin launcher)'
  $s.Save()
  $after = $shell.CreateShortcut($p)
  $out.Add("  after : target=$($after.TargetPath)")
  $out.Add('')
}
$extra = Join-Path $desktop 'MiMo 换肤启动.lnk'
if (Test-Path -LiteralPath $extra) {
  $extraBackup = Join-Path $backupDir '00-MiMo-skinned-extra.lnk'
  Copy-Item -LiteralPath $extra -Destination $extraBackup -Force
  Remove-Item -LiteralPath $extra -Force
  $out.Add("[REMOVE] $extra (backed up to $extraBackup)")
}
$out | Set-Content -LiteralPath $reportPath -Encoding UTF8
$out | ForEach-Object { Write-Output $_ }
