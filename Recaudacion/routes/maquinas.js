/**
 * RUTAS PARA GESTIÓN DE MÁQUINAS EXPENDEDORAS
 * 
 * Este archivo maneja todas las operaciones CRUD para las máquinas
 * incluyendo registro, actualización, consultas y gestión de estados.
 */

const express = require('express');
const router = express.Router();
const Maquina = require('../models/Maquina');
const Pulso = require('../models/Pulso');

/**
 * GET /api/maquinas
 * OBTENER LISTA DE TODAS LAS MÁQUINAS CON FILTROS
 */
router.get('/', async (req, res) => {
    try {
        const { 
            region, 
            ciudad, 
            estado, 
            activa = true,
            limite = 50,
            pagina = 1,
            ordenar = 'fechaCreacion',
            direccion = 'desc'
        } = req.query;

        // Construir filtros dinámicamente
        const filtros = { activa: activa === 'true' };
        
        if (region) filtros['ubicacion.region'] = region;
        if (ciudad) filtros['ubicacion.ciudad'] = new RegExp(ciudad, 'i');
        if (estado) filtros['estado.operativo'] = estado;

        // Configurar ordenamiento
        const ordenamiento = {};
        ordenamiento[ordenar] = direccion === 'desc' ? -1 : 1;

        // Calcular paginación
        const skip = (parseInt(pagina) - 1) * parseInt(limite);

        // Ejecutar consulta
        const maquinas = await Maquina.find(filtros)
            .sort(ordenamiento)
            .limit(parseInt(limite))
            .skip(skip)
            .select('-__v');

        // Contar total para paginación
        const total = await Maquina.countDocuments(filtros);

        res.json({
            maquinas,
            paginacion: {
                paginaActual: parseInt(pagina),
                totalPaginas: Math.ceil(total / parseInt(limite)),
                totalRegistros: total,
                registrosPorPagina: parseInt(limite)
            },
            filtrosAplicados: filtros
        });

    } catch (error) {
        console.error('❌ Error obteniendo máquinas:', error);
        res.status(500).json({
            error: 'Error obteniendo lista de máquinas',
            mensaje: error.message
        });
    }
});

/**
 * GET /api/maquinas/:codigo
 * OBTENER DETALLES DE UNA MÁQUINA ESPECÍFICA
 */
