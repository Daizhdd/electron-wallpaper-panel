# Loads optional scripts/launcher.config.json over safe defaults.
# Shared by start-mimo-skinned.ps1 and repoint-mimo-shortcuts.ps1.
$ErrorActionPreference = 'Continue'

$script:RepoRoot = Split-Path -Parent $PSScriptRoot
$script:DefaultConfig = Join-Path $PSScriptRoot 'launcher.config.example.json'
$script:LocalConfig = Join-Path $PSScriptRoot 'launcher.config.json'

function Get-JsonFile([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) { return $null }
  try {
    $raw = [IO.File]::ReadAllText($Path, [Text.UTF8Encoding]::new($false))
    return $raw | ConvertFrom-Json
  } catch {
    Write-Warning "Failed to parse JSON: $Path — $($_.Exception.Message)"
    return $null
  }
}

function Get-LauncherConfig {
  $cfg = Get-JsonFile $script:DefaultConfig
  if (-not $cfg) {
    $cfg = [pscustomobject]@{
      appPath = ''
      processName = 'Xiaomi MiMo'
      shortcutNames = @('Xiaomi MiMo')
      port = 9346
      profile = 'profiles/mimo-desktop.json'
      image = ''
      lang = 'zh-CN'
    }
  }
  $local = Get-JsonFile $script:LocalConfig
  if ($local) {
    foreach ($p in $local.PSObject.Properties) {
      $cfg | Add-Member -NotePropertyName $p.Name -NotePropertyValue $p.Value -Force
    }
  }
  return $cfg
}

function Expand-EnvPath([string]$Path) {
  if ([string]::IsNullOrWhiteSpace($Path)) { return '' }
  return [Environment]::ExpandEnvironmentVariables($Path.Trim())
}

function Resolve-RepoPath([string]$Path) {
  if ([string]::IsNullOrWhiteSpace($Path)) { return '' }
  $expanded = Expand-EnvPath $Path
  if ([System.IO.Path]::IsPathRooted($expanded)) { return $expanded }
  return [System.IO.Path]::GetFullPath((Join-Path $script:RepoRoot $expanded))
}

function Get-ProfileExeHints([string]$ProfilePath) {
  $abs = Resolve-RepoPath $ProfilePath
  if (-not $abs -or -not (Test-Path -LiteralPath $abs)) { return @() }
  try {
    $p = [IO.File]::ReadAllText($abs, [Text.UTF8Encoding]::new($false)) | ConvertFrom-Json
    $hints = @()
    if ($p.exeHints) { $hints += @($p.exeHints) }
    if ($p.appPath) { $hints += @($p.appPath) }
    return $hints
  } catch { return @() }
}

function Find-AppPath {
  param(
    [string]$Configured,
    [string]$ProfilePath,
    [string]$ProcessName
  )
  $fromConfig = Expand-EnvPath $Configured
  if ($fromConfig -and (Test-Path -LiteralPath $fromConfig)) { return $fromConfig }

  foreach ($hint in (Get-ProfileExeHints $ProfilePath)) {
    $cand = Expand-EnvPath $hint
    if ($cand -and (Test-Path -LiteralPath $cand)) { return $cand }
  }

  # Running process path
  if ($ProcessName) {
    $proc = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue |
      Where-Object { $_.Path -and $_.Path -like '*.exe' } |
      Select-Object -First 1
    if ($proc -and $proc.Path) { return $proc.Path }
  }

  # Existing desktop/start-menu shortcut target
  $names = @()
  $cfg = Get-LauncherConfig
  if ($cfg.shortcutNames) { $names = @($cfg.shortcutNames) }
  if ($ProcessName) { $names += $ProcessName }
  $shell = New-Object -ComObject WScript.Shell
  $lnkDirs = @(
    [Environment]::GetFolderPath('Desktop'),
    [Environment]::GetFolderPath('Desktop') -replace '\\Desktop$', '\\OneDrive\\Desktop',
    "$env:APPDATA\Microsoft\Windows\Start Menu\Programs"
  )
  foreach ($dir in $lnkDirs) {
    if (-not (Test-Path -LiteralPath $dir)) { continue }
    foreach ($n in ($names | Select-Object -Unique)) {
      $lnk = Join-Path $dir "$n.lnk"
      if (-not (Test-Path -LiteralPath $lnk)) { continue }
      try {
        $t = $shell.CreateShortcut($lnk).TargetPath
        if ($t -and (Test-Path -LiteralPath $t)) { return $t }
      } catch { }
    }
  }
  return ''
}
