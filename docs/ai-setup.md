# 给 AI 的配置教程（也适合人照着做）

把本文件（或仓库 [README.zh-CN.md](../README.zh-CN.md)）发给 AI，并说：

> 读这份教程，按步骤帮我配置好双击启动 + 自动换肤。需要我提供路径时再问我。

你是 AI 助手：请按下面顺序执行；缺信息就先问用户，不要瞎猜路径。

## 目标

用户在 Windows 上双击应用快捷方式后：

1. 带 `--remote-debugging-port` 启动目标 Electron 应用  
2. 等界面就绪  
3. 自动 `ewp apply` 注入壁纸  
4. 校验皮肤生效（失败会重试一次）

**克隆仓库本身什么都不会改**——快捷方式、配置都必须主动做。

## 前置条件

- Node.js ≥ 18  
- 已 `git clone` 本仓库，并在仓库根目录工作  
- 一张本机壁纸图片路径（可后补，先用浮动面板选也行）  
- 目标应用的 `.exe` 路径（可自动探测，见下）

## 步骤

### 1. 问清用户（一次问完）

- 要换肤的应用是什么？（例如 Xiaomi MiMo / WorkBuddy / 其他 Electron）  
- `.exe` 完整路径？（不知道可跳过，后面自动探测）  
- 壁纸图片路径？（可选）  
- 用中文还是英文面板？默认 `zh-CN`

对应 profile：

| 应用 | profile |
|------|---------|
| Xiaomi MiMo | `profiles/mimo-desktop.json` |
| WorkBuddy | `profiles/workbuddy.json` |
| 其他 | `profiles/generic-electron.json`（效果尽力而为） |

### 2. 写本机配置（不进 git）

若不存在则从模板复制：

```powershell
Copy-Item scripts\launcher.config.example.json scripts\launcher.config.json
```

编辑 `scripts/launcher.config.json`：

```json
{
  "appPath": "C:\\全路径\\App.exe",
  "processName": "进程名（不带.exe）",
  "shortcutNames": ["桌面快捷方式名"],
  "port": 9346,
  "profile": "profiles/mimo-desktop.json",
  "image": "C:\\壁纸\\xxx.jpg",
  "lang": "zh-CN"
}
```

说明：

- `appPath` 可为 `""`：脚本会按 profile 的 `exeHints`、运行中进程、已有快捷方式自动找  
- `shortcutNames` = 桌面/开始菜单里 `.lnk` 的主文件名（不要带 `.lnk`）  
- `processName` 用于检测/必要时重启进程（MiMo 为 `Xiaomi MiMo`）

### 3. 重指快捷方式（会先备份）

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\repoint-mimo-shortcuts.ps1
```

- 备份目录：`scripts\backup-shortcuts\`  
- 报告：`scripts\shortcut-report.txt`  
- 没找到 `.lnk` 时：让用户把快捷方式改名为 `shortcutNames` 里的名字，或手动新建指向 `scripts\start-mimo-skinned.bat` 的快捷方式  

### 4. 验证一次（推荐在应用已开、有 CDP 时）

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\start-mimo-skinned.ps1
```

看日志 `scripts\launcher.log`，成功应出现：

- `renderer ready`
- `apply exit=0`
- `skin active`

也可手动检查：

```powershell
node bin/ewp.js status --port 9346
node bin/ewp.js apply --profile profiles/mimo-desktop.json --image "你的图.jpg" --port 9346
```

### 5. 告诉用户日常用法

- **平时**：双击重指后的应用快捷方式（走启动器）  
- **还原**：`node bin/ewp.js restore --port 9346`  
- **改壁纸**：改 `launcher.config.json` 的 `image`，或应用内右下角浮动面板拖图  
- **日志**：`scripts\launcher.log`

## 明确不要做的事

- 不要从「正在运行的 AI 会话里」强杀宿主应用（若当前会话就在该应用中）  
- 不要提交 `scripts/launcher.config.json`（已 gitignore）  
- 不要声称「克隆就会自动换肤」——必须配置 + repoint  
- 调试口仅 `127.0.0.1`；提醒用户共享电脑上不要长期开着  

## 常见失败

| 现象 | 处理 |
|------|------|
| `CDP port 9346 is closed` | 应用没带调试口启动；走启动器或手动加 `--remote-debugging-port=9346` |
| `App not found` | 填对 `launcher.config.json` 的 `appPath` |
| 皮肤一闪就没了 | 看 `launcher.log` 是否 `skin active`；确认没绕过启动器直接开 exe |
| 快捷方式没变 | repoint 是否成功；`shortcutNames` 是否和 `.lnk` 文件名一致 |
| 没有壁纸图 | `image` 留空，用面板选图 |

## 成功标准

- [ ] 存在 `scripts/launcher.config.json` 且路径有效  
- [ ] 至少一个快捷方式指向 `scripts/start-mimo-skinned.bat`  
- [ ] 双击后应用带调试口启动  
- [ ] `launcher.log` 有 `skin active`  
- [ ] 界面上有壁纸 + 右下角图片按钮  
