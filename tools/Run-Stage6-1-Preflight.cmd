@echo off
setlocal EnableExtensions DisableDelayedExpansion
title PROJECT T Stage 6.1 - Preview Release Readiness (READ ONLY)

rem Test-only candidate check. Does not deploy, commit, copy, or edit source files.
rem Candidate is a PARTIAL preview, NOT a complete GitHub Pages site.
rem Keep production, main, Render, and originals unchanged.
rem Fixed original base commit: cf4e68a848e494e2acbc4cc58a7cec852b2d2f22
rem Expected base blob PC: 2419e9d297f5ef9b0e3be53770745a6d43859590
rem Expected base blob SP: 390291835095bd79c2e5daf0d4faa5f72b0bf3c1
rem CNAME in base: www.project-t-god.com
rem Recommended future option (approval required): Pages Actions build on immutable base,
rem apply verified small patch during build, upload full static site artifact once.
rem NOTE: A full Pages artifact transfer is still required. No deploy in this script.
rem Rollback reference: immutable pre-change commit above, plus existing Pages deployment.
rem Do not switch Pages source, merge PR #37, or deploy without separate approval.

echo ======================================================
echo PROJECT T STAGE 6.1 - LOCAL PREFLIGHT ONLY
echo PRODUCTION, MAIN, RENDER, ORIGINALS: NO CHANGES
echo ======================================================

set "STAGE4=%USERPROFILE%\Downloads\PROJECT_T_Calendar_Clock_Stage4_v1.1_WindowsFix_2026-11-12\PROJECT_T_Stage4"
set "PREVIEW=%STAGE4%\PROJECT_T_STAGE4_FULL_PREVIEW"
set "AUDIT=%USERPROFILE%\Downloads\PROJECT_T_Calendar_Clock_Stage4_v1.2_9652_AuditFix_2026-11-12\PROJECT_T_Stage4\PROJECT_T_STAGE4_V1_2_EVIDENCE\STAGE4_V1_2_AUDIT.json"

where py >nul 2>&1
if errorlevel 1 goto :python_missing
if not exist "%PREVIEW%\pc.html" goto :preview_missing
if not exist "%PREVIEW%\sp.html" goto :preview_missing
if not exist "%PREVIEW%\STAGE3_VERIFY.json" goto :preview_missing
if not exist "%PREVIEW%\calendar-events.json" goto :preview_missing
if not exist "%PREVIEW%\favicon.svg" goto :preview_missing
if not exist "%AUDIT%" goto :audit_missing

echo [1/4] Checking provenance evidence is readable...
py -3.12 -c "import json,sys; a=json.load(open(sys.argv[1],encoding='utf-8')); b=json.load(open(sys.argv[2],encoding='utf-8')); assert isinstance(a,dict) and isinstance(b,dict); print('STAGE6_1_EVIDENCE_JSON=PASS')" "%PREVIEW%\STAGE3_VERIFY.json" "%AUDIT%"
if errorlevel 1 goto :failed

echo [2/4] Checking 21 seed events and necessary assets...
py -3.12 -c "import pathlib,json,sys; p=pathlib.Path(sys.argv[1]); j=json.loads((p/'calendar-events.json').read_text(encoding='utf-8')); n=len(j.get('events',[])); assert n==21, ('Expected 21, got',n); f=['move-icons.js','move-media.js','combos-live.json','px-overrides.js']; i=['tornado.webp','powercrush.webp','heatengage.webp','recoverable.webp','homing.webp','forcedcrouch.webp','floorgimmick.webp','wallbreak.webp','hardwallbreak.webp','wallblast.webp','wallbound.webp','balconybreak.webp','floorbreak.webp','hardfloorbreak.webp','floorblast.webp']; missing=[x for x in f if not (p/x).is_file()]+[('icons/'+x) for x in i if not (p/'icons'/x).is_file()]; assert not missing, ('Missing assets',missing); print('STAGE6_1_CALENDAR=PASS_21');print('STAGE6_1_STATIC_ASSETS=PASS_19')" "%PREVIEW%"
if errorlevel 1 goto :failed

echo [3/4] Checking patched HTML and file sizes...
py -3.12 -c "import pathlib,sys; p=pathlib.Path(sys.argv[1]); fs=['pc.html','sp.html']; sizes={}; bad=[]; [(sizes.__setitem__(f,(p/f).stat().st_size),bad.extend([f+':old_endpoint'] if b'/api/v1/calendar/events' in (p/f).read_bytes() or b'worldtimeapi.org' in (p/f).read_bytes() else [])) for f in fs]; assert all(n>20000000 for n in sizes.values()),sizes;assert not bad,bad;print('STAGE6_1_PATCHED_HTML=PASS',sizes)" "%PREVIEW%"
if errorlevel 1 goto :failed

echo [4/4] Printing local candidate checksums...
py -3.12 -c "from pathlib import Path; import hashlib,sys; p=Path(sys.argv[1]); fs=['pc.html','sp.html','calendar-events.json','favicon.svg']; [print('SHA256',f,hashlib.sha256((p/f).read_bytes()).hexdigest()) for f in fs]" "%PREVIEW%"
if errorlevel 1 goto :failed

echo.
echo STAGE6_1_LOCAL_PREFLIGHT=PASS
echo LOCAL_PREVIEW_CANDIDATE=VERIFIED_PARTIAL_ONLY
echo DEPLOY_READY=NO - full Pages site must be assembled and rechecked.
echo REQUIRED: Pages source setting, full release contents, auth/media/admin tests,
echo Pages deployment approval, and rollback dry-run verification.
echo PRODUCTION=HOLD
goto :done

:python_missing
echo STAGE6_1_LOCAL_PREFLIGHT=BLOCKED_PYTHON
goto :done

:preview_missing
echo STAGE6_1_LOCAL_PREFLIGHT=BLOCKED_PREVIEW_FILES_MISSING
goto :done

:audit_missing
echo STAGE6_1_LOCAL_PREFLIGHT=BLOCKED_AUDIT_EVIDENCE_MISSING
goto :done

:failed
echo STAGE6_1_LOCAL_PREFLIGHT=FAIL
echo PRODUCTION=HOLD
goto :done

:done
echo.
echo No upload, deploy, commit, or original file change was performed.
pause
endlocal
