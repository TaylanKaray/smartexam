@echo off
set PYTHONIOENCODING=utf-8
echo === SmartExam Gemini Soru Uretici ===
echo Tum keyler sirayla calistirilacak...
echo.

echo [KEY 1] Basliyor...
set GEMINI_API_KEY=AIzaSyCPb7-Fyon7p_MTJbjVGOPRh4djpcxQOjM
python "C:\Users\tayla\OneDrive\Masaüstü\smartexam\generate_questions.py"
echo [KEY 1] Bitti.
echo.

echo [KEY 2] Basliyor...
set GEMINI_API_KEY=AIzaSyDnZwea6M8UXQfcuc_qWTESpUw_gSO2Uww
python "C:\Users\tayla\OneDrive\Masaüstü\smartexam\generate_questions.py"
echo [KEY 2] Bitti.
echo.

echo [KEY 4] Basliyor...
set GEMINI_API_KEY=AIzaSyDxzSYi_bPIixCW1lcnWiGyX7PupuDrVaY
python "C:\Users\tayla\OneDrive\Masaüstü\smartexam\generate_questions.py"
echo [KEY 4] Bitti.
echo.

echo === TUM KEYLER TAMAMLANDI ===
echo Toplam ~1200 soru eklenmis olmali.
pause
