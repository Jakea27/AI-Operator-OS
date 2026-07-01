@echo off
setlocal

set "REPO_DIR=%~dp0"
set "APP_DIR=%REPO_DIR%app"
set "COMMAND=npm run dev"

echo AI Operator OS Development Launcher
echo Launching current source build...
echo.
echo Repository: %REPO_DIR%
echo App directory: %APP_DIR%
echo Command: %COMMAND%
echo.

if not exist "%APP_DIR%" (
  echo ERROR: App directory not found.
  echo Expected: %APP_DIR%
  pause
  exit /b 1
)

cd /d "%APP_DIR%"
if errorlevel 1 (
  echo ERROR: Could not open app directory.
  pause
  exit /b 1
)

call %COMMAND%
if errorlevel 1 (
  echo.
  echo ERROR: AI Operator OS development launch failed.
  pause
  exit /b %errorlevel%
)

endlocal

