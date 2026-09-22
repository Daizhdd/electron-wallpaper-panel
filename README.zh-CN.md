# electron-wallpaper-panel（非官方）

面向 Electron 桌面应用的 **壁纸 / 玻璃皮肤** 小工具：浮动面板（拖图、选文件、路径、蒙版与输入框透明度滑杆）+ 小型 CLI，通过 CDP 注入/还原样式。

> **非官方。** 与 Xiaomi、Mimo、WorkBuddy 及其他应用厂商无隶属、授权或赞助关系。使用风险自负。宿主升级可能导致选择器失效。

完整英文文档见 [README.md](README.md)。

## 最简单：让 AI 帮你配置（推荐）

不想手敲命令的话，把本仓库丢给任意会用终端的 AI（MiMo、Claude、Copilot 等）：

1. 发仓库链接，或直接发 [docs/ai-setup.md](docs/ai-setup.md)  
2. 说一句：**「读 ai-setup 教程，帮我配置双击启动自动换肤」**  
3. AI 会问你 exe / 壁纸路径，然后写好 `launcher.config.json` 并重指快捷方式  

克隆本身**不会**改你的快捷方式，必须主动配置一次。

## 安装后必做（手动）

克隆或 `npm install` **不会**自动给应用换肤。装完后按下面三步操作：

1. **带调试口启动目标应用**（仅本机回环；用完建议关掉）：
   ```bash
   "/path/to/App.exe" --remote-debugging-port=9346
   ```
2. **套上壁纸**（纯运行时，不改安装文件）：
   ```bash
   node bin/ewp.js apply --profile profiles/mimo-desktop.json --image ./wallpaper.jpg
   ```
   没有 `--image` 时，可用应用右下角浮动面板拖图/选文件。
3. **还原原生外观**：
   ```bash
   node bin/ewp.js restore
   ```

可选：`npm link` 后可直接用 `ewp`；PowerShell 一键启动见 [`scripts/launch-with-port.ps1`](scripts/README.md)。

### 可选：双击快捷方式自动带肤启动（Windows）

克隆**不会**改你的快捷方式。要「双击就启动 + 自动换壁纸」：

1. 复制配置并按需修改路径：
   ```powershell
   Copy-Item scripts\launcher.config.example.json scripts\launcher.config.json
   notepad scripts\launcher.config.json
   ```
2. 把桌面/开始菜单里对应 `.lnk` 指到启动器（会先备份）：
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\repoint-mimo-shortcuts.ps1
   ```
3. 以后用改过的快捷方式启动即可。

完整步骤、字段说明、排错：**[docs/ai-setup.md](docs/ai-setup.md)**（给人和 AI 共用）。  
更多脚本说明：[`scripts/README.md`](scripts/README.md)。

执行 `npm install` 时，终端也会打印上述步骤（`postinstall`）。

![electron-wallpaper-panel](docs/screenshots/window.png)

## 能做什么

1. 用 `--remote-debugging-port` 启动目标应用  
2. `ewp` 注入 CSS 与右下角**图片图标**控制面板  
3. 清掉侧栏/主区/输入框 chrome 底色，让壁纸透出来  
4. 预览面板、卡片、菜单等**刻意保持不透明**

面板文案支持**中英双语**，默认跟随宿主应用的语言（`navigator.language`），也可以用 `--lang zh-CN` 或 `EWP_LANG` 强制指定。

不修改安装目录，纯运行时，可用 `ewp restore` 一键还原。

## 截图

浮动面板与启动按钮：

![panel](docs/screenshots/panel.png)

同一张壁纸下两个背景蒙版值的区别（纯运行时，不用重启）：

![背景蒙版对比](docs/screenshots/veil-compare.jpg)

上为原生外观，下为套上壁纸后：

![前后对比](docs/screenshots/before-after.jpg)

## 快速开始

```bash
# 1) 带调试端口启动应用（示例）
"/path/to/App.exe" --remote-debugging-port=9346

# 2) 套壁纸
node bin/ewp.js apply --profile profiles/mimo-desktop.json --image ./wallpaper.jpg

# 3) 还原
node bin/ewp.js restore --profile profiles/mimo-desktop.json
```

## 安全

调试端口仅限本机回环；不要在共享电脑上长期开启。详见 [SECURITY.md](SECURITY.md)。

## 许可

MIT — 见 [LICENSE](LICENSE)。
