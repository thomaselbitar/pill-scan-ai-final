@echo off
echo Starting Smart Inventory Backend Server...
echo.
echo Server will be accessible at:
echo   - Local: http://localhost:8000
echo   - Network: http://YOUR_IP:8000
echo.
echo Press CTRL+C to stop the server
echo.
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