router.get('/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        
        const maquina = await Maquina.findOne({ 
            codigoMaquina: codigo.toUpperCase(),
            activa: true 
        });

        if (!maquina) {
            return res.status(404).json({
                error: 'Máquina no encontrada',
                mensaje: `No existe una máquina con código ${codigo}`
            });
        }

        // Obtener estadísticas adicionales de los últimos 30 días
        const hace30Dias = new Date();
        hace30Dias.setDate(hace30Dias.getDate() - 30);

        const estadisticas30Dias = await Pulso.aggregate([
            {
                $match: {
                    codigoMaquina: codigo.toUpperCase(),
                    fechaHora: { $gte: hace30Dias },
                    activo: true
                }
            },
            {
                $group: {
                    _id: null,
                    totalPulsos: { $sum: 1 },
                    totalIngresos: { $sum: '$valorPulso' },
                    promedioIngresos: { $avg: '$valorPulso' }
                }
            }
        ]);

        res.json({
            maquina,
            estadisticasUltimos30Dias: estadisticas30Dias[0] || {
                totalPulsos: 0,
                totalIngresos: 0,
                promedioIngresos: 0
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo máquina:', error);
        res.status(500).json({
            error: 'Error obteniendo detalles de la máquina'
        });
    }
});

/**
 * POST /api/maquinas
 * REGISTRAR UNA NUEVA MÁQUINA
 */
router.post('/', async (req, res) => {
    try {
        const {
            codigoMaquina,
            nombre,
            descripcion,
            ubicacion,
            configuracion,
            responsable
        } = req.body;

        // Validaciones básicas
        if (!codigoMaquina || !nombre || !ubicacion) {
            return res.status(400).json({
                error: 'Datos incompletos',
                mensaje: 'codigoMaquina, nombre y ubicacion son obligatorios'
            });
        }

        // Verificar que no exista una máquina con el mismo código
        const maquinaExistente = await Maquina.findOne({ 
            codigoMaquina: codigoMaquina.toUpperCase() 
        });

        if (maquinaExistente) {
            return res.status(409).json({
                error: 'Código duplicado',
                mensaje: `Ya existe una máquina con código ${codigoMaquina}`
            });
        }

        // Crear nueva máquina
        const nuevaMaquina = new Maquina({
            codigoMaquina: codigoMaquina.toUpperCase(),
            nombre,
            descripcion,
            ubicacion: {
                region: ubicacion.region,
                ciudad: ubicacion.ciudad,
                direccion: ubicacion.direccion,
                coordenadas: ubicacion.coordenadas,
                tipoEstablecimiento: ubicacion.tipoEstablecimiento || 'Otro'
            },
            configuracion: {
                valorPorPulso: configuracion?.valorPorPulso || 1.00,
                moneda: configuracion?.moneda || 'EUR',
                capacidadMaxima: configuracion?.capacidadMaxima || 1000,
                intervaloReporte: configuracion?.intervaloReporte || 60
            },
            responsable: responsable || {}
        });

        await nuevaMaquina.save();

        res.status(201).json({
            mensaje: 'Máquina registrada exitosamente',
            maquina: nuevaMaquina
        });

        console.log(`✅ Nueva máquina registrada: ${nuevaMaquina.codigoMaquina} - ${nuevaMaquina.nombre}`);

    } catch (error) {
        console.error('❌ Error registrando máquina:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Datos inválidos',
                detalles: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({
            error: 'Error interno del servidor',
            mensaje: 'No se pudo registrar la máquina'
        });
    }
});

/**
 * PUT /api/maquinas/:codigo
 * ACTUALIZAR INFORMACIÓN DE UNA MÁQUINA
 */
router.put('/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const actualizaciones = req.body;

        // No permitir actualizar el código de máquina
        delete actualizaciones.codigoMaquina;
        delete actualizaciones._id;

        const maquina = await Maquina.findOneAndUpdate(
            { codigoMaquina: codigo.toUpperCase(), activa: true },
            { 
                ...actualizaciones,
                fechaActualizacion: new Date()
            },
            { 
                new: true, 
                runValidators: true 
            }
        );

        if (!maquina) {
            return res.status(404).json({
                error: 'Máquina no encontrada',
                mensaje: `No se encontró máquina con código ${codigo}`
            });
        }

        res.json({
            mensaje: 'Máquina actualizada exitosamente',
            maquina
        });

        console.log(`✅ Máquina actualizada: ${maquina.codigoMaquina}`);

    } catch (error) {
        console.error('❌ Error actualizando máquina:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Datos inválidos',
                detalles: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({
            error: 'Error actualizando máquina'
        });
    }
});

/**
 * PATCH /api/maquinas/:codigo/estado
 * CAMBIAR ESTADO OPERATIVO DE UNA MÁQUINA
 */
router.patch('/:codigo/estado', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { estado } = req.body;

        const estadosValidos = ['Activa', 'Inactiva', 'Mantenimiento', 'Averiada'];
        
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                error: 'Estado inválido',
                mensaje: `El estado debe ser uno de: ${estadosValidos.join(', ')}`
            });
        }

        const maquina = await Maquina.findOne({ 
            codigoMaquina: codigo.toUpperCase(),
            activa: true 
        });

        if (!maquina) {
            return res.status(404).json({
                error: 'Máquina no encontrada'
            });
        }

        await maquina.cambiarEstado(estado);

        res.json({
            mensaje: `Estado de máquina cambiado a ${estado}`,
            maquina: {
                codigoMaquina: maquina.codigoMaquina,
                nombre: maquina.nombre,
                estadoAnterior: maquina.estado.operativo,
                estadoNuevo: estado
            }
        });

        console.log(`🔄 Estado cambiado: ${maquina.codigoMaquina} -> ${estado}`);

    } catch (error) {
        console.error('❌ Error cambiando estado:', error);
        res.status(500).json({
            error: 'Error cambiando estado de máquina'
        });
    }
});

