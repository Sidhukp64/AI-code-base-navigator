@echo off
echo ============================================
echo  AI Codebase Navigator - Frontend Setup
echo ============================================
echo.

cd /d "%~dp0frontend"

REM Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)

REM Install dependencies
if not exist "node_modules" (
    echo Installing npm packages...
    npm install
)

echo.
echo [OK] Frontend ready.
echo Starting dev server on http://localhost:5173
echo.
npm run dev
