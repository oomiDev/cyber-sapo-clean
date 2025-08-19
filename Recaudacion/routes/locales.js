/**
 * RUTAS PARA GESTIÓN DE LOCALES/ESTABLECIMIENTOS
 * 
 * Este archivo maneja todas las operaciones CRUD para los locales
 * donde se ubican las máquinas expendedoras.
 */

const express = require('express');
const router = express.Router();
const Local = require('../models/Local');
const Maquina = require('../models/Maquina');

/**
 * GET /api/locales
 * OBTENER LISTA DE TODOS LOS LOCALES CON FILTROS
 */
router.get('/', async (req, res) => {
    try {
        const { 
            region, 
            ciudad, 
            tipo,
            activo = true,
            limite = 50,
            pagina = 1,
            ordenar = 'fechaCreacion',
            direccion = 'desc'
        } = req.query;

        // Construir filtros dinámicamente
        const filtros = { activo: activo === 'true' };
        
        if (region) filtros['ubicacion.region'] = region;
        if (ciudad) filtros['ubicacion.ciudad'] = new RegExp(ciudad, 'i');
        if (tipo) filtros.tipoEstablecimiento = tipo;

        // Configurar ordenamiento
        const ordenamiento = {};
        ordenamiento[ordenar] = direccion === 'desc' ? -1 : 1;

        // Calcular paginación
        const skip = (parseInt(pagina) - 1) * parseInt(limite);

        // Ejecutar consulta
        const locales = await Local.find(filtros)
            .populate('tipoEstablecimiento', 'nombre icono') // Poblar el tipo de establecimiento
            .populate('ubicacion.region', 'nombre') // Poblar el nombre de la región
            .sort(ordenamiento)
            .limit(parseInt(limite))
            .skip(skip)
            .select('-__v');

        // Contar total para paginación
        const total = await Local.countDocuments(filtros);

        res.json({
            locales,
            paginacion: {
                paginaActual: parseInt(pagina),
                totalPaginas: Math.ceil(total / parseInt(limite)),
                totalRegistros: total,
                registrosPorPagina: parseInt(limite)
            },
            filtrosAplicados: filtros
        });

    } catch (error) {
        console.error('❌ Error obteniendo locales:', error);
        res.status(500).json({
            error: 'Error obteniendo lista de locales',
            mensaje: error.message
        });
    }
});

/**
 * GET /api/locales/:codigo
 * OBTENER DETALLES DE UN LOCAL ESPECÍFICO
 */
