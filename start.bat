@echo off
cd backend
echo Starting backend (FastAPI)...
start cmd /k "uvicorn main:app --reload"

cd ..\frontend
echo Starting frontend (Vite React)...
start cmd /k "npm run dev"

echo Both backend and frontend are starting.
