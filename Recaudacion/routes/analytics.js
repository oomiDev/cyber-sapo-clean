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
        const filtroMaquina = region ? { 'ubicacion.region': region } : {};
        const filtroFecha = {};
        if (fechaInicio) filtroFecha.$gte = new Date(`${fechaInicio}T00:00:00.000Z`);
        if (fechaFin) filtroFecha.$lte = new Date(`${fechaFin}T23:59:59.999Z`);

        const maquinas = await Maquina.find(filtroMaquina).lean();
        const idsMaquinas = maquinas.map(m => m._id);

        const filtroPulsos = { maquina: { $in: idsMaquinas } };
        if (fechaInicio || fechaFin) filtroPulsos.fechaHora = filtroFecha;

        // --- 2. AGREGACIONES ---
        const [agregados, distribucionEstados] = await Promise.all([
            Pulso.aggregate([
                { $match: filtroPulsos },
                {
                    $facet: {
                        metricas: [
                            { $group: { _id: null, totalPulsos: { $sum: 1 }, totalIngresos: { $sum: '$valorPulso' }, maquinasActivas: { $addToSet: '$maquina' } } }
                        ],
                        tendencia: [
                            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$fechaHora' } }, ingresos: { $sum: '$valorPulso' } } },
                            { $sort: { _id: 1 } },
                            { $project: { _id: 0, fecha: '$_id', ingresos: 1 } }
                        ],
                        distribucionHoraria: [
                            { $group: { _id: { $hour: { date: '$fechaHora', timezone: 'Europe/Madrid' } }, pulsos: { $sum: 1 } } },
                            { $sort: { _id: 1 } },
                            { $project: { _id: 0, hora: '$_id', pulsos: 1 } }
                        ],
                        ingresosPorRegion: [
                            { $lookup: { from: 'maquinas', localField: 'maquina', foreignField: '_id', as: 'info' } },
                            { $unwind: '$info' },
                            { $group: { _id: '$info.ubicacion.region', ingresos: { $sum: '$valorPulso' } } },
                            { $project: { _id: 0, region: '$_id', ingresos: 1 } }
                        ],
                        topIngresos: [
                            { $group: { _id: '$codigoMaquina', totalIngresos: { $sum: '$valorPulso' } } },
                            { $sort: { totalIngresos: -1 } },
                            { $limit: 5 },
                            { $project: { _id: 0, codigo: '$_id', totalIngresos: 1 } }
                        ],
                        topPulsos: [
                            { $group: { _id: '$codigoMaquina', totalPulsos: { $sum: 1 } } },
                            { $sort: { totalPulsos: -1 } },
                            { $limit: 5 },
                            { $project: { _id: 0, codigo: '$_id', totalPulsos: 1 } }
                        ]
                    }
                }
            ]),
            Maquina.aggregate([
                { $match: filtroMaquina },
                { $group: { _id: '$estado.operativo', cantidad: { $sum: 1 } } },
                { $project: { _id: 0, estado: '$_id', cantidad: 1 } }
            ])
        ]);

        // --- 3. CONSTRUIR RESPUESTA ---
        const data = agregados[0] || {};
        const metricasBase = data.metricas?.[0] || { totalPulsos: 0, totalIngresos: 0, maquinasActivas: [] };

        res.json({
            metricas: {
                pulsos: metricasBase.totalPulsos,
                ingresos: metricasBase.totalIngresos,
                maquinasActivas: metricasBase.maquinasActivas.length,
                totalMaquinas: maquinas.length,
                ingresoPromedio: metricasBase.maquinasActivas.length > 0 ? metricasBase.totalIngresos / metricasBase.maquinasActivas.length : 0,
            },
            graficas: {
                tendencia: data.tendencia || [],
                distribucionHoraria: data.distribucionHoraria || [],
                ingresosPorRegion: data.ingresosPorRegion || [],
            },
            maquinas: {
                total: maquinas.length,
                distribucion: distribucionEstados || [],
            },
            topMaquinas: {
                porIngresos: data.topIngresos || [],
                porPulsos: data.topPulsos || [],
            },
        });

    } catch (error) {
        console.error('Error en GET /dashboard:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
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
