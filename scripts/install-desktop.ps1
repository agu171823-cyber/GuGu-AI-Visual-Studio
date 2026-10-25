$ErrorActionPreference = 'Stop'
$projectDir = Split-Path -Parent $PSScriptRoot
$entryPath = Join-Path $projectDir 'quick-start.cmd'
if (-not (Test-Path -LiteralPath $entryPath)) { throw '找不到 quick-start.cmd' }

$desktopDir = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktopDir 'GuGu AI Visual Studio.lnk'
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $entryPath
$shortcut.WorkingDirectory = $projectDir
$shortcut.Description = '启动 GuGu AI Visual Studio 本地 AI 视觉创作工作台'
$shortcut.WindowStyle = 1
$shortcut.Save()

Write-Host "桌面快捷方式已创建：$shortcutPath" -ForegroundColor Green
Write-Host '双击快捷方式启动；保持命令窗口打开，按 Ctrl+C 停止。'