/**
 * GET /api/maquinas/estadisticas/resumen
 * OBTENER RESUMEN ESTADÍSTICO DE TODAS LAS MÁQUINAS
 */
router.get('/estadisticas/resumen', async (req, res) => {
    try {
        // Estadísticas generales de máquinas
        const estadisticasGenerales = await Maquina.obtenerEstadisticasGenerales();
        
        // Distribución por región
        const distribucionRegion = await Maquina.aggregate([
            { $match: { activa: true } },
            {
                $group: {
                    _id: '$ubicacion.region',
                    cantidad: { $sum: 1 },
                    totalIngresos: { $sum: '$estadisticas.totalIngresos' },
                    promedioIngresos: { $avg: '$estadisticas.totalIngresos' }
                }
            },
            { $sort: { cantidad: -1 } }
        ]);

        // Distribución por estado operativo
        const distribucionEstado = await Maquina.aggregate([
            { $match: { activa: true } },
            {
                $group: {
                    _id: '$estado.operativo',
                    cantidad: { $sum: 1 }
                }
            }
        ]);

        // Top 10 máquinas por ingresos
        const topMaquinas = await Maquina.find({ activa: true })
            .sort({ 'estadisticas.totalIngresos': -1 })
            .limit(10)
            .select('codigoMaquina nombre ubicacion.region estadisticas.totalIngresos estadisticas.totalPulsos');

        res.json({
            resumen: estadisticasGenerales[0] || {
                totalMaquinas: 0,
                totalIngresos: 0,
                totalPulsos: 0,
                promedioIngresosPorMaquina: 0
            },
            distribucionPorRegion: distribucionRegion,
            distribucionPorEstado: distribucionEstado,
            topMaquinasPorIngresos: topMaquinas,
            fechaConsulta: new Date()
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({
            error: 'Error obteniendo estadísticas de máquinas'
        });
    }
});

/**
 * DELETE /api/maquinas/:codigo
 * ELIMINAR UNA MÁQUINA (SOFT DELETE)
 */
router.delete('/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        
        const maquina = await Maquina.findOne({ 
            codigoMaquina: codigo.toUpperCase(),
            activa: true 
        });

        if (!maquina) {
            return res.status(404).json({
                error: 'Máquina no encontrada'
            });
        }

        // Soft delete
        maquina.activa = false;
        maquina.fechaActualizacion = new Date();
        await maquina.save();

        res.json({
            mensaje: 'Máquina eliminada correctamente',
            codigoMaquina: codigo.toUpperCase()
        });

        console.log(`🗑️ Máquina eliminada: ${codigo.toUpperCase()}`);

    } catch (error) {
        console.error('❌ Error eliminando máquina:', error);
        res.status(500).json({
            error: 'Error eliminando máquina'
        });
    }
});

/**
 * GET /api/maquinas/region/:region
 * OBTENER MÁQUINAS POR REGIÓN ESPECÍFICA
 */
router.get('/region/:region', async (req, res) => {
    try {
        const { region } = req.params;
        
        const maquinas = await Maquina.obtenerPorRegion(region);
        
        if (maquinas.length === 0) {
            return res.status(404).json({
                mensaje: `No se encontraron máquinas en la región ${region}`,
                region,
                cantidad: 0
            });
        }

        // Calcular estadísticas de la región
        const estadisticasRegion = maquinas.reduce((acc, maquina) => {
            acc.totalIngresos += maquina.estadisticas.totalIngresos;
            acc.totalPulsos += maquina.estadisticas.totalPulsos;
            return acc;
        }, { totalIngresos: 0, totalPulsos: 0 });

        res.json({
            region,
            cantidad: maquinas.length,
            maquinas,
            estadisticas: {
                ...estadisticasRegion,
                promedioIngresosPorMaquina: estadisticasRegion.totalIngresos / maquinas.length
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo máquinas por región:', error);
        res.status(500).json({
            error: 'Error obteniendo máquinas por región'
        });
    }
});

module.exports = router;
