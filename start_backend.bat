@echo off
echo ============================================
echo  AI Codebase Navigator - Backend Setup
echo ============================================
echo.

cd /d "%~dp0backend"

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.10+
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
)

REM Activate and install
call .venv\Scripts\activate.bat
echo Installing dependencies...
pip install -r requirements.txt --quiet

REM Copy .env if not exists
if not exist ".env" (
    copy .env.example .env >nul
    echo Created .env from example. Edit backend\.env to add your OpenAI API key.
)

echo.
echo [OK] Backend setup complete.
echo Starting server on http://localhost:8000
echo.
python main.py
