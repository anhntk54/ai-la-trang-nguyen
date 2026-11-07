@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist node_modules (
  echo Lan dau chay: dang cai thu vien, doi 1-2 phut...
  call npm install
)
rem Giong doc VieNeu (Adam bua): chua chay thi mo cua so rieng. Khong co VieNeu thi game tu dung giong Edge.
curl -s -m 2 http://127.0.0.1:8000/v1/voices >nul 2>&1
if errorlevel 1 if exist "E:\02_AI\VieNeu-TTS\.venv\Scripts\python.exe" (
  echo Dang bat giong VieNeu, cua so rieng ten "Giong VieNeu" - dung tat cua so do khi dang live.
  start "Giong VieNeu" /min cmd /c "cd /d E:\02_AI\VieNeu-TTS && set PYTHONIOENCODING=utf-8 && .venv\Scripts\python.exe -m apps.openai_speech"
)
echo Dang bat game... Dong cua so nay la tat game.
echo Link cho TikTok LIVE Studio: http://lvh.me:3007/?view=stage  (1080 x 1920)
rem Che do live: trang stage khong tu tai lai khi sua code
set LIVE_MODE=1
set PORT=3007
start "" cmd /c "timeout /t 8 >nul & start http://localhost:3007"
npm run dev
pause
