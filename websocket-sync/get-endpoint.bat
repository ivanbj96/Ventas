@echo off
echo ========================================
echo Obteniendo endpoint WebSocket de AWS
echo ========================================

set STACK_NAME=tillup-websocket-realtime
set AWS_REGION=us-east-1

echo.
echo Obteniendo endpoint del stack %STACK_NAME%...

for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --region %AWS_REGION% --query "Stacks[0].Outputs[0].OutputValue" --output text 2^>nul') do set ENDPOINT=%%i

if "%ENDPOINT%"=="" (
    echo ❌ Error: No se pudo obtener el endpoint
    echo Verifica que el stack %STACK_NAME% exista en la región %AWS_REGION%
    pause
    exit /b 1
)

echo.
echo ✅ Endpoint obtenido: %ENDPOINT%
echo.

echo Actualizando archivos de configuración...

echo // Configuración actualizada automáticamente > temp_config.js
echo const TILLUP_SYNC_CONFIG = { >> temp_config.js
echo     WEBSOCKET_URL: '%ENDPOINT%', >> temp_config.js
echo     MAX_RECONNECT_ATTEMPTS: 10, >> temp_config.js
echo     RECONNECT_DELAY_BASE: 1000, >> temp_config.js
echo     RECONNECT_DELAY_MAX: 30000, >> temp_config.js
echo     SYNC_DEBOUNCE: 500, >> temp_config.js
echo     HEARTBEAT_INTERVAL: 30000, >> temp_config.js
echo     CRITICAL_DATA: ['products', 'clients', 'sales', 'debts', 'chickenSales', 'movements'], >> temp_config.js
echo     SETTINGS_DATA: ['pricePerPound', 'costPerPound', 'theme', 'inventoryViewMode', 'clientsViewMode'], >> temp_config.js
echo     MESSAGE_TYPES: { >> temp_config.js
echo         DATA_SYNC: 'data_sync', >> temp_config.js
echo         ACTION_SYNC: 'action_sync', >> temp_config.js
echo         REQUEST_SYNC: 'request_sync', >> temp_config.js
echo         DEVICE_CONNECTED: 'device_connected', >> temp_config.js
echo         DEVICE_DISCONNECTED: 'device_disconnected', >> temp_config.js
echo         HEARTBEAT: 'heartbeat' >> temp_config.js
echo     }, >> temp_config.js
echo     SYNC_ACTIONS: { >> temp_config.js
echo         PRODUCT_ADDED: 'product_added', >> temp_config.js
echo         CLIENT_ADDED: 'client_added', >> temp_config.js
echo         SALE_COMPLETED: 'sale_completed', >> temp_config.js
echo         CHICKEN_SALE_ADDED: 'chicken_sale_added', >> temp_config.js
echo         DEBT_PAYMENT: 'debt_payment', >> temp_config.js
echo         DEBT_ADDED: 'debt_added' >> temp_config.js
echo     } >> temp_config.js
echo }; >> temp_config.js
echo if ^(typeof module !== 'undefined' ^&^& module.exports^) { >> temp_config.js
echo     module.exports = TILLUP_SYNC_CONFIG; >> temp_config.js
echo } else { >> temp_config.js
echo     window.TILLUP_SYNC_CONFIG = TILLUP_SYNC_CONFIG; >> temp_config.js
echo } >> temp_config.js

move temp_config.js config.js

echo ✅ config.js actualizado

echo.
echo ========================================
echo ✅ ENDPOINT CONFIGURADO
echo ========================================
echo.
echo 🔗 WebSocket URL: %ENDPOINT%
echo 📁 Archivo actualizado: config.js
echo.
pause