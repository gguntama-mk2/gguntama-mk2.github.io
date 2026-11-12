@echo off
setlocal
title PROJECT T Stage 5.3 - ONE CLICK LOCAL TEST
echo ==================================================
echo PROJECT T Stage 5.3 - LOCAL TEST ONLY
echo No production, main, Render, or original file changes.
echo ==================================================
set "PREVIEW=%USERPROFILE%\Downloads\PROJECT_T_Calendar_Clock_Stage4_v1.1_WindowsFix_2026-11-12\PROJECT_T_Stage4\PROJECT_T_STAGE4_FULL_PREVIEW"
if not exist "%PREVIEW%\STAGE3_VERIFY.json" goto missing
set "SRC=https://raw.githubusercontent.com/gguntama-mk2/gguntama-mk2.github.io/c7f36f576a391910817193d99027ebf1412560f7/tools/project_t_stage5_3_mock.py"
set "SCRIPT=%TEMP%\project_t_stage5_3_mock_8767_%RANDOM%.py"
echo [1/3] Getting the fixed test-only script...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -UseBasicParsing -Uri $env:SRC -OutFile $env:SCRIPT -ErrorAction Stop"
if errorlevel 1 goto failed
echo [2/3] Using separate preview port 8767, keeping 8766 untouched...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$p=$env:SCRIPT; $s=[System.IO.File]::ReadAllText($p); if (-not $s.Contains('STATIC_PORT = 8766') -or -not $s.Contains('API_PORT = 8000')) { throw 'Unexpected test tool version' }; $s=$s.Replace('8766','8767'); [System.IO.File]::WriteAllText($p,$s,(New-Object System.Text.UTF8Encoding $false))"
if errorlevel 1 goto failed
echo [3/3] Starting isolated mock API (8000) and preview (8767)...
echo.
echo After LOCAL_HTTP=PASS, open this URL in Chrome:
echo   http://127.0.0.1:8767/pc.html
echo Keep this window open while testing. Ctrl+C stops the test.
echo.
py -3.12 "%SCRIPT%" --preview "%PREVIEW%"
if errorlevel 1 goto failed
echo Test server stopped.
pause
exit /b 0
:missing
echo [STOPPED] Cannot locate verified Stage 4 preview.
echo Expected:
echo %PREVIEW%
echo Nothing was changed.
pause
exit /b 1
:failed
echo [STOPPED] Test-only startup failed. No originals were changed.
echo If a local server already uses port 8000 or 8767, do not kill it automatically.
pause
exit /b 1
