@echo off
title SmartExam AI - Sunum Baslatici
color 0A
echo.
echo  ============================================
echo    SmartExam AI Platform - Baslatiyor...
echo  ============================================
echo.

:: 1. PostgreSQL
echo  [1/4] PostgreSQL baslatiliyor...
"C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" start -D "C:\pgdata" -l "C:\pgdata\pg.log" -s
timeout /t 5 /nobreak >nul
echo        PostgreSQL HAZIR

:: 2. Spring Boot Backend
echo  [2/4] Backend baslatiliyor...
set JAR=C:\Users\tayla\OneDrive\MASAST~1\SMARTE~1\platform\target\platform-0.0.1-SNAPSHOT.jar
if not exist "%JAR%" (
  echo        HATA: JAR dosyasi bulunamadi!
  echo        Once platform klasorunde: mvnw.cmd package -DskipTests
  pause
  exit /b 1
)
start /min "SmartExam Backend" java -jar "%JAR%"
echo        Backend baslatildi (arka planda)

:: 3. Flask AI Servisi
echo  [3/4] AI Servisi baslatiliyor...
set AIDIR=C:\Users\tayla\OneDrive\MASAST~1\SMARTE~1\ai-service
set GEMINI_API_KEY=AIzaSyDAeykD06Y6pPdV9ysUGodB4nfJL9AQw-E
start /min "SmartExam AI" cmd /c "cd /d "%AIDIR%" && set GEMINI_API_KEY=%GEMINI_API_KEY% && set PYTHONIOENCODING=utf-8 && python app.py"
echo        AI Servisi baslatildi (arka planda)

:: Sistemlerin hazir olmasi icin bekle
echo.
echo  Sistemler baslatiliyor, lutfen bekleyin...
timeout /t 20 /nobreak >nul

:: 4. React Frontend
echo  [4/4] Frontend baslatiliyor...
set FRONTEND=C:\Users\tayla\OneDrive\MASAST~1\SMARTE~1\frontend
start "SmartExam Frontend" cmd /k "cd /d "%FRONTEND%" && npm start"

echo.
echo  ============================================
echo    Tum sistemler baslatildi!
echo.
echo    PostgreSQL : localhost:5432
echo    Backend    : http://localhost:8080
echo    AI Servis  : http://localhost:5000
echo    Frontend   : http://localhost:3000
echo.
echo    Tarayici ~30 saniye icinde otomatik acilacak.
echo    Bu pencereyi acik birakabilirsiniz.
echo  ============================================
echo.
pause
