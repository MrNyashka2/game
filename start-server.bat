@echo off
echo ========================================
echo    3D FPS Game - Starting Server
echo ========================================
echo.
echo Starting local server on port 8000...
echo Open your browser and go to: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

python -m http.server 8000

