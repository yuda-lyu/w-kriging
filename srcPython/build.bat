
pyinstaller -F kriging.py
pause

pyinstaller build.spec
pause

pyinstaller kriging.py
pause
