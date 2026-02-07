@echo off
REM LỚP 7/2 - Neon Digital Hub
REM Quick Start Script

echo.
echo ========================================
echo   LỚP 7/2 - Neon Digital Hub
echo   Neon Digital Hub
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo.
echo Starting server...
echo Open browser: http://localhost:3000
echo.
echo Press Ctrl+C to stop server
echo.

call npm start

pause
