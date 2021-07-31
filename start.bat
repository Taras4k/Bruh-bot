@echo off
color 2
echo Starting bot
:1
node bot
echo Error; Restarting in 5 seconds
timeout 5
goto 1