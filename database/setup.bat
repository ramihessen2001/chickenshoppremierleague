@echo off
REM YM Soccer Database Setup Script (Windows)

echo ============================================
echo YM Soccer League - Database Setup (Windows)
echo ============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js is installed
node --version
echo.

REM Check if .env.local exists
if not exist .env.local (
    echo Warning: .env.local file not found
    echo.
    echo Creating .env.local template...
    (
        echo # Supabase Configuration
        echo # Replace these with your actual Supabase credentials
        echo.
        echo NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
        echo NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
        echo.
        echo # Service role key (for data loading - keep secret!)
        echo SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
        echo.
        echo # Admin password
        echo NEXT_PUBLIC_ADMIN_PASSWORD=sport2233
    ) > .env.local
    
    echo Created .env.local template
    echo.
    echo IMPORTANT: Edit .env.local and add your Supabase credentials!
    echo    1. Go to your Supabase project settings
    echo    2. Copy Project URL and API keys
    echo    3. Paste them into .env.local
    echo.
    pause
)

REM Install dependencies
echo Installing required packages...
call npm install @supabase/supabase-js csv-parse
echo.

REM Check CSV files
echo Checking CSV files...
if not exist league_data\rosters.csv (
    echo Error: league_data\rosters.csv not found
    pause
    exit /b 1
)
echo Found rosters.csv

if not exist league_data\schedule.csv (
    echo Error: league_data\schedule.csv not found
    pause
    exit /b 1
)
echo Found schedule.csv
echo.

echo ============================================
echo Next Steps:
echo ============================================
echo.
echo 1. Set up your Supabase database schema:
echo    - Go to your Supabase project
echo    - Navigate to SQL Editor
echo    - Copy contents of 'database\schema.sql'
echo    - Paste and run in SQL Editor
echo.
echo 2. Load your data:
echo    node database\loadData.js
echo.
echo 3. Start your application:
echo    npm run dev
echo.

set /p REPLY="Have you run the schema.sql in Supabase? (y/n): "
if /i "%REPLY%"=="y" (
    echo.
    echo Loading data into Supabase...
    echo.
    node database\loadData.js
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo Setup complete!
        echo.
        echo You can now run: npm run dev
    ) else (
        echo.
        echo Data load failed. Please check error messages.
        echo Common issues:
        echo  - Incorrect Supabase credentials in .env.local
        echo  - Schema not run in Supabase SQL Editor
    )
) else (
    echo.
    echo Please run schema.sql first, then run this script again.
)

pause

