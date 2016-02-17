@ECHO off

REM Kill programs running on the required ports
echo Kill programs running on the required ports
FOR /F "tokens=5 delims= " %%P IN ('netstat -a -n -o ^| findstr :8080') DO TaskKill.exe /F /PID %%P
FOR /F "tokens=5 delims= " %%P IN ('netstat -a -n -o ^| findstr :8082') DO TaskKill.exe /F /PID %%P
FOR /F "tokens=5 delims= " %%P IN ('netstat -a -n -o ^| findstr :4444') DO TaskKill.exe /F /PID %%P

REM Kill all node processes
TaskKill.exe /F /IM node.exe

echo Done killing
