@echo off
cd /d "%~dp0"
echo Starting BASTIEN local server...
echo Open http://localhost:8000/login.html
python -m http.server 8000
pause