router.get('/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        
        const local = await Local.findOne({ 
            codigoLocal: codigo.toUpperCase(),
            activo: true 
        }).populate('tipoEstablecimiento', 'nombre descripcion icono');

        if (!local) {
            return res.status(404).json({
                error: 'Local no encontrado',
                mensaje: `No existe un local con código ${codigo}`
            });
        }

        // Obtener máquinas asociadas a este local
        const maquinasDelLocal = await Maquina.find({
            'ubicacion.direccion': local.ubicacion.direccion,
            'ubicacion.ciudad': local.ubicacion.ciudad,
            activa: true
        }).select('codigoMaquina nombre estado estadisticas');

        res.json({
            local,
            maquinasAsociadas: maquinasDelLocal,
            resumen: {
                totalMaquinas: maquinasDelLocal.length,
                maquinasActivas: maquinasDelLocal.filter(m => m.estado.operativo === 'Activa').length,
                ingresosTotales: maquinasDelLocal.reduce((sum, m) => sum + m.estadisticas.totalIngresos, 0)
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo local:', error);
        res.status(500).json({
            error: 'Error obteniendo detalles del local'
        });
    }
});

/**
 * POST /api/locales
 * REGISTRAR UN NUEVO LOCAL
 */
router.post('/', async (req, res) => {
    try {
        const {
            codigoLocal,
            nombre,
            descripcion,
            tipoEstablecimiento,
            ubicacion,
            contacto,
            caracteristicas,
            configuracion,
            notas
        } = req.body;

        // Validaciones básicas
        if (!codigoLocal || !nombre || !tipoEstablecimiento || !ubicacion) {
            return res.status(400).json({
                error: 'Datos incompletos',
                mensaje: 'codigoLocal, nombre, tipoEstablecimiento y ubicacion son obligatorios'
            });
        }

        // Buscar el ObjectId de la región a partir del código de región
        const RegionModel = require('../models/Region');
        const regionObj = await RegionModel.findOne({ codigoRegion: ubicacion.region });
        if (!regionObj) {
            return res.status(400).json({
                error: 'Región no válida',
                mensaje: `La región con código '${ubicacion.region}' no existe.`
            });
        }

        // Verificar que no exista un local con el mismo código
        const localExistente = await Local.findOne({ 
            codigoLocal: codigoLocal.toUpperCase() 
        });

        if (localExistente) {
            return res.status(409).json({
                error: 'Código duplicado',
                mensaje: `Ya existe un local con código ${codigoLocal}`
            });
        }

        // Crear nuevo local
        const nuevoLocal = new Local({
            codigoLocal: codigoLocal.toUpperCase(),
            nombre,
            descripcion,
            tipoEstablecimiento,
            ubicacion: {
                region: regionObj._id,
                ciudad: ubicacion.ciudad,
                direccion: ubicacion.direccion,
                codigoPostal: ubicacion.codigoPostal,
                coordenadas: ubicacion.coordenadas,
                piso: ubicacion.piso,
                zona: ubicacion.zona
            },
            contacto: contacto || {},
            caracteristicas: caracteristicas || {},
            configuracion: configuracion || {},
            notas
        });

        await nuevoLocal.save();

        res.status(201).json({
            mensaje: 'Local registrado exitosamente',
            local: nuevoLocal
        });

        console.log(`✅ Nuevo local registrado: ${nuevoLocal.codigoLocal} - ${nuevoLocal.nombre}`);

    } catch (error) {
        console.error('❌ Error registrando local:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Datos inválidos',
                detalles: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({
            error: 'Error interno del servidor',
            mensaje: 'No se pudo registrar el local'
        });
    }
});

/**
 * PUT /api/locales/:codigo
 * ACTUALIZAR INFORMACIÓN DE UN LOCAL
 */
router.put('/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const actualizaciones = req.body;

        // Si se está actualizando la región, convertir el código de región a ObjectId
        if (actualizaciones.ubicacion && actualizaciones.ubicacion.region) {
            const RegionModel = require('../models/Region');
            const regionObj = await RegionModel.findOne({ codigoRegion: actualizaciones.ubicacion.region });
            if (!regionObj) {
                return res.status(400).json({
                    error: 'Región no válida',
                    mensaje: `La región con código '${actualizaciones.ubicacion.region}' no existe.`
                });
            }
            actualizaciones.ubicacion.region = regionObj._id;
        }

        // No permitir actualizar el código del local
        delete actualizaciones.codigoLocal;
        delete actualizaciones._id;

        const local = await Local.findOneAndUpdate(
            { codigoLocal: codigo.toUpperCase(), activo: true },
            { 
                ...actualizaciones,
                fechaActualizacion: new Date()
            },
            { 
                new: true, 
                runValidators: true 
            }
        ).populate('tipoEstablecimiento', 'nombre icono');

        if (!local) {
            return res.status(404).json({
                error: 'Local no encontrado',
                mensaje: `No se encontró local con código ${codigo}`
            });
        }

        res.json({
            mensaje: 'Local actualizado exitosamente',
            local
        });

        console.log(`✅ Local actualizado: ${local.codigoLocal}`);

    } catch (error) {
        console.error('❌ Error actualizando local:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Datos inválidos',
                detalles: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({
            error: 'Error actualizando local'
        });
    }
});

/**
 * DELETE /api/locales/:codigo
 * ELIMINAR UN LOCAL (SOFT DELETE)
 */
router.delete('/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        
        const local = await Local.findOne({ 
            codigoLocal: codigo.toUpperCase(),
            activo: true 
        });

        if (!local) {
            return res.status(404).json({
                error: 'Local no encontrado'
            });
        }

        // Verificar si hay máquinas activas en este local
        const maquinasActivas = await Maquina.countDocuments({
            'ubicacion.direccion': local.ubicacion.direccion,
            'ubicacion.ciudad': local.ubicacion.ciudad,
            activa: true,
            'estado.operativo': 'Activa'
        });

        if (maquinasActivas > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar el local',
                mensaje: `El local tiene ${maquinasActivas} máquinas activas. Desactive las máquinas primero.`
            });
        }

        // Soft delete
        local.activo = false;
        local.fechaActualizacion = new Date();
        await local.save();

        res.json({
            mensaje: 'Local eliminado correctamente',
            codigoLocal: codigo.toUpperCase()
        });

        console.log(`🗑️ Local eliminado: ${codigo.toUpperCase()}`);

    } catch (error) {
        console.error('❌ Error eliminando local:', error);
        res.status(500).json({
            error: 'Error eliminando local'
        });
    }
});

