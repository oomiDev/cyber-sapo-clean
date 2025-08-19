const express = require('express');
const router = express.Router();
const Pulso = require('../models/Pulso');
const Maquina = require('../models/Maquina');

/**
 * RUTAS DE ANALYTICS Y ESTADÍSTICAS
 * 
 * Endpoints para obtener datos estadísticos y análisis
 * del sistema de recaudación de máquinas expendedoras.
 */

// ==================== ESTADÍSTICAS GENERALES ====================

/**
 * GET /api/analytics/dashboard
 * Obtiene estadísticas generales para el dashboard principal
 */
router.get('/dashboard', async (req, res) => {
    try {
        const { region, fechaInicio, fechaFin } = req.query;

        // --- 1. FILTROS --- 
        const filtroMaquina = region ? { region } : {};
        const filtroFecha = {};
        let fechaInicioObj, fechaFinObj;

        if (fechaInicio) {
            fechaInicioObj = new Date(fechaInicio);
            fechaInicioObj.setHours(0, 0, 0, 0);
            filtroFecha.$gte = fechaInicioObj;
        }
        if (fechaFin) {
            fechaFinObj = new Date(fechaFin);
            fechaFinObj.setHours(23, 59, 59, 999);
            filtroFecha.$lte = fechaFinObj;
        }

        // --- 2. OBTENER MÁQUINAS --- 
        const maquinas = await Maquina.find(filtroMaquina).lean();
        const idsMaquinas = maquinas.map(m => m._id);

        const filtroPulsos = { maquina: { $in: idsMaquinas } };
        if (fechaInicio || fechaFin) {
            filtroPulsos.fechaHora = filtroFecha;
        }

        // --- 3. AGREGACIONES DE PULSOS --- 
        const [pulsosAgregados, tendencia, distribucionHoraria, topMaquinas] = await Promise.all([
            // Métricas principales
            Pulso.aggregate([
                { $match: filtroPulsos },
                {
                    $group: {
                        _id: null,
                        totalPulsos: { $sum: 1 },
                        totalIngresos: { $sum: '$valorPulso' },
                        maquinasActivas: { $addToSet: '$maquina' }
                    }
                }
            ]),

            // Gráfica de tendencia
            Pulso.aggregate([
                { $match: filtroPulsos },
                { $group: { 
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$fechaHora' } },
                    pulsos: { $sum: 1 },
                    ingresos: { $sum: '$valorPulso' }
                }},
                { $sort: { _id: 1 } },
                { $project: { _id: 0, fecha: '$_id', pulsos: 1, ingresos: 1 } }
            ]),

            // Gráfica de distribución horaria
            Pulso.aggregate([
                { $match: filtroPulsos },
                { $group: { 
                    _id: { $hour: { date: '$fechaHora', timezone: 'Europe/Madrid' } }, 
                    pulsos: { $sum: 1 } 
                }},
                { $sort: { _id: 1 } },
                { $project: { _id: 0, hora: '$_id', pulsos: 1 } }
            ]),
            
            // Top 5 máquinas con más ingresos
            Pulso.aggregate([
                { $match: filtroPulsos },
                { $group: {
                    _id: '$maquina',
                    totalIngresos: { $sum: '$valorPulso' },
                    totalPulsos: { $sum: 1 },
                    ultimaActividad: { $max: '$fechaHora' }
                }},
                { $sort: { totalIngresos: -1 } },
                { $limit: 5 },
                { $lookup: {
                    from: 'maquinas',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'infoMaquina'
                }},
                { $unwind: '$infoMaquina' },
                { $project: {
                    _id: 0,
                    codigo: '$infoMaquina.codigoMaquina',
                    nombre: '$infoMaquina.nombre',
                    region: '$infoMaquina.region',
                    estado: '$infoMaquina.estado',
                    totalIngresos: 1,
                    totalPulsos: 1,
                    ultimaActividad: 1
                }}
            ])
        ]);

        // --- 4. MÉTRICAS DE MÁQUINAS ---
        const distribucionEstados = await Maquina.aggregate([
            { $match: filtroMaquina },
            { $group: { _id: '$estado', cantidad: { $sum: 1 } } },
            { $project: { _id: 0, estado: '$_id', cantidad: 1 } }
        ]);

        // --- 5. CONSTRUIR RESPUESTA --- 
        const metricas = pulsosAgregados[0] || { totalPulsos: 0, totalIngresos: 0, maquinasActivas: [] };

        res.json({
            metricas: {
                pulsos: metricas.totalPulsos,
                ingresos: metricas.totalIngresos,
                maquinasActivas: metricas.maquinasActivas.length,
                totalMaquinas: maquinas.length
            },
            graficas: {
                tendencia: tendencia,
                distribucionHoraria: distribucionHoraria,
            },
            maquinas: {
                total: maquinas.length,
                distribucion: distribucionEstados
            },
            topMaquinas: topMaquinas
        });

    } catch (error) {
        console.error('Error en GET /dashboard:', error);
        res.status(500).json({ error: 'Error interno del servidor al procesar los datos del dashboard.' });
    }
});

// ==================== ANÁLISIS POR PERÍODO ====================

