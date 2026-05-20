@echo off
title SmartExam - Tunnel Yenile ve Deploy Et
color 0B
echo.
echo  ============================================
echo    SmartExam - Tunnel Yenileniyor...
echo  ============================================
echo.

set SMDIR=C:\Users\tayla\OneDrive\MASAST~1\smartexam
set CLOUDFLARED=%SMDIR%\cloudflared.exe
set FRONTEND=%SMDIR%\frontend
set LOGBACK=%SMDIR%\tunnel_backend.log
set LOGFLASK=%SMDIR%\tunnel_flask.log

:: Eski tunnel'lari kapat
echo  [1/5] Eski tunnel'lar kapatiliyor...
taskkill /F /IM cloudflared.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo        Temizlendi

:: Backend tunnel
echo  [2/5] Backend tunnel baslatiliyor...
del "%LOGBACK%" >nul 2>&1
start /min "Tunnel Backend" "%CLOUDFLARED%" tunnel --url http://localhost:8080 --logfile "%LOGBACK%"
timeout /t 12 /nobreak >nul

:: Flask tunnel
echo  [3/5] AI tunnel baslatiliyor...
del "%LOGFLASK%" >nul 2>&1
start /min "Tunnel Flask" "%CLOUDFLARED%" tunnel --url http://localhost:5000 --logfile "%LOGFLASK%"
timeout /t 12 /nobreak >nul

:: URL'leri oku, goster ve env'i guncelle
echo  [4/5] URL'ler okunuyor...
python -c "
import re

def get_url(logfile):
    try:
        with open(logfile, 'r') as f:
            content = f.read()
        urls = re.findall(r'https://[a-z0-9\-]+\.trycloudflare\.com', content)
        return urls[-1] if urls else None
    except:
        return None

backend = get_url(r'C:\Users\tayla\OneDrive\MASAST~1\smartexam\tunnel_backend.log')
flask   = get_url(r'C:\Users\tayla\OneDrive\MASAST~1\smartexam\tunnel_flask.log')

if backend and flask:
    env = 'REACT_APP_API_URL=' + backend + '\nREACT_APP_AI_URL=' + flask + '\n'
    with open(r'C:\Users\tayla\OneDrive\MASAST~1\smartexam\frontend\.env.production', 'w') as f:
        f.write(env)
    print('')
    print('  Backend URL : ' + backend)
    print('  Flask URL   : ' + flask)
    print('  .env.production guncellendi')
else:
    print('HATA: URL alinamadi - tunnel baslamis olmali!')
    exit(1)
"

if %ERRORLEVEL% NEQ 0 (
    echo  HATA: URL alinamadi!
    pause
    exit /b 1
)

:: Frontend build
echo.
echo  [5/5] Frontend build ve Vercel deploy ediliyor (2-3 dk)...
cd "%FRONTEND%"
call npm run build --silent

cd build
if exist ".vercel" rmdir /s /q ".vercel"
call npx vercel deploy --prod --scope taylankarays-projects 2>&1 | findstr /i "aliased\|production\|error\|ready"

echo.
echo  ============================================
echo    TAMAMLANDI! Site guncellendi.
echo    https://smartexam-tr.vercel.app
echo  ============================================
echo.

:: Siteyi otomatik ac
start "" "https://smartexam-tr.vercel.app"

pause
