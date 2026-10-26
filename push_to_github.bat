@echo off
echo ============================================================
echo   Push Project to AIML Repository (Branch: team-6)
echo   Repo: AIML2026-27/PROJECTS-2026-2027----SEC-B
echo ============================================================
echo.

cd /d %~dp0

echo 1. Switching to branch 'team-6'...
git checkout team-6 2>nul || git checkout -b team-6

echo 2. Setting remote origin...
git remote set-url origin https://karthicktn0-jpg@github.com/AIML2026-27/PROJECTS-2026-2027----SEC-B.git

echo.
echo 3. Pushing branch 'team-6' to GitHub...
echo [NOTE] A GitHub login window will open in your browser.
echo Please sign in / authorize with your account: karthicktn0-jpg
echo.

git push -u origin team-6

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo   SUCCESS! Branch 'team-6' has been pushed to:
    echo   https://github.com/AIML2026-27/PROJECTS-2026-2027----SEC-B/tree/team-6
    echo ============================================================
) else (
    echo.
    echo [ERROR] Push failed. 
    echo Please make sure your GitHub account 'karthicktn0-jpg' has been
    echo added as a Collaborator with write access to this repository.
)

pause
