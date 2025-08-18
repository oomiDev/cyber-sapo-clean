/**
 * 🚀 SERVIDOR PRINCIPAL - CYBER SAPO BACKEND
 * 
 * Este archivo es como el "DIRECTOR DE ORQUESTA" de todo el backend.
 * Coordina todos los componentes y los hace trabajar juntos:
 * 
 * RESPONSABILIDADES:
 * 1. Inicializar la conexión con la base de datos
 * 2. Configurar el servidor Express.js
 * 3. Registrar todas las rutas (endpoints) de la API
 * 4. Manejar errores globales
 * 5. Arrancar el servidor en el puerto especificado
 * 
 * FLUJO DE COMUNICACIÓN COMPLETO:
 * Frontend/Panel Admin → HTTP Request → Este Servidor → Rutas → Controladores → Modelos → Base de Datos
 *                                                                                            ↓
 * Frontend/Panel Admin ← HTTP Response ← Este Servidor ← Rutas ← Controladores ← Modelos ← Base de Datos
 * 
 * ARQUITECTURA LIMPIA IMPLEMENTADA:
 * - config/database.js: Manejo de conexión a base de datos
 * - models/: Lógica de negocio y acceso a datos
 * - controllers/: Manejo de peticiones HTTP y validaciones
 * - routes/: Definición de endpoints y rutas
 * - server.js: Coordinación y configuración general
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// 📦 IMPORTAR NUESTROS MÓDULOS ORGANIZADOS
const databaseManager = require('./config/database');

// 🛤️ IMPORTAR TODAS LAS RUTAS
const gameRoutes = require('./routes/gameRoutes');
const machineRoutes = require('./routes/machineRoutes');
const locationRoutes = require('./routes/locationRoutes');

/**
 * 🏗️ CLASE SERVIDOR PRINCIPAL
 * 
 * Esta clase encapsula toda la lógica del servidor para mantener
 * el código organizado y fácil de mantener.
 */
class CyberSapoServer {
    constructor() {
        // 🌐 CREAR LA APLICACIÓN EXPRESS
        this.app = express();
        
        // 🔧 CONFIGURACIÓN DEL SERVIDOR
        this.port = process.env.PORT || 3001;
        this.isDevelopment = process.env.NODE_ENV === 'development';
        
        console.log('🎰 Inicializando servidor CYBER SAPO...');
        console.log(`📊 Modo: ${this.isDevelopment ? 'Desarrollo' : 'Producción'}`);
    }

    /**
     * 🔧 CONFIGURAR MIDDLEWARES
     * 
     * Los middlewares son como "filtros" que procesan todas las peticiones
     * antes de que lleguen a nuestros controladores.
     */
    setupMiddlewares() {
        console.log('🔧 Configurando middlewares...');

        // 🌐 CORS - Permitir peticiones desde el frontend
        // Esto es necesario para que el navegador permita las peticiones
        // desde el frontend (puerto 8080) al backend (puerto 3001)
        this.app.use(cors({
            origin: [
                'http://localhost:8080',    // Frontend local
                'http://127.0.0.1:8080',   // Frontend local alternativo
                'http://localhost:3000',    // React dev server (si se usa)
                'http://127.0.0.1:3000'     // React dev server alternativo
            ],
            credentials: true,              // Permitir cookies y headers de autenticación
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // 📝 PARSER DE JSON - Convertir el body de las peticiones a objetos JavaScript
        // Límite de 10MB para permitir envío de datos grandes si es necesario
        this.app.use(express.json({ limit: '10mb' }));

        // 📝 PARSER DE URL ENCODED - Para formularios HTML tradicionales
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // 📊 LOGGING DE PETICIONES EN DESARROLLO
        if (this.isDevelopment) {
            this.app.use((req, res, next) => {
                const timestamp = new Date().toISOString();
                console.log(`📡 ${timestamp} - ${req.method} ${req.path}`);
                if (Object.keys(req.body).length > 0) {
                    console.log('📝 Body:', JSON.stringify(req.body, null, 2));
                }
                next();
            });
        }

        console.log('✅ Middlewares configurados');
    }

    /**
     * 🛤️ CONFIGURAR TODAS LAS RUTAS DE LA API
     * 
     * Aquí registramos todas las rutas que definimos en los archivos de routes/.
     * Cada grupo de rutas maneja un aspecto específico del sistema.
     */
    setupRoutes() {
        console.log('🛤️ Configurando rutas de la API...');

        // 🏥 RUTA DE SALUD DEL SERVIDOR
        // Permite verificar que el servidor esté funcionando correctamente
        this.app.get('/api/health', (req, res) => {
            res.json({
                success: true,
                status: 'online',
                timestamp: new Date().toISOString(),
                message: 'CYBER SAPO Backend funcionando correctamente',
                version: '2.0.0',
                architecture: 'clean',
                database: 'connected'
            });
        });

        // 🎮 RUTAS DE PARTIDAS
        // Todas las rutas que empiecen con /api/games van a gameRoutes
        this.app.use('/api/games', gameRoutes);
        console.log('✅ Rutas de partidas registradas: /api/games/*');

        // 🎰 RUTAS DE MÁQUINAS
        // Todas las rutas que empiecen con /api/machines van a machineRoutes
        this.app.use('/api/machines', machineRoutes);
        console.log('✅ Rutas de máquinas registradas: /api/machines/*');

        // 🏢 RUTAS DE UBICACIONES
        // Todas las rutas que empiecen con /api/locations van a locationRoutes
        this.app.use('/api/locations', locationRoutes);
        console.log('✅ Rutas de ubicaciones registradas: /api/locations/*');

        // 📊 RUTA DE INFORMACIÓN GENERAL DE LA API
        this.app.get('/api', (req, res) => {
            res.json({
                success: true,
                message: 'CYBER SAPO API v2.0 - Arquitectura Limpia',
                endpoints: {
                    health: 'GET /api/health',
                    games: {
                        create: 'POST /api/games',
                        list: 'GET /api/games',
                        details: 'GET /api/games/:id',
                        stats: 'GET /api/games/stats',
                        start: 'POST /api/games/start',
                        end: 'POST /api/games/end'
                    },
                    machines: {
                        create: 'POST /api/machines',
                        list: 'GET /api/machines',
                        details: 'GET /api/machines/:id',
                        status: 'GET/PUT /api/machines/:id/status',
                        stats: 'GET /api/machines/:id/stats',
                        summary: 'GET /api/machines/summary'
                    },
                    locations: {
                        create: 'POST /api/locations',
                        list: 'GET /api/locations',
                        details: 'GET /api/locations/:id',
                        update: 'PUT /api/locations/:id',
                        deactivate: 'DELETE /api/locations/:id',
                        stats: 'GET /api/locations/:id/stats',
                        summary: 'GET /api/locations/summary',
                        countries: 'GET /api/locations/countries',
                        cities: 'GET /api/locations/cities'
                    }
                },
                documentation: 'Consulta los archivos de rutas para detalles completos'
            });
        });

        console.log('✅ Todas las rutas configuradas');
    }

    /**
     * ❌ CONFIGURAR MANEJO DE ERRORES GLOBALES
     * 
     * Estos middlewares capturan errores que no fueron manejados
     * en los controladores y devuelven respuestas apropiadas.
     */
    setupErrorHandling() {
        console.log('❌ Configurando manejo de errores...');

        // 🔍 MANEJO DE RUTAS NO ENCONTRADAS (404)
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                error: 'Endpoint no encontrado',
                message: `La ruta ${req.method} ${req.originalUrl} no existe`,
                available_endpoints: '/api para ver endpoints disponibles'
            });
        });

        // 💥 MANEJO DE ERRORES GENERALES
        this.app.use((error, req, res, next) => {
            console.error('💥 Error no manejado:', error);

            // Error de sintaxis JSON
            if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
                return res.status(400).json({
                    success: false,
                    error: 'JSON inválido',
                    message: 'El formato del JSON enviado es incorrecto'
                });
            }

            // Error de base de datos
            if (error.message && error.message.includes('database')) {
                return res.status(500).json({
                    success: false,
                    error: 'Error de base de datos',
                    message: 'Problema conectando con la base de datos'
                });
            }

            // Error genérico
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                message: 'Algo salió mal. Inténtalo de nuevo.',
                details: this.isDevelopment ? error.message : undefined,
                timestamp: new Date().toISOString()
            });
        });

        console.log('✅ Manejo de errores configurado');
    }

    /**
     * 🗄️ INICIALIZAR LA BASE DE DATOS
     * 
     * Establece la conexión con SQLite y crea las tablas necesarias.
     */
    async initializeDatabase() {
        console.log('🗄️ Inicializando base de datos...');

        try {
            // 🔌 CONECTAR CON LA BASE DE DATOS
            await databaseManager.connect();

            // 🏗️ CREAR TODAS LAS TABLAS
            await databaseManager.createTables();

            // 🌱 INSERTAR DATOS INICIALES (tipos de negocio)
            await databaseManager.insertInitialData();

            console.log('✅ Base de datos inicializada correctamente');

        } catch (error) {
            console.error('❌ Error inicializando base de datos:', error.message);
            throw error;
        }
    }

    /**
     * 🚀 ARRANCAR EL SERVIDOR
     * 
     * Inicia el servidor HTTP y lo pone a escuchar en el puerto especificado.
     */
    async start() {
        try {
            console.log('🚀 Iniciando servidor CYBER SAPO...');

            // 1️⃣ INICIALIZAR BASE DE DATOS
            await this.initializeDatabase();

            // 2️⃣ CONFIGURAR MIDDLEWARES
            this.setupMiddlewares();

            // 3️⃣ CONFIGURAR RUTAS
            this.setupRoutes();

            // 4️⃣ CONFIGURAR MANEJO DE ERRORES
            this.setupErrorHandling();

            // 5️⃣ ARRANCAR EL SERVIDOR
            this.server = this.app.listen(this.port, () => {
                console.log('');
                console.log('🎉 ===== CYBER SAPO BACKEND INICIADO =====');
                console.log(`🚀 Servidor ejecutándose en puerto ${this.port}`);
                console.log(`🌐 URL base: http://localhost:${this.port}`);
                console.log('');
                console.log('📡 ENDPOINTS PRINCIPALES:');
                console.log(`🏥 Health check: http://localhost:${this.port}/api/health`);
                console.log(`📊 API info: http://localhost:${this.port}/api`);
                console.log(`🎮 Partidas: http://localhost:${this.port}/api/games`);
                console.log(`🎰 Máquinas: http://localhost:${this.port}/api/machines`);
                console.log(`🏢 Ubicaciones: http://localhost:${this.port}/api/locations`);
                console.log('');
                console.log('🎯 Panel Admin: http://localhost:8080/admin.html');
                console.log('🎮 Juego: http://localhost:8080/juego-simple.html');
                console.log('==========================================');
                console.log('');
            });

        } catch (error) {
            console.error('❌ Error arrancando servidor:', error.message);
            process.exit(1);
        }
    }

    /**
     * 🛑 PARAR EL SERVIDOR CORRECTAMENTE
     * 
     * Cierra la conexión con la base de datos y para el servidor HTTP.
     */
    async stop() {
        console.log('🛑 Parando servidor CYBER SAPO...');

        try {
            // 🗄️ CERRAR CONEXIÓN CON BASE DE DATOS
            await databaseManager.close();

            // 🚪 CERRAR SERVIDOR HTTP
            if (this.server) {
                this.server.close(() => {
                    console.log('✅ Servidor cerrado correctamente');
                });
            }

        } catch (error) {
            console.error('❌ Error parando servidor:', error.message);
        }
    }
}

// 🏭 CREAR INSTANCIA DEL SERVIDOR
const server = new CyberSapoServer();

// 🎯 MANEJO DE SEÑALES DEL SISTEMA PARA CERRAR CORRECTAMENTE
process.on('SIGINT', async () => {
    console.log('\n🛑 Recibida señal SIGINT (Ctrl+C)');
    await server.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Recibida señal SIGTERM');
    await server.stop();
    process.exit(0);
});

// 💥 MANEJO DE ERRORES NO CAPTURADOS
process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Promesa rechazada no manejada:', reason);
    console.error('En promesa:', promise);
});

process.on('uncaughtException', (error) => {
    console.error('💥 Excepción no capturada:', error);
    process.exit(1);
});

// 🚀 ARRANCAR EL SERVIDOR SI ESTE ARCHIVO SE EJECUTA DIRECTAMENTE
if (require.main === module) {
    server.start().catch(error => {
        console.error('💥 Error crítico arrancando servidor:', error);
        process.exit(1);
    });
}

// 📤 EXPORTAR PARA TESTS O USO EXTERNO
module.exports = { CyberSapoServer, server };
