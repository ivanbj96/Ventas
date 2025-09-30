// ========================================
// 🧪 SCRIPT DE PRUEBA DE CONEXIÓN WEBSOCKET
// ========================================

const WebSocket = require('ws');

function testWebSocketConnection(url, userId = 'test_user') {
    console.log(`🔄 Probando conexión WebSocket a: ${url}`);
    console.log(`👤 Usuario de prueba: ${userId}`);
    
    const deviceId = 'test_device_' + Date.now();
    const token = process.env.TILLUP_TOKEN || 'test_token_' + Date.now();
    const fullUrl = `${url}?userId=${userId}&deviceId=${deviceId}&token=${token}`;
    
    console.log(`🌐 URL completa: ${fullUrl}`);
    
    const ws = new WebSocket(fullUrl);
    
    ws.on('open', function open() {
        console.log('✅ Conexión WebSocket establecida exitosamente');
        
        // Enviar mensaje de identificación
        const identificationMessage = {
            action: 'user_identification',
            data: {
                userId: userId,
                deviceId: deviceId,
                timestamp: Date.now()
            },
            userId: userId,
            timestamp: Date.now()
        };
        
        console.log('📤 Enviando identificación de usuario...');
        ws.send(JSON.stringify(identificationMessage));
        
        // Enviar mensaje de prueba después de 2 segundos
        setTimeout(() => {
            const testMessage = {
                action: 'test_message',
                data: {
                    message: 'Prueba desde script Node.js',
                    timestamp: Date.now()
                },
                userId: userId,
                timestamp: Date.now()
            };
            
            console.log('📤 Enviando mensaje de prueba...');
            ws.send(JSON.stringify(testMessage));
        }, 2000);
        
        // Cerrar conexión después de 5 segundos
        setTimeout(() => {
            console.log('🔚 Cerrando conexión de prueba...');
            ws.close();
        }, 5000);
    });
    
    ws.on('message', function message(data) {
        try {
            const parsed = JSON.parse(data);
            console.log('📥 Mensaje recibido:', parsed);
        } catch (error) {
            console.log('📥 Mensaje recibido (raw):', data.toString());
        }
    });
    
    ws.on('close', function close(code, reason) {
        console.log(`🔚 Conexión cerrada - Código: ${code}, Razón: ${reason}`);
    });
    
    ws.on('error', function error(err) {
        console.error('❌ Error de WebSocket:', err.message);
    });
}

// Función principal
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('❌ Uso: node test-websocket-connection.js <WEBSOCKET_URL> [USER_ID]');
        console.log('📝 Ejemplo: node test-websocket-connection.js wss://abc123.execute-api.us-east-1.amazonaws.com/prod test_user');
        process.exit(1);
    }
    
    const url = args[0];
    const userId = args[1] || 'test_user_' + Date.now();
    
    testWebSocketConnection(url, userId);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = { testWebSocketConnection };