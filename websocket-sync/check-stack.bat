@echo off
echo ========================================
echo Verificando stack de CloudFormation
echo ========================================

set STACK_NAME=tillup-websocket-realtime
set AWS_REGION=us-east-1

echo.
echo Verificando si el stack %STACK_NAME% existe...

aws cloudformation describe-stacks --stack-name %STACK_NAME% --region %AWS_REGION% --query "Stacks[0].{StackName:StackName,StackStatus:StackStatus}" --output table 2>nul

if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ El stack %STACK_NAME% no existe
    echo.
    echo Opciones:
    echo 1. Ejecutar deploy.bat para crear el stack
    echo 2. Verificar que AWS CLI esté configurado correctamente
    echo 3. Verificar permisos de AWS
    echo.
) else (
    echo.
    echo ✅ Stack encontrado. Obteniendo outputs...
    aws cloudformation describe-stacks --stack-name %STACK_NAME% --region %AWS_REGION% --query "Stacks[0].Outputs" --output table
)

echo.
pause