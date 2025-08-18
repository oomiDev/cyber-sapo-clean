/**
 * 🖥️ SERVIDOR BACKEND - CYBER SAPO EJERCICIO
 * Este servidor maneja la comunicación entre el juego y la app usuario
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

// Crear aplicación Express
const app = express();
const server = http.createServer(app);

// Configurar Socket.IO con CORS
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Configurar middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Servir archivos estáticos

// 📊 BASE DE DATOS SIMPLE EN MEMORIA
let estadoJuego = {
    jugadores: [
        { id: 1, nombre: 'Jugador 1', puntuacion: 0, activo: true },
        { id: 2, nombre: 'Jugador 2', puntuacion: 0, activo: false }
    ],
    jugadorActual: 1,
    historial: [],
    partidaIniciada: false
};

// 🛤️ RUTAS HTTP BÁSICAS

// Ruta principal - mostrar información del servidor
app.get('/', (req, res) => {
    res.send(`
        <h1>🐸 CYBER SAPO - Servidor del Ejercicio</h1>
        <p>✅ Servidor funcionando correctamente</p>
        <p>🎮 <a href="/juego.html">Abrir Juego</a></p>
        <p>📱 <a href="/app-usuario.html">Abrir App Usuario</a></p>
        <p>📊 Jugadores conectados: ${io.engine.clientsCount}</p>
        <p>🕒 Servidor iniciado: ${new Date().toLocaleString()}</p>
    `);
});

// Obtener estado actual del juego
app.get('/api/estado', (req, res) => {
    console.log('📊 Enviando estado del juego');
    res.json({
        success: true,
        data: estadoJuego,
        timestamp: new Date().toISOString()
    });
});

// 📊 VISUALIZADOR DE BASE DE DATOS
app.get('/database', (req, res) => {
    const clientesConectados = io.engine.clientsCount;
    
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>📊 CYBER SAPO - Base de Datos</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    margin: 0;
                    padding: 20px;
                    color: #333;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 15px;
                    padding: 30px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    text-align: center;
                    color: #333;
                    margin-bottom: 30px;
                    font-size: 2.5rem;
                }
                .section {
                    background: #f8f9fa;
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 20px;
                    border-left: 5px solid #4CAF50;
                }
                .section h2 {
                    color: #4CAF50;
                    margin-bottom: 15px;
                    font-size: 1.5rem;
                }
                .json-container {
                    background: #2d3748;
                    color: #e2e8f0;
                    padding: 15px;
                    border-radius: 8px;
                    overflow-x: auto;
                    font-family: 'Courier New', monospace;
                    white-space: pre-wrap;
                    font-size: 14px;
                    line-height: 1.5;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }
                .stat-card {
                    background: linear-gradient(135deg, #4CAF50, #45a049);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                }
                .stat-value {
                    font-size: 2rem;
                    font-weight: bold;
                    display: block;
                }
                .stat-label {
                    font-size: 0.9rem;
                    opacity: 0.9;
                }
                .refresh-btn {
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1rem;
                    margin-bottom: 20px;
                }
                .refresh-btn:hover {
                    background: #45a049;
                }
                .timestamp {
                    text-align: center;
                    color: #666;
                    font-size: 0.9rem;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📊 CYBER SAPO - Visualizador de Base de Datos</h1>
                
                <button class="refresh-btn" onclick="location.reload()">🔄 Actualizar Datos</button>
                
                <!-- Estadísticas Rápidas -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-value">${estadoJuego.jugadores.length}</span>
                        <span class="stat-label">Jugadores</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${estadoJuego.historial.length}</span>
                        <span class="stat-label">Jugadas Totales</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${clientesConectados}</span>
                        <span class="stat-label">Clientes Conectados</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${estadoJuego.partidaIniciada ? 'SÍ' : 'NO'}</span>
                        <span class="stat-label">Partida Activa</span>
                    </div>
                </div>
                
                <!-- Estado Completo del Juego -->
                <div class="section">
                    <h2>🎮 Estado Completo del Juego</h2>
                    <div class="json-container">${JSON.stringify(estadoJuego, null, 2)}</div>
                </div>
                
                <!-- Información de Jugadores -->
                <div class="section">
                    <h2>👥 Jugadores</h2>
                    <div class="json-container">${JSON.stringify(estadoJuego.jugadores, null, 2)}</div>
                </div>
                
                <!-- Historial de Jugadas -->
                <div class="section">
                    <h2>📝 Historial de Jugadas (Últimas ${estadoJuego.historial.length})</h2>
                    <div class="json-container">${JSON.stringify(estadoJuego.historial, null, 2)}</div>
                </div>
                
                <!-- Información del Servidor -->
                <div class="section">
                    <h2>🖥️ Información del Servidor</h2>
                    <div class="json-container">{
  "puerto": ${PORT},
  "clientesConectados": ${clientesConectados},
  "tiempoInicio": "${new Date().toISOString()}",
  "urls": {
    "juego": "http://localhost:${PORT}/juego.html",
    "appUsuario": "http://localhost:${PORT}/app-usuario.html",
    "baseDatos": "http://localhost:${PORT}/database"
  }
}</div>
                </div>
                
                <div class="timestamp">
                    📅 Última actualización: ${new Date().toLocaleString()}
                </div>
            </div>
            
            <script>
                // Auto-refresh cada 5 segundos
                setTimeout(() => {
                    location.reload();
                }, 5000);
            </script>
        </body>
        </html>
    `);
});

// Reiniciar juego
app.post('/api/reiniciar', (req, res) => {
    console.log('🔄 Reiniciando juego');
    
    // Resetear estado
    estadoJuego.jugadores.forEach(jugador => {
        jugador.puntuacion = 0;
        jugador.activo = jugador.id === 1;
    });
    estadoJuego.jugadorActual = 1;
    estadoJuego.historial = [];
    estadoJuego.partidaIniciada = true;
    
    // Notificar a todos los clientes
    io.emit('juego_reiniciado', estadoJuego);
    
    res.json({
        success: true,
        message: 'Juego reiniciado',
        data: estadoJuego
    });
});

// 🔌 EVENTOS WEBSOCKET

io.on('connection', (socket) => {
    console.log(`✅ Cliente conectado: ${socket.id}`);
    
    // Enviar estado actual al cliente recién conectado
    socket.emit('estado_inicial', {
        tipo: 'estado_inicial',
        data: estadoJuego,
        mensaje: 'Conectado al servidor CYBER SAPO'
    });
    
    // 📤 EVENTO: Nueva puntuación desde el juego
    socket.on('nueva_puntuacion', (datos) => {
        console.log('📨 Nueva puntuación recibida:', datos);
        
        try {
            // 🛡️ VALIDAR DATOS
            if (!datos.jugadorId || datos.puntos === undefined || !datos.hoyo) {
                throw new Error('Datos de puntuación incompletos');
            }
            
            // 🔍 BUSCAR JUGADOR
            const jugador = estadoJuego.jugadores.find(j => j.id === datos.jugadorId);
            if (!jugador) {
                throw new Error('Jugador no encontrado');
            }
            
            // ✅ PROCESAR PUNTUACIÓN
            const puntosAnteriores = jugador.puntuacion;
            jugador.puntuacion += datos.puntos;
            
            // 📝 AGREGAR AL HISTORIAL
            const jugada = {
                id: Date.now(),
                jugadorId: datos.jugadorId,
                jugadorNombre: jugador.nombre,
                hoyo: datos.hoyo,
                puntos: datos.puntos,
                puntuacionTotal: jugador.puntuacion,
                timestamp: new Date().toISOString()
            };
            
            estadoJuego.historial.unshift(jugada); // Agregar al inicio
            
            // Mantener solo últimas 10 jugadas
            if (estadoJuego.historial.length > 10) {
                estadoJuego.historial = estadoJuego.historial.slice(0, 10);
            }
            
            // 📡 ENVIAR ACTUALIZACIÓN A TODOS LOS CLIENTES
            const actualizacion = {
                tipo: 'puntuacion_actualizada',
                data: {
                    jugador: jugador,
                    jugada: jugada,
                    estadoCompleto: estadoJuego
                }
            };
            
            io.emit('puntuacion_actualizada', actualizacion);
            
            console.log(`📤 Puntuación actualizada: ${jugador.nombre} ahora tiene ${jugador.puntuacion} puntos`);
            
        } catch (error) {
            console.error('❌ Error procesando puntuación:', error.message);
            
            // Enviar error solo al cliente que envió
            socket.emit('error_puntuacion', {
                tipo: 'error',
                mensaje: error.message,
                datos: datos
            });
        }
    });
    
    // 👤 EVENTO: Cambiar jugador activo
    socket.on('cambiar_jugador', (datos) => {
        console.log('👤 Cambiando jugador activo');
        
        try {
            // Desactivar jugador actual
            estadoJuego.jugadores.forEach(j => j.activo = false);
            
            // Buscar siguiente jugador
            let siguienteId = estadoJuego.jugadorActual + 1;
            if (siguienteId > estadoJuego.jugadores.length) {
                siguienteId = 1; // Volver al primer jugador
            }
            
            // Activar siguiente jugador
            const siguienteJugador = estadoJuego.jugadores.find(j => j.id === siguienteId);
            if (siguienteJugador) {
                siguienteJugador.activo = true;
                estadoJuego.jugadorActual = siguienteId;
            }
            
            // Notificar cambio
            io.emit('jugador_cambiado', {
                tipo: 'jugador_cambiado',
                data: {
                    jugadorActual: siguienteJugador,
                    estadoCompleto: estadoJuego
                }
            });
            
            console.log(`👤 Jugador activo cambiado a: ${siguienteJugador.nombre}`);
            
        } catch (error) {
            console.error('❌ Error cambiando jugador:', error.message);
            socket.emit('error', { mensaje: error.message });
        }
    });
    
    // 🔌 EVENTO: Cliente se desconecta
    socket.on('disconnect', () => {
        console.log(`❌ Cliente desconectado: ${socket.id}`);
    });
    
    // 💬 EVENTO: Mensaje de chat (opcional)
    socket.on('mensaje_chat', (datos) => {
        console.log('💬 Mensaje de chat:', datos);
        
        // Reenviar a todos los clientes
        io.emit('nuevo_mensaje', {
            tipo: 'mensaje',
            data: {
                mensaje: datos.mensaje,
                autor: datos.autor || 'Anónimo',
                timestamp: new Date().toISOString()
            }
        });
    });
});

// 🚀 INICIAR SERVIDOR
const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
    console.log('🎮 ================================');
    console.log('🐸 CYBER SAPO - Servidor Iniciado');
    console.log('🎮 ================================');
    console.log(`🌐 Servidor corriendo en: http://localhost:${PORT}`);
    console.log(`🎮 Juego disponible en: http://localhost:${PORT}/juego.html`);
    console.log(`📱 App Usuario en: http://localhost:${PORT}/app-usuario.html`);
    console.log(`🔌 WebSocket listo para conexiones`);
    console.log(`📊 Estado inicial:`, estadoJuego);
    console.log('🎮 ================================');
});

// 🛡️ MANEJO DE ERRORES GLOBALES
process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
});
