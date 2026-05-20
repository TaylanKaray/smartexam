@echo off
set GEMINI_API_KEY=AIzaSyDnZwea6M8UXQfcuc_qWTESpUw_gSO2Uww
echo Gemini soru uretici basliyor...
python "C:\Users\tayla\OneDrive\Masaüstü\smartexam\generate_questions.py"
echo.
echo Tamamlandi! Bu pencere 10 saniye sonra kapanir.
timeout /t 10
