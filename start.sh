#!/bin/bash
cd backend
echo "Starting backend (FastAPI)..."
uvicorn main:app --reload &

cd ../frontend
echo "Starting frontend (Vite React)..."
npm run dev
