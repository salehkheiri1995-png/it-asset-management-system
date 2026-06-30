@echo off
title IT Asset Management System

set PROJECT_DIR=C:\projectit\it-asset-management-system

echo ============================================
echo   IT Asset Management System - Launcher
echo ============================================
echo.

REM --- Start Backend (FastAPI) ---
echo [1/2] Starting Backend (FastAPI)...
cd /d "%PROJECT_DIR%\backend"
start "Backend - FastAPI" cmd /k "uvicorn main:app --reload --host 0.0.0.0 --port 8000"

REM Small delay before starting frontend
timeout /t 2 /nobreak >nul

REM --- Start Frontend (Vite React) ---
echo [2/2] Starting Frontend (Vite React)...
cd /d "%PROJECT_DIR%\frontend"
start "Frontend - Vite React" cmd /k "npm run dev"

echo.
echo ============================================
echo   Both services are starting...
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo ============================================
echo.
pause
