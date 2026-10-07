@echo off
echo ===================================================
echo     Launching AI Codebase Navigator
echo ===================================================
echo.

start "AI Codebase Navigator - Backend" cmd /k "%~dp0start_backend.bat"
timeout /t 3 /nobreak >nul
start "AI Codebase Navigator - Frontend" cmd /k "%~dp0start_frontend.bat"

echo Both Backend (http://localhost:8000) and Frontend (http://localhost:5173) are starting!
echo Once started, open your browser at: http://localhost:5173
echo.
pause
