# electron-wallpaper-panel（非官方）

面向 Electron 桌面应用的 **壁纸 / 玻璃皮肤** 小工具：浮动面板（拖图、选文件、路径、蒙版与输入框透明度滑杆）+ 小型 CLI，通过 CDP 注入/还原样式。

> **非官方。** 与 Xiaomi、Mimo、WorkBuddy 及其他应用厂商无隶属、授权或赞助关系。使用风险自负。宿主升级可能导致选择器失效。

完整英文文档见 [README.md](README.md)。

## 能做什么

1. 用 `--remote-debugging-port` 启动目标应用  
2. `ewp` 注入 CSS 与右下角 **「图」** 控制面板  
3. 清掉侧栏/主区/输入框 chrome 底色，让壁纸透出来  
4. 预览面板、卡片、菜单等**刻意保持不透明**

不修改安装目录，纯运行时，可用 `ewp restore` 一键还原。

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
