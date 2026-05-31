@echo off
:: Double-click or run once — requests Administrator and opens port 3000 for LAN demos.
net session >nul 2>&1
if %errorLevel% neq 0 (
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0open-firewall.ps1"
echo.
pause
