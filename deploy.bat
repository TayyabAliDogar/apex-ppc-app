@echo off
echo ========================================
echo Vibe PPC - Google Cloud Deployment
echo ========================================
echo.

echo Step 1: Building application...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed! Please fix errors and try again.
    pause
    exit /b 1
)
echo ✓ Build completed successfully
echo.

echo Step 2: Deploying to Google Cloud...
echo Make sure you have:
echo   1. Installed Google Cloud SDK
echo   2. Logged in: gcloud auth login
echo   3. Set project: gcloud config set project YOUR_PROJECT_ID
echo.
pause

call gcloud app deploy
if %errorlevel% neq 0 (
    echo Deployment failed! Check the error messages above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✓ Deployment completed successfully!
echo ========================================
echo.
echo Opening your app in browser...
call gcloud app browse

pause
