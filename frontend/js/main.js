// CYBER SAPO - JavaScript Principal
console.log('🎯 CYBER SAPO - Sistema iniciado');

// Verificar conexión con backend
document.addEventListener('DOMContentLoaded', async () => {
    await checkBackendConnection();
});

/**
 * Verificar conexión con el backend
 */
async function checkBackendConnection() {
    try {
        const response = await fetch('http://localhost:3001/api/health');
        const data = await response.json();
        
        if (data.status === 'OK') {
            console.log('✅ Backend conectado:', data.message);
        } else {
            console.warn('⚠️ Backend responde pero con estado inusual:', data);
        }
    } catch (error) {
        console.error('❌ Error conectando con backend:', error);
        showConnectionError();
    }
}

/**
 * Mostrar error de conexión
 */
function showConnectionError() {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'connection-error';
    errorDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 68, 68, 0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            border: 2px solid #ff4444;
            z-index: 1000;
            font-family: 'Courier New', monospace;
        ">
            ⚠️ Backend no disponible<br>
            <small>Inicia el servidor: <code>cd backend && node server.js</code></small>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Ocultar después de 10 segundos
    setTimeout(() => {
        errorDiv.remove();
    }, 10000);
}
