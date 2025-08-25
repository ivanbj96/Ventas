@echo off
echo ========================================
echo Redeployando TillUp WebSocket Sync
echo ========================================

set STACK_NAME=tillup-websocket-realtime
set AWS_REGION=us-east-1

echo.
echo 1. Eliminando stack fallido...
aws cloudformation delete-stack --stack-name %STACK_NAME% --region %AWS_REGION%

echo Esperando eliminación completa...
aws cloudformation wait stack-delete-complete --stack-name %STACK_NAME% --region %AWS_REGION%

if %ERRORLEVEL% neq 0 (
    echo ❌ Error eliminando el stack
    pause
    exit /b 1
)

echo ✅ Stack eliminado correctamente

echo.
echo 2. Creando nuevo stack...
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
echo 3. Esperando que el stack se complete...
echo (Esto puede tomar varios minutos)
aws cloudformation wait stack-create-complete --stack-name %STACK_NAME% --region %AWS_REGION%

if %ERRORLEVEL% neq 0 (
    echo ❌ Error: El stack no se completó correctamente
    aws cloudformation describe-stack-events --stack-name %STACK_NAME% --region %AWS_REGION% --query "StackEvents[?ResourceStatus=='CREATE_FAILED'].{Resource:LogicalResourceId,Reason:ResourceStatusReason}" --output table
    pause
    exit /b 1
)

echo.
echo 4. Obteniendo endpoint...
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --region %AWS_REGION% --query "Stacks[0].Outputs[0].OutputValue" --output text') do set ENDPOINT=%%i

echo.
echo ========================================
echo ✅ REDESPLIEGUE COMPLETADO
echo ========================================
echo.
echo 🔗 Endpoint: %ENDPOINT%
echo.
echo Ejecutando get-endpoint.bat para actualizar configuración...
call get-endpoint.bat

pause