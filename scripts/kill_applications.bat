@ECHO off

REM Kill programs running on the required ports
echo Kill programs running on the required ports
FOR /F "tokens=5 delims= " %%P IN ('netstat -a -n -o ^| findstr :8080') DO TaskKill.exe /F /PID %%P
FOR /F "tokens=5 delims= " %%P IN ('netstat -a -n -o ^| findstr :8082') DO TaskKill.exe /F /PID %%P
FOR /F "tokens=5 delims= " %%P IN ('netstat -a -n -o ^| findstr :4444') DO TaskKill.exe /F /PID %%P

REM Kill remaining processes
TaskKill.exe /F /IM node.exe
TaskKill.exe /F /IM chrome.exe
TaskKill.exe /F /IM 2.20-x64-chromedriver

echo Done killing
