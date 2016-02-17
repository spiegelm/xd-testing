bash scripts/test.sh
set return=%errorlevel% # store return code
call scripts\kill_applications.bat
exit /B %return%
