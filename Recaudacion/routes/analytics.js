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

        // Construir filtro de fecha
        let filtroFecha = {};
        if (fechaInicio && fechaFin) {
            const inicio = new Date(fechaInicio);
            const fin = new Date(fechaFin);
            inicio.setHours(0, 0, 0, 0);
            fin.setHours(23, 59, 59, 999);
            filtroFecha = { timestamp: { $gte: inicio, $lte: fin } };
        } else {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const mañana = new Date(hoy);
            mañana.setDate(mañana.getDate() + 1);
            filtroFecha = { timestamp: { $gte: hoy, $lt: mañana } };
        }

        // Construir filtro de máquina por región
        let filtroMaquina = { eliminado: { $ne: true } };
        let filtroPulsoMaquina = {};
        if (region) {
            filtroMaquina.region = region;
            const maquinasEnRegion = await Maquina.find(filtroMaquina).select('codigoMaquina');
            const codigosMaquina = maquinasEnRegion.map(m => m.codigoMaquina);
            filtroPulsoMaquina = { codigoMaquina: { $in: codigosMaquina } };
        }

        // Combinar filtros para pulsos
        const filtroPulsos = { ...filtroFecha, ...filtroPulsoMaquina };

        // Métricas principales
        const [totalMaquinas, maquinasActivas, pulsosPeriodo, ingresosPeriodo, totalIngresos] = await Promise.all([
            Maquina.countDocuments(filtroMaquina),
            Maquina.countDocuments({ ...filtroMaquina, estado: 'Activa' }),
            Pulso.countDocuments(filtroPulsos),
            Pulso.aggregate([{ $match: filtroPulsos }, { $group: { _id: null, total: { $sum: '$valor' } } }]),
            Pulso.aggregate([{ $group: { _id: null, total: { $sum: '$valor' } } }]) // Total histórico no se filtra
        ]);

        // Gráficas y tablas
        const [topMaquinas, ingresosPorHora, estadoMaquinas] = await Promise.all([
            Pulso.aggregate([
                { $match: filtroPulsos },
                { $group: { _id: '$codigoMaquina', pulsos: { $sum: 1 }, ingresos: { $sum: '$valor' } } },
                { $sort: { ingresos: -1 } },
                { $limit: 5 }
            ]),
            Pulso.aggregate([
                { $match: filtroPulsos },
                { $group: { _id: { $hour: '$timestamp' }, ingresos: { $sum: '$valor' }, pulsos: { $sum: 1 } } },
                { $sort: { '_id': 1 } }
            ]),
            Maquina.find(filtroMaquina).populate('local').sort({ ultimaActividad: -1 })
        ]);

        res.json({
            metricas: {
                totalMaquinas,
                maquinasActivas,
                maquinasInactivas: totalMaquinas - maquinasActivas,
                pulsosPeriodo,
                ingresosPeriodo: ingresosPeriodo[0]?.total || 0,
                totalIngresos: totalIngresos[0]?.total || 0
            },
            graficas: {
                topMaquinas,
                ingresosPorHora
            },
            maquinas: estadoMaquinas
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas del dashboard:', error);
        res.status(500).json({ error: 'Error interno del servidor', mensaje: error.message });
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
