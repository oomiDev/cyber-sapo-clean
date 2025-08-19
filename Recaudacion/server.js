/**
 * SERVIDOR PRINCIPAL - Sistema de Recaudación de Máquinas Expendedoras
 * 
 * Este archivo configura y ejecuta el servidor Express con MongoDB
 * para gestionar la facturación y seguimiento de ingresos de máquinas.
 */

// Importar dependencias necesarias
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// Importar rutas del sistema
const maquinasRoutes = require('./routes/maquinas');
const pulsosRoutes = require('./routes/pulsos');
const analyticsRoutes = require('./routes/analytics');
const authRoutes = require('./routes/auth');

// Crear aplicación Express
const app = express();
app.set('trust proxy', 1); // Confiar en el proxy de Render para obtener la IP correcta

// Configuración del puerto
const PORT = process.env.PORT || 3000;

// Middlewares de seguridad y configuración
// Configuración de CORS para permitir solicitudes desde el frontend y otros orígenes
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:10000',
        'http://127.0.0.1:5500',
        'https://cyber-sapo-clean.onrender.com'
    ],
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Configuración de Helmet con directivas de seguridad personalizadas
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            "connect-src": ["'self'", "https://cyber-sapo-clean.onrender.com"],
            "font-src": ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            "img-src": ["'self'", "data:"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json({ limit: '10mb' })); // Parser JSON
app.use(express.urlencoded({ extended: true })); // Parser URL encoded

// Servir archivos estáticos (dashboard y simulador)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '../Formacion/EJERCICIO-PRACTICO')));

// Middleware para logs básicos
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Conexión a MongoDB
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/recaudacion_db';

        await mongoose.connect(mongoURI);
        
        console.log('✅ Conectado a MongoDB exitosamente');
    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error.message);
        process.exit(1);
    }
};

// Ruta de prueba básica
app.get('/', (req, res) => {
    res.json({
        mensaje: 'Sistema de Recaudación de Máquinas Expendedoras',
        version: '1.0.0',
        estado: 'Funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// Ruta de estado de la base de datos
app.get('/api/status', async (req, res) => {
    try {
        const dbState = mongoose.connection.readyState;
        const estados = {
            0: 'Desconectado',
            1: 'Conectado',
            2: 'Conectando',
            3: 'Desconectando'
        };

        res.json({
            baseDatos: estados[dbState],
            servidor: 'Activo',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Error verificando estado',
            mensaje: error.message
        });
    }
});

// Rutas de la API del sistema
const regionesRoutes = require('./routes/regiones');
const localesRoutes = require('./routes/locales');
app.use('/api/auth', authRoutes);
app.use('/api/regiones', regionesRoutes);
app.use('/api/locales', localesRoutes);
app.use('/api/maquinas', maquinasRoutes);
app.use('/api/pulsos', pulsosRoutes);
app.use('/api/analytics', analyticsRoutes);

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        mensaje: `La ruta ${req.originalUrl} no existe en este servidor`
    });
});

// Middleware para manejo de errores globales
app.use((error, req, res, next) => {
    console.error('Error del servidor:', error);
    res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: process.env.NODE_ENV === 'development' ? error.message : 'Algo salió mal'
    });
});

// Función para iniciar el servidor
const iniciarServidor = async () => {
    try {
        // Conectar a la base de datos
        await connectDB();
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
            console.log(`📊 Panel de control: http://localhost:${PORT}`);
            console.log(`🔍 Estado del sistema: http://localhost:${PORT}/api/status`);
        });
    } catch (error) {
        console.error('❌ Error iniciando servidor:', error);
        process.exit(1);
    }
};

// Manejo de cierre graceful del servidor
process.on('SIGINT', async () => {
    console.log('\n🔄 Cerrando servidor...');
    try {
        await mongoose.connection.close();
        console.log('✅ Conexión a MongoDB cerrada');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error cerrando conexiones:', error);
        process.exit(1);
    }
});

// Iniciar la aplicación
iniciarServidor();

module.exports = app;
