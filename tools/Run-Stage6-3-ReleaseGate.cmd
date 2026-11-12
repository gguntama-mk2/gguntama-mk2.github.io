@echo off
setlocal EnableExtensions DisableDelayedExpansion
title PROJECT T Stage 6.3 - LOCAL RELEASE GATE (READ ONLY)
echo ======================================================
echo PROJECT T STAGE 6.3 - LOCAL RELEASE GATE
echo PRODUCTION, MAIN, RENDER, ORIGINALS: NO CHANGES
echo ======================================================
rem This tool reads existing local preview and evidence ONLY.
rem It does NOT build, merge, deploy, upload, backup, or rollback anything.
rem Pages run 75 published commit: 948650d5390dd1bc621b8d61e2ab4939588c8ce8
rem Main at audit: ef312e3daecd8511fde3db1072596fabc5c66719 (newer admin-only commit).
rem Prior Git blobs PC:2419e9d297f5ef9b0e3be53770745a6d43859590
rem Prior Git blobs SP:390291835095bd79c2e5daf0d4faa5f72b0bf3c1
rem Pages source: Deploy from a branch, main/(root).
rem Small changes alone CANNOT patch already-published embedded PC/SP content.
rem A future Actions build is optional and requires explicit change approval.
set "PREVIEW=%USERPROFILE%\Downloads\PROJECT_T_Calendar_Clock_Stage4_v1.1_WindowsFix_2026-11-12\PROJECT_T_Stage4\PROJECT_T_STAGE4_FULL_PREVIEW"
set "AUDIT=%USERPROFILE%\Downloads\PROJECT_T_Calendar_Clock_Stage4_v1.2_9652_AuditFix_2026-11-12\PROJECT_T_Stage4\PROJECT_T_STAGE4_V1_2_EVIDENCE\STAGE4_V1_2_AUDIT.json"
where py >nul 2>&1
if errorlevel 1 goto :missing_python
if not exist "%PREVIEW%\pc.html" goto :missing_preview
if not exist "%PREVIEW%\STAGE3_VERIFY.json" goto :missing_preview
if not exist "%AUDIT%" goto :missing_audit
echo [1/2] Checking candidate SHA256, evidence and 21 events...
py -3.12 -c "import hashlib,json,pathlib,sys;p=pathlib.Path(sys.argv[1]);audit=pathlib.Path(sys.argv[2]);exp={'pc.html':'d7f60c1ee0f33e2ffd91f6351744b9b9b29b88ec81639fc63754ef7f45c0595d','sp.html':'d5a83515c14c9daf7b1a7ffb8772e609c5d75cc7da6e5cd151e734f8e4157981','calendar-events.json':'9e9bf2a93e86cda8350172cbef88bdbad56675ef2b17b1ccddee00b7b09e77d8','favicon.svg':'6bb65df10133812ba720dd59303e5834e85a4adca7b077ebe82e1c302081e5d6'};missing=[n for n in exp if not (p/n).is_file()];assert not missing,('Missing release candidates',missing);bad=[n for n,h in exp.items() if hashlib.sha256((p/n).read_bytes()).hexdigest()!=h];assert not bad,('SHA256 MISMATCH',bad);print('STAGE6_3_CORE_SHA256=PASS_4');assert len(json.loads((p/'calendar-events.json').read_text(encoding='utf-8')).get('events',[]))==21;assert isinstance(json.loads((p/'STAGE3_VERIFY.json').read_text(encoding='utf-8')),dict);assert isinstance(json.loads(audit.read_text(encoding='utf-8')),dict);print('STAGE6_3_EVIDENCE_JSON=READABLE');print('STAGE6_3_CALENDAR_EVENTS=PASS_21')" "%PREVIEW%" "%AUDIT%"
if errorlevel 1 goto :failed
echo [2/2] Checking 19 static files against fixed Git blob SHA1...
py -3.12 -c "import hashlib,pathlib,sys;p=pathlib.Path(sys.argv[1]);exp={'move-icons.js':'776e4b4c2f42174d3ff28d7f8a588e0aef3bec69','move-media.js':'4669edaac890a5aa270dd6cc8822ca055beb83d5','combos-live.json':'10253ce01be44b7959cc61ade7793e65a81c62d4','px-overrides.js':'d7d68dfd98d3a9726f0c871bafc25bf368017744','icons/tornado.webp':'ddbe7a1dd287b7e3c86ad6c3f960ba16065acd67','icons/powercrush.webp':'3f9d2d7dbf63cfdf1417a0154be5f7d69615881f','icons/heatengage.webp':'d20517705cb0746c8e90fb8acc251f34d861bbe7','icons/recoverable.webp':'f081ce806e91a13df4849f9c3b3180a90f7ac7ab','icons/homing.webp':'d354360be96a494fcc96b21405f2259344b1f0c8','icons/forcedcrouch.webp':'f44f4cc04fad29de920ef92378f8acf010adcb14','icons/floorgimmick.webp':'a76e46098c788e092efe656a4e37e6a5d9cca396','icons/wallbreak.webp':'78be4c3301b6ae1ac4d7c17a01ceb3b02ca20378','icons/hardwallbreak.webp':'91fa34e3dbf6def53bc5dea847a8f1c588ba801a','icons/wallblast.webp':'9c38355493470fc069a88043600613bb21395080','icons/wallbound.webp':'0b79e68da002e4f480032dfe5d6b8e75355e687a','icons/balconybreak.webp':'530f1020dc67fb9306a5fc59327e00cd1f34cb39','icons/floorbreak.webp':'0f89272f5c97e9622099582dc7b9ec7f09854d41','icons/hardfloorbreak.webp':'14df42ab5fd015547cbf3a88924975a2293625b6','icons/floorblast.webp':'aaf4beff2d6f31218520a9ab769eccc47319b6be'};missing=[n for n in exp if not (p/n).is_file()];assert not missing,('Missing static assets',missing);bad=[];[(lambda n,h,d:bad.append(n) if hashlib.sha1(b'blob '+str(len(d)).encode('ascii')+bytes([0])+d).hexdigest()!=h else None)(n,h,(p/n).read_bytes()) for n,h in exp.items()];assert not bad,('GIT BLOB MISMATCH',bad);print('STAGE6_3_STATIC_GIT_BLOBS=PASS_19')" "%PREVIEW%"
if errorlevel 1 goto :failed
echo.
echo STAGE6_3_RELEASE_CANDIDATE=PASS_SCOPED_LOCAL
echo PAGES_SITE_COMPLETE=NOT_VERIFIED
echo PRODUCTION_AUTH_MEDIA_ADMIN=NOT_VERIFIED
echo CURRENT_MAIN_DEPLOYED=NOT_VERIFIED
echo ROLLBACK_EXECUTION=NOT_PERFORMED
echo DEPLOY_READY=NO
echo PRODUCTION=HOLD
goto :end
:missing_python
echo STAGE6_3=BLOCKED_PYTHON_3_12_REQUIRED
goto :end
:missing_preview
echo STAGE6_3=BLOCKED_PREVIEW_OR_EVIDENCE_MISSING
goto :end
:missing_audit
echo STAGE6_3=BLOCKED_STAGE4_AUDIT_MISSING
goto :end
:failed
echo STAGE6_3=FAIL - READ ONLY STOP
echo PRODUCTION=HOLD
goto :end
:end
echo.
echo NO FILES CHANGED. NO NETWORK CALLS. NO DEPLOY.
pause
endlocal
