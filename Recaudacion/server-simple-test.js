/**
 * SERVIDOR SIMPLE PARA PRUEBAS - Sin MongoDB
 * Permite probar el simulador inmediatamente
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3002; // Puerto diferente para no interferir

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Almacenamiento temporal en memoria
let pulsos = [];
let estadisticas = {
    totalPulsos: 0,
    totalIngresos: 0,
    maquinas: new Set()
};

// Middleware para logs
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Ruta principal
app.get('/', (req, res) => {
    res.json({
        mensaje: 'Servidor Simple de Pruebas - Sistema de Recaudación',
        version: '1.0.0-test',
        estado: 'Funcionando (sin MongoDB)',
        timestamp: new Date().toISOString()
    });
});

// Estado del servidor
app.get('/api/status', (req, res) => {
    res.json({
        baseDatos: 'Memoria (sin MongoDB)',
        servidor: 'Activo',
        timestamp: new Date().toISOString(),
        estadisticas: {
            totalPulsos: estadisticas.totalPulsos,
            totalIngresos: estadisticas.totalIngresos,
            maquinasActivas: estadisticas.maquinas.size
        }
    });
});

// Test de conexión para el simulador
app.get('/api/pulsos/test', (req, res) => {
    res.json({
        mensaje: 'Conexión exitosa',
        servidor: 'Listo para recibir pulsos',
        timestamp: new Date().toISOString()
    });
});

// Recibir pulsos (POST)
app.post('/api/pulsos', (req, res) => {
    try {
        const { codigoMaquina, valor, timestamp, tipo } = req.body;
        
        // Validar datos
        if (!codigoMaquina || !valor) {
            return res.status(400).json({
                error: 'Datos faltantes',
                mensaje: 'Se requiere codigoMaquina y valor'
            });
        }

        // Crear pulso
        const pulso = {
            id: Date.now(),
            codigoMaquina,
            valor: parseFloat(valor),
            timestamp: timestamp || new Date().toISOString(),
            tipo: tipo || 'credito'
        };

        // Guardar en memoria
        pulsos.push(pulso);
        
        // Actualizar estadísticas
        estadisticas.totalPulsos++;
        estadisticas.totalIngresos += pulso.valor;
        estadisticas.maquinas.add(codigoMaquina);

        console.log(`💰 Pulso recibido: ${codigoMaquina} - €${valor} - Total: ${estadisticas.totalPulsos}`);

        res.json({
            exito: true,
            mensaje: 'Pulso registrado correctamente',
            pulso,
            estadisticas: {
                totalPulsos: estadisticas.totalPulsos,
                totalIngresos: estadisticas.totalIngresos.toFixed(2)
            }
        });

    } catch (error) {
        console.error('Error procesando pulso:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            mensaje: error.message
        });
    }
});

// Obtener estadísticas para dashboard
app.get('/api/analytics/dashboard', (req, res) => {
    const hoy = new Date();
    const pulsosHoy = pulsos.filter(p => {
        const fechaPulso = new Date(p.timestamp);
        return fechaPulso.toDateString() === hoy.toDateString();
    });

    const ingresosPorMaquina = {};
    pulsosHoy.forEach(p => {
        if (!ingresosPorMaquina[p.codigoMaquina]) {
            ingresosPorMaquina[p.codigoMaquina] = { pulsos: 0, ingresos: 0 };
        }
        ingresosPorMaquina[p.codigoMaquina].pulsos++;
        ingresosPorMaquina[p.codigoMaquina].ingresos += p.valor;
    });

    const topMaquinas = Object.entries(ingresosPorMaquina)
        .map(([codigo, datos]) => ({ _id: codigo, ...datos }))
        .sort((a, b) => b.ingresos - a.ingresos)
        .slice(0, 5);

    res.json({
        exito: true,
        estadisticas: {
            totalMaquinas: estadisticas.maquinas.size,
            maquinasActivas: estadisticas.maquinas.size,
            maquinasInactivas: 0,
            pulsosHoy: pulsosHoy.length,
            ingresosHoy: pulsosHoy.reduce((sum, p) => sum + p.valor, 0),
            totalIngresos: estadisticas.totalIngresos,
            topMaquinas,
            ingresosPorHora: []
        }
    });
});

// Obtener todos los pulsos
app.get('/api/pulsos', (req, res) => {
    res.json({
        exito: true,
        pulsos: pulsos.slice(-50), // Últimos 50 pulsos
        total: pulsos.length
    });
});

// Limpiar datos (para pruebas)
app.delete('/api/pulsos/reset', (req, res) => {
    pulsos = [];
    estadisticas = {
        totalPulsos: 0,
        totalIngresos: 0,
        maquinas: new Set()
    };
    
    console.log('🔄 Datos reiniciados');
    res.json({
        mensaje: 'Datos reiniciados correctamente',
        timestamp: new Date().toISOString()
    });
});

// Servir simulador
app.get('/simulador', (req, res) => {
    res.sendFile(path.join(__dirname, 'simulador-maquina.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor Simple ejecutándose en puerto ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`🎮 Simulador: http://localhost:${PORT}/simulador`);
    console.log(`🔍 Estado: http://localhost:${PORT}/api/status`);
    console.log(`\n💡 Este servidor funciona SIN MongoDB para pruebas rápidas`);
});

module.exports = app;
