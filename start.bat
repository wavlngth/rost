@echo off
title Discord Session Bot

:: Print the current path
echo Current directory: %cd%

:: Ensure Node.js is available
echo Verifying Node.js installation...
node -v
if %errorlevel% neq 0 (
    echo Node.js is not recognized. Please ensure Node.js is installed and in your PATH.
    pause
    exit /b
)

:: Print list of files in current directory to check if bot.js and deploy-commands.js are present
echo Listing files in current directory:
dir
pause

:: Add ASCII Art with Colored Font
echo.
echo     ____  ____  ___________    
echo    / __ \/ __ \/ ___/_  __/    
echo   / /_/ / / / /\__ \ / /       
echo  / _  _/ /_/ /___/ // /        
echo /_/ \_\\____//____//_/         
echo.

:: Print and try starting the bot and log errors
echo Starting Rost...
echo node bot.js
node bot.js
if %errorlevel% neq 0 (
    echo Error starting bot.js. Check the error above.
    pause
    exit /b
)

:: If bot.js started successfully, proceed to registering commands
echo Rost has logged in and is running...

:: Print and try running deploy-commands.js and log errors
echo node deploy-commands.js
node deploy-commands.js
if %errorlevel% neq 0 (
    echo Error deploying commands. Check the error above.
    pause
    exit /b
)

:: If everything runs, continue with the pause before restart
echo Slash commands have been registered.

:: Pause after everything completes to keep the window open
echo Bot stopped. Press any key to restart.
pause
goto :start
