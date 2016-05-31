bash scripts/test.sh
REM store return code
set return=%errorlevel%
call cmd /C scripts\kill_applications.bat > kill.log 2>&1
exit /B %return%
