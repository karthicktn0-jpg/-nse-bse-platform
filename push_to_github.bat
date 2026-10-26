@echo off
echo ============================================================
echo   Push Project to GitHub: karthicktn0-jpg/nse-bse-platform
echo ============================================================
echo.

cd /d %~dp0

echo Checking git status...
git status
echo.

echo Pushing code to GitHub (branch: main)...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo   SUCCESS! Project has been pushed to:
    echo   https://github.com/karthicktn0-jpg/nse-bse-platform
    echo ============================================================
) else (
    echo.
    echo [NOTE] If you got 'Repository not found', please make sure you
    echo created the repository first at: https://github.com/new
    echo with the name: nse-bse-platform
)

pause
