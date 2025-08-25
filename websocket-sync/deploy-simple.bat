@echo off
echo ========================================
echo Desplegando TillUp WebSocket Sync
echo ========================================

set STACK_NAME=tillup-websocket-realtime
set AWS_REGION=us-east-1

echo.
echo 1. Creando stack CloudFormation...
aws cloudformation create-stack ^
    --stack-name %STACK_NAME% ^
    --template-body file://template.yaml ^
    --capabilities CAPABILITY_IAM ^
    --region %AWS_REGION%

if %ERRORLEVEL% neq 0 (
    echo ❌ Error creando el stack
    pause
    exit /b 1
)

echo.
echo 2. Esperando que el stack se complete...
echo (Esto puede tomar varios minutos)
aws cloudformation wait stack-create-complete --stack-name %STACK_NAME% --region %AWS_REGION%

if %ERRORLEVEL% neq 0 (
    echo ❌ Error: El stack no se completó correctamente
    echo Verificando estado...
    aws cloudformation describe-stacks --stack-name %STACK_NAME% --region %AWS_REGION% --query "Stacks[0].StackStatus" --output text
    pause
    exit /b 1
)

echo.
echo 3. Obteniendo endpoint...
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --region %AWS_REGION% --query "Stacks[0].Outputs[0].OutputValue" --output text') do set ENDPOINT=%%i

echo.
echo ========================================
echo ✅ DESPLIEGUE COMPLETADO
echo ========================================
echo.
echo 🔗 Endpoint: %ENDPOINT%
echo.
echo Ahora ejecuta get-endpoint.bat para actualizar la configuración
echo.
pause