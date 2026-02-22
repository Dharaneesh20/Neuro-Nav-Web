@echo off
REM NeuroNav Development Setup Script
REM Automated setup for Windows (PowerShell version recommended)
REM Usage: setup-dev.bat

setlocal enabledelayedexpansion

REM Colors are limited in batch, so we'll use simple output
echo.
echo ================================
echo NeuroNav Development Setup
echo ================================
echo.

REM Check Node.js
echo Checking prerequisites...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js not found. Please install Node.js v16 or later
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js found: %NODE_VERSION%

REM Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm not found. Please install npm
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm found: %NPM_VERSION%

REM Check Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Git not found. Please install Git
    exit /b 1
)
echo [OK] Git found

echo.
echo ================================
echo Environment Configuration
echo ================================
echo.

REM Create .env file
if exist .env (
    echo [SKIP] .env file already exists
) else (
    copy .env.example .env
    echo [OK] .env file created
    echo [WARNING] Please update .env with your API keys
)

echo.
echo ================================
echo Installing Dependencies
echo ================================
echo.

echo [*] Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install root dependencies
    exit /b 1
)

echo [*] Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install server dependencies
    cd ..
    exit /b 1
)
cd ..

echo [*] Installing client dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install client dependencies
    cd ..
    exit /b 1
)
cd ..

echo [OK] Dependencies installed

echo.
echo ================================
echo Setup Complete!
echo ================================
echo.
echo Quick start commands:
echo.
echo Development mode:
echo   npm run dev          # Start all services (backend + frontend)
echo.
echo Individual services:
echo   npm run server:dev   # Start backend server only
echo   npm run client:dev   # Start React frontend only
echo.
echo Testing:
echo   npm test             # Run all tests
echo   npm run test:server  # Run server tests
echo   npm run test:client  # Run client tests
echo.
echo Code quality:
echo   npm run lint         # Run ESLint
echo   npm run format       # Format code with Prettier
echo.
echo Database:
echo   npm run seed         # Seed database with sample data
echo.
echo Next steps:
echo 1. Update .env with your API keys
echo 2. Ensure MongoDB is running (local or Atlas)
echo 3. Run 'npm run dev' to start development
echo 4. Open http://localhost:3000 in your browser
echo.
echo Happy coding!
