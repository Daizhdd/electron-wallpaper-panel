@echo off
rem Double-click entry: hide console, run skinned launcher.
powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0start-mimo-skinned.ps1"
