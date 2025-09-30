// ========================================
// 🔧 SCRIPT PARA ACTUALIZAR URL DEL WEBSOCKET
// ========================================

const fs = require('fs');
const path = require('path');

// Función para actualizar URL en un archivo
function updateWebSocketUrl(filePath, newUrl) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Patrones a buscar y reemplazar
        const patterns = [
            /this\.baseUrl = 'wss:\/\/TU-API-ID\.execute-api\.us-east-1\.amazonaws\.com\/prod';/g,
            /this\.serverUrl = 'wss:\/\/TU-API-ID\.execute-api\.us-east-1\.amazonaws\.com\/prod';/g,
            /wss:\/\/v01p4kd6ig\.execute-api\.us-east-1\.amazonaws\.com\/prod/g
        ];
        
        let updated = false;
        patterns.forEach(pattern => {
            if (pattern.test(content)) {
                content = content.replace(pattern, newUrl);
                updated = true;
            }
        });
        
        if (updated) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Actualizado: ${filePath}`);
            return true;
        } else {
            console.log(`⚠️ No se encontraron patrones en: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error actualizando ${filePath}:`, error.message);
        return false;
    }
}

// Función principal
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('❌ Uso: node update-websocket-url.js <API_ID>');
        console.log('📝 Ejemplo: node update-websocket-url.js abc123def456');
        process.exit(1);
    }
    
    const apiId = args[0];
    const newUrl = `wss://${apiId}.execute-api.us-east-1.amazonaws.com/prod`;
    
    console.log(`🔄 Actualizando URLs a: ${newUrl}`);
    
    // Archivos a actualizar
    const filesToUpdate = [
        'websocket-sync-client.js',
        'js/modules/websocket.js'
    ];
    
    let updatedCount = 0;
    
    filesToUpdate.forEach(file => {
        if (fs.existsSync(file)) {
            if (updateWebSocketUrl(file, `this.baseUrl = '${newUrl}';`)) {
                updatedCount++;
            }
        } else {
            console.log(`⚠️ Archivo no encontrado: ${file}`);
        }
    });
    
    console.log(`\n🎉 Proceso completado: ${updatedCount} archivos actualizados`);
    console.log(`📋 URL configurada: ${newUrl}`);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = { updateWebSocketUrl };