@echo off
title ROBO MASTER - NICHEFINDER GURU

echo ===================================================
echo   INICIANDO ROBO MASTER - NICHEFINDER GURU
echo ===================================================
echo.

REM 1. Verificando Node.js
echo [1/4] Verificando Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo.
    echo [!] ERRO: Node.js nao encontrado!
    echo Por favor, instale o Node.js v18 ou superior em: https://nodejs.org/
    echo.
    pause
    exit /b
)
echo OK!

REM 2. Verificando .env
echo [2/4] Verificando configuracoes (.env)...
cd /d "%~dp0"
if not exist .env (
    echo.
    echo [!] ERRO: Arquivo .env nao encontrado!
    echo Certifique-se de que o arquivo .env existe nesta pasta:
    echo %~dp0
    echo.
    pause
    exit /b
)
echo OK!

REM 3. Dependencias
echo [3/4] Verificando dependencias (npm install)...
if not exist node_modules (
    echo Instalando dependencias pela primeira vez (pode demorar)...
    call npm install
) else (
    echo Dependencias ja instaladas.
)
echo.

REM 4. Iniciar
echo [4/4] Ligando motores do robo...
echo.
echo   =================================================
echo   DICA: O navegador abrira APENAS quando voce 
echo   clicar em "Conectar" no seu Dashboard.
echo   =================================================
echo.

node wa-bot.js

if errorlevel 1 (
    echo.
    echo [!] O robo parou com erro. Verifique as mensagens acima.
    pause
)

echo.
echo Janela finalizada.
pause
