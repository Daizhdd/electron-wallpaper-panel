# Repoint app shortcuts at the skinned launcher. Reads scripts/launcher.config.json.
# Backs up each .lnk under scripts/backup-shortcuts/ first.
$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot 'launcher-common.ps1')

$cfg = Get-LauncherConfig
$launcher = Join-Path $PSScriptRoot 'start-mimo-skinned.bat'
$launcherDir = $PSScriptRoot
$backupDir = Join-Path $PSScriptRoot 'backup-shortcuts'
$reportPath = Join-Path $PSScriptRoot 'shortcut-report.txt'
$processName = [string]$cfg.processName
if (-not $processName) { $processName = 'Xiaomi MiMo' }
$profilePath = Resolve-RepoPath ([string]$cfg.profile)
$iconExe = Find-AppPath -Configured ([string]$cfg.appPath) -ProfilePath $profilePath -ProcessName $processName
$iconPath = if ($iconExe) { "$iconExe,0" } else { '' }

$shortcutNames = @()
if ($cfg.shortcutNames) { $shortcutNames = @($cfg.shortcutNames | ForEach-Object { [string]$_ } | Where-Object { $_ }) }
if ($shortcutNames.Count -eq 0) { $shortcutNames = @($processName) }

if (-not (Test-Path -LiteralPath $launcher)) { throw "launcher missing: $launcher" }
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$out = New-Object System.Collections.Generic.List[string]
$shell = New-Object -ComObject WScript.Shell

$dirs = @(
  @{ Id = 'Desktop'; Path = [Environment]::GetFolderPath('Desktop') },
  @{ Id = 'OneDriveDesktop'; Path = ([Environment]::GetFolderPath('Desktop') -replace '\\Desktop$', '\\OneDrive\\Desktop') },
  @{ Id = 'StartMenu'; Path = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs" },
  @{ Id = 'TaskBarPin'; Path = "$env:APPDATA\Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar" }
)

$repointed = 0
foreach ($dir in $dirs) {
  if (-not (Test-Path -LiteralPath $dir.Path)) { continue }
  foreach ($name in $shortcutNames) {
    $p = Join-Path $dir.Path "$name.lnk"
    if (-not (Test-Path -LiteralPath $p)) { continue }
    $id = '{0}-{1}' -f $dir.Id, ($name -replace '[\\/:*?"<>|]', '_')
    $backup = Join-Path $backupDir "$id.lnk"
    Copy-Item -LiteralPath $p -Destination $backup -Force
    $out.Add("[BACKUP] $p -> $backup")
    $before = $shell.CreateShortcut($p)
    $out.Add("  before: target=$($before.TargetPath)")
    $s = $shell.CreateShortcut($p)
    $s.TargetPath = $launcher
    $s.Arguments = ''
    $s.WorkingDirectory = $launcherDir
    if ($iconPath) { $s.IconLocation = $iconPath }
    $s.Description = "$processName (wallpaper skin launcher)"
    $s.Save()
    $after = $shell.CreateShortcut($p)
    $out.Add("  after : target=$($after.TargetPath)")
    $out.Add('')
    $repointed++
  }
}

if ($repointed -eq 0) {
  $out.Add('[WARN] No shortcuts matched shortcutNames. Create a shortcut to start-mimo-skinned.bat, or add the .lnk base name to launcher.config.json.')
}

$out | Set-Content -LiteralPath $reportPath -Encoding UTF8
$out | ForEach-Object { Write-Output $_ }
if ($repointed -eq 0) { exit 1 }
exit 0
