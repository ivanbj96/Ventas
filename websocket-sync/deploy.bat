@echo off
echo ========================================
echo Desplegando TillUp WebSocket Real-Time Sync
echo ========================================

set STACK_NAME=tillup-websocket-realtime
set AWS_REGION=us-east-1

echo.
echo 1. Eliminando stack anterior si existe...
aws cloudformation delete-stack --stack-name %STACK_NAME% --region %AWS_REGION% 2>nul
echo Esperando eliminación...
aws cloudformation wait stack-delete-complete --stack-name %STACK_NAME% --region %AWS_REGION% 2>nul

echo.
echo 2. Empaquetando funciones Lambda...
cd lambda
for %%f in (connect disconnect message) do (
    echo Empaquetando %%f.py...
    powershell -Command "Compress-Archive -Path '%%f.py' -DestinationPath '%%f.zip' -Force"
)
cd ..

echo.
echo 3. Creando stack CloudFormation...
aws cloudformation create-stack ^
    --stack-name %STACK_NAME% ^
    --template-body file://template.yaml ^
    --capabilities CAPABILITY_IAM ^
    --region %AWS_REGION%

echo Esperando creación del stack...
aws cloudformation wait stack-create-complete --stack-name %STACK_NAME% --region %AWS_REGION%

echo.
echo 4. Actualizando funciones Lambda...
aws lambda update-function-code --function-name tillup-connect --zip-file fileb://lambda/connect.zip --region %AWS_REGION%
aws lambda update-function-code --function-name tillup-disconnect --zip-file fileb://lambda/disconnect.zip --region %AWS_REGION%
aws lambda update-function-code --function-name tillup-message --zip-file fileb://lambda/message.zip --region %AWS_REGION%

echo.
echo 5. Obteniendo endpoint...
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --region %AWS_REGION% --query "Stacks[0].Outputs[0].OutputValue" --output text') do set ENDPOINT=%%i

echo.
echo 6. Actualizando configuración...
echo Actualizando config.js con el nuevo endpoint...
powershell -Command "(Get-Content config.js) -replace 'wss://[^'']*', '%ENDPOINT%' | Set-Content config.js"
echo Actualizando tillup-realtime-sync.js con el nuevo endpoint...
powershell -Command "(Get-Content tillup-realtime-sync.js) -replace 'wss://[^'']*', '%ENDPOINT%' | Set-Content tillup-realtime-sync.js"

echo.
echo ========================================
echo ✅ DESPLIEGUE COMPLETADO
echo ========================================
echo.
echo 🔗 Endpoint: %ENDPOINT%
echo.
echo ✅ Archivos de configuración actualizados automáticamente
echo 🧪 Abre test-sync.html para probar la conexión
echo 📱 El sistema de sincronización está listo para usar
echo.
pause