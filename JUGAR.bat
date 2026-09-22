@echo off
chcp 65001 >nul
title Las aventuras de Martin y Simon
cd /d "%~dp0"

echo.
echo  ===========================================
echo    LAS AVENTURAS DE MARTIN Y SIMON
echo  ===========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  [!] No encuentro Node.js en este equipo.
  echo      Instalalo desde https://nodejs.org y vuelve a intentarlo.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo  Preparando el juego por primera vez. Esto tarda un poco...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo  [!] Algo ha fallado al preparar el juego.
    pause
    exit /b 1
  )
  echo.
)

echo  Abriendo el juego en el navegador...
echo.
echo  NO CIERRES ESTA VENTANA NEGRA mientras juegas.
echo  Para terminar: cierra el navegador y luego esta ventana.
echo.

call npm run dev -- --open

echo.
echo  El juego se ha cerrado.
pause