/**
 * GET /api/locales/estadisticas/resumen
 * OBTENER RESUMEN ESTADÍSTICO DE TODOS LOS LOCALES
 */
router.get('/estadisticas/resumen', async (req, res) => {
    try {
        // Estadísticas generales de locales
        const estadisticasGenerales = await Local.obtenerEstadisticasGenerales();
        
        // Distribución por tipo de establecimiento
        const distribucionTipo = await Local.aggregate([
            { $match: { activo: true } },
            {
                $group: {
                    _id: '$tipoEstablecimiento',
                    cantidad: { $sum: 1 },
                    totalMaquinas: { $sum: '$estadisticas.totalMaquinas' },
                    totalIngresos: { $sum: '$estadisticas.totalIngresos' }
                }
            },
            { $sort: { cantidad: -1 } }
        ]);

        // Distribución por región
        const distribucionRegion = await Local.aggregate([
            { $match: { activo: true } },
            {
                $group: {
                    _id: '$ubicacion.region',
                    cantidad: { $sum: 1 },
                    totalMaquinas: { $sum: '$estadisticas.totalMaquinas' },
                    totalIngresos: { $sum: '$estadisticas.totalIngresos' }
                }
            },
            { $sort: { cantidad: -1 } }
        ]);

        // Top 10 locales por ingresos
        const topLocales = await Local.find({ activo: true })
            .sort({ 'estadisticas.totalIngresos': -1 })
            .limit(10)
            .select('codigoLocal nombre tipoEstablecimiento ubicacion.region estadisticas');

        res.json({
            resumen: estadisticasGenerales[0] || {
                totalLocales: 0,
                totalMaquinas: 0,
                totalIngresos: 0,
                promedioMaquinasPorLocal: 0
            },
            distribucionPorTipo: distribucionTipo,
            distribucionPorRegion: distribucionRegion,
            topLocalesPorIngresos: topLocales,
            fechaConsulta: new Date()
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas de locales:', error);
        res.status(500).json({
            error: 'Error obteniendo estadísticas de locales'
        });
    }
});

/**
 * POST /api/locales/:codigo/actualizar-estadisticas
 * ACTUALIZAR ESTADÍSTICAS DE UN LOCAL ESPECÍFICO
 */
router.post('/:codigo/actualizar-estadisticas', async (req, res) => {
    try {
        const { codigo } = req.params;
        
        const local = await Local.findOne({ 
            codigoLocal: codigo.toUpperCase(),
            activo: true 
        });

        if (!local) {
            return res.status(404).json({
                error: 'Local no encontrado'
            });
        }

        await local.actualizarEstadisticas();

        res.json({
            mensaje: 'Estadísticas actualizadas correctamente',
            local: {
                codigoLocal: local.codigoLocal,
                nombre: local.nombre,
                estadisticas: local.estadisticas
            }
        });

        console.log(`📊 Estadísticas actualizadas: ${local.codigoLocal}`);

    } catch (error) {
        console.error('❌ Error actualizando estadísticas:', error);
        res.status(500).json({
            error: 'Error actualizando estadísticas del local'
        });
    }
});

/**
 * GET /api/locales/buscar/:termino
 * BUSCAR LOCALES POR NOMBRE
 */
router.get('/buscar/:termino', async (req, res) => {
    try {
        const { termino } = req.params;
        
        if (termino.length < 3) {
            return res.status(400).json({
                error: 'Término de búsqueda muy corto',
                mensaje: 'El término debe tener al menos 3 caracteres'
            });
        }

        const locales = await Local.buscarPorNombre(termino);
        
        res.json({
            termino,
            resultados: locales.length,
            locales
        });

    } catch (error) {
        console.error('❌ Error buscando locales:', error);
        res.status(500).json({
            error: 'Error en la búsqueda de locales'
        });
    }
});

module.exports = router;
