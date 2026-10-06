@echo off
setlocal
if not exist .env (
  copy .env.example .env >nul
  echo.
  echo .env wurde aus .env.example erstellt.
  echo Bitte JWT_SECRET, OWNER_EMAIL und OWNER_PASSWORD eintragen und erneut starten.
  pause
  exit /b 1
)
where docker >nul 2>nul
if errorlevel 1 (
  echo Docker Desktop wurde nicht gefunden.
  echo Installiere Docker Desktop und starte dieses Script danach erneut.
  pause
  exit /b 1
)
docker compose up -d --build
echo.
echo VIDO laeuft jetzt unter: http://localhost:3000
pause
