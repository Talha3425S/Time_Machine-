@echo off
echo Starting Software Time Machine...

echo Step 1: Starting Docker containers...
docker-compose up -d

echo Step 2: Waiting for containers to be ready...
timeout /t 5 /nobreak >nul

echo Step 3: Starting API server...
cd apps\api
start "API Server" cmd /k "npm run start"

echo Step 4: Waiting for API to start...
timeout /t 5 /nobreak > nul

echo Step 5: Starting Web Dashboard...
cd ..\web
start "Web Dashboard" cmd /k "npm run dev"

echo Step 6: Waiting for Web Dashboard to start...
timeout /t 5 /nobreak > nul

echo.
echo Software Time Machine is starting up...
echo.
echo API Server: http://localhost:3001
echo Web Dashboard: http://localhost:3002
echo.
echo Press any key to continue...
pause >nul
