@echo off
setlocal
cd /d "%~dp0"

set "GUGU_NODE="
if exist "%~dp0runtime\node.exe" set "GUGU_NODE=%~dp0runtime\node.exe"

if not defined GUGU_NODE (
  where node >nul 2>nul
  if not errorlevel 1 set "GUGU_NODE=node"
)

if not defined GUGU_NODE (
  echo [GuGu AI Visual Studio] Cannot find Node.js.
  echo.
  echo If this is the portable package, please extract the entire ZIP again.
  echo Do not move quick-start.cmd out of the program folder.
  echo If this is the source package, please install Node.js 24 LTS.
  pause
  exit /b 1
)

"%GUGU_NODE%" "%~dp0scripts\quick-start.js"
set "GUGU_EXIT=%ERRORLEVEL%"
if not "%GUGU_EXIT%"=="0" pause
exit /b %GUGU_EXIT%