/**
 * GET /api/analytics/periodo
 * Obtiene estadísticas por período específico
 */
router.get('/periodo', async (req, res) => {
    try {
        const { fechaInicio, fechaFin, agrupacion = 'dia' } = req.query;

        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({
                error: 'Parámetros faltantes',
                mensaje: 'Se requieren fechaInicio y fechaFin'
            });
        }

        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);

        let formatoAgrupacion;
        switch (agrupacion) {
            case 'hora':
                formatoAgrupacion = {
                    año: { $year: '$timestamp' },
                    mes: { $month: '$timestamp' },
                    dia: { $dayOfMonth: '$timestamp' },
                    hora: { $hour: '$timestamp' }
                };
                break;
            case 'mes':
                formatoAgrupacion = {
                    año: { $year: '$timestamp' },
                    mes: { $month: '$timestamp' }
                };
                break;
            default: // día
                formatoAgrupacion = {
                    año: { $year: '$timestamp' },
                    mes: { $month: '$timestamp' },
                    dia: { $dayOfMonth: '$timestamp' }
                };
        }

        const datos = await Pulso.aggregate([
            { $match: { timestamp: { $gte: inicio, $lte: fin } } },
            {
                $group: {
                    _id: formatoAgrupacion,
                    pulsos: { $sum: 1 },
                    ingresos: { $sum: '$valor' },
                    maquinasUnicas: { $addToSet: '$codigoMaquina' }
                }
            },
            {
                $addFields: {
                    totalMaquinas: { $size: '$maquinasUnicas' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        res.json({
            exito: true,
            periodo: { fechaInicio, fechaFin, agrupacion },
            datos
        });

    } catch (error) {
        console.error('Error obteniendo análisis por período:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            mensaje: error.message
        });
    }
});

// ==================== ANÁLISIS POR MÁQUINA ====================

/**
 * GET /api/analytics/maquina/:codigo
 * Obtiene estadísticas detalladas de una máquina específica
 */
router.get('/maquina/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { dias = 30 } = req.query;

        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - parseInt(dias));
        fechaInicio.setHours(0, 0, 0, 0);

        // Estadísticas generales de la máquina
        const [estadisticasGenerales, datosPorDia] = await Promise.all([
            Pulso.aggregate([
                { $match: { codigoMaquina: codigo, timestamp: { $gte: fechaInicio } } },
                {
                    $group: {
                        _id: null,
                        totalPulsos: { $sum: 1 },
                        totalIngresos: { $sum: '$valor' },
                        valorPromedio: { $avg: '$valor' },
                        primerPulso: { $min: '$timestamp' },
                        ultimoPulso: { $max: '$timestamp' }
                    }
                }
            ]),
            Pulso.aggregate([
                { $match: { codigoMaquina: codigo, timestamp: { $gte: fechaInicio } } },
                {
                    $group: {
                        _id: {
                            año: { $year: '$timestamp' },
                            mes: { $month: '$timestamp' },
                            dia: { $dayOfMonth: '$timestamp' }
                        },
                        pulsos: { $sum: 1 },
                        ingresos: { $sum: '$valor' }
                    }
                },
                { $sort: { '_id': 1 } }
            ])
        ]);

        // Información de la máquina
        const maquina = await Maquina.findOne({ codigoMaquina: codigo });

        res.json({
            exito: true,
            maquina: maquina || { codigoMaquina: codigo },
            periodo: `${dias} días`,
            estadisticas: estadisticasGenerales[0] || {
                totalPulsos: 0,
                totalIngresos: 0,
                valorPromedio: 0
            },
            datosPorDia
        });

    } catch (error) {
        console.error('Error obteniendo análisis de máquina:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            mensaje: error.message
        });
    }
});

// ==================== COMPARATIVAS ====================

/**
 * GET /api/analytics/comparativa
 * Compara rendimiento entre máquinas o períodos
 */
router.get('/comparativa', async (req, res) => {
    try {
        const { tipo = 'maquinas', fechaInicio, fechaFin } = req.query;

        const inicio = fechaInicio ? new Date(fechaInicio) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const fin = fechaFin ? new Date(fechaFin) : new Date();
        fin.setHours(23, 59, 59, 999);

        if (tipo === 'maquinas') {
            // Comparativa entre máquinas
            const comparativa = await Pulso.aggregate([
                { $match: { timestamp: { $gte: inicio, $lte: fin } } },
                {
                    $group: {
                        _id: '$codigoMaquina',
                        pulsos: { $sum: 1 },
                        ingresos: { $sum: '$valor' },
                        valorPromedio: { $avg: '$valor' },
                        ultimaActividad: { $max: '$timestamp' }
                    }
                },
                { $sort: { ingresos: -1 } }
            ]);

            res.json({
                exito: true,
                tipo: 'maquinas',
                periodo: { fechaInicio: inicio, fechaFin: fin },
                comparativa
            });

        } else {
            res.status(400).json({
                error: 'Tipo de comparativa no válido',
                mensaje: 'Tipos disponibles: maquinas'
            });
        }

    } catch (error) {
        console.error('Error obteniendo comparativa:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            mensaje: error.message
        });
    }
});

module.exports = router;
