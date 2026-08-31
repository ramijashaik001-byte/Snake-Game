@echo off
echo =================================================================
echo             SNAKE 3D: Hyperdimensional Local Server
echo =================================================================
echo.
echo Launching a local HTTP server using Python...
echo This bypasses browser local CORS file:// security restrictions.
echo.
echo Closing this window will stop the server.
echo.

:: Try to launch the python server in the background
start "" http://localhost:8003

:: Start the server on port 8003
python -m http.server 8003

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Python was not found or failed to start the server.
    echo Attempting to run via python3...
    echo.
    python3 -m http.server 8003
)

pause
