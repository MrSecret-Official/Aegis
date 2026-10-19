@echo off
rem Aegis - banco de pruebas de Escudos (tools/pruebas/escudos.py). Doble clic para lanzarlo.
rem Sin conexion a Internet: todo se sirve desde este equipo. Necesita Python 3 y la copia de desarrollo
rem (%%USERPROFILE%%\Aegis-pruebas) o un Aegis instalado.
chcp 65001 >nul
cd /d "%~dp0"
echo Banco de pruebas de Escudos
echo.
echo   1. Pruebas automaticas (unos minutos; abre el informe al terminar)
echo   2. Probar a mano (abre Aegis con la web de pruebas)
echo   3. Pruebas automaticas con el Aegis instalado
echo.
choice /c 123 /n /m "Elige 1, 2 o 3: "
if errorlevel 3 goto instalada
if errorlevel 2 goto manual
python escudos.py --abrir %*
goto fin
:manual
python escudos.py --manual %*
goto fin
:instalada
python escudos.py --instalada --abrir %*
:fin
echo.
pause
