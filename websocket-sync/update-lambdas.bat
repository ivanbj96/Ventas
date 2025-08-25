@echo off
echo ========================================
echo Actualizando funciones Lambda
echo ========================================

set AWS_REGION=us-east-1

echo.
echo 1. Empaquetando funciones...
cd lambda

echo Empaquetando connect.py...
powershell -Command "Compress-Archive -Path 'connect.py' -DestinationPath 'connect.zip' -Force"

echo Empaquetando disconnect.py...
powershell -Command "Compress-Archive -Path 'disconnect.py' -DestinationPath 'disconnect.zip' -Force"

echo Empaquetando message.py...
powershell -Command "Compress-Archive -Path 'message.py' -DestinationPath 'message.zip' -Force"

cd ..

echo.
echo 2. Actualizando funciones en AWS...

echo Actualizando tillup-realtime-connect...
aws lambda update-function-code --function-name tillup-realtime-connect --zip-file fileb://lambda/connect.zip --region %AWS_REGION%

echo Actualizando tillup-realtime-disconnect...
aws lambda update-function-code --function-name tillup-realtime-disconnect --zip-file fileb://lambda/disconnect.zip --region %AWS_REGION%

echo Actualizando tillup-realtime-message...
aws lambda update-function-code --function-name tillup-realtime-message --zip-file fileb://lambda/message.zip --region %AWS_REGION%

echo.
echo ========================================
echo ✅ FUNCIONES ACTUALIZADAS
echo ========================================
echo.
pause