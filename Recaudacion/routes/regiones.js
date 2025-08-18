const express = require('express');
const router = express.Router();
const Region = require('../models/Region');

/**
 * RUTAS PARA GESTIÓN DE REGIONES
 * 
 * Endpoints para crear, leer, actualizar y eliminar regiones
 * personalizadas del sistema de recaudación.
 */

// ==================== OBTENER TODAS LAS REGIONES ====================

/**
 * GET /api/regiones
 * Obtiene lista de regiones con filtros opcionales
 */
router.get('/', async (req, res) => {
    try {
        const { activa, buscar, orden } = req.query;
        
        // Construir filtros
        let filtros = {};
        
        if (activa !== undefined) {
            filtros.activa = activa === 'true';
        }
        
        if (buscar) {
            filtros.$or = [
                { nombre: { $regex: buscar, $options: 'i' } },
                { codigoRegion: { $regex: buscar, $options: 'i' } },
                { descripcion: { $regex: buscar, $options: 'i' } }
            ];
        }

        // Configurar ordenamiento
        let ordenamiento = { orden: 1, nombre: 1 };
        if (orden === 'nombre') ordenamiento = { nombre: 1 };
        if (orden === 'codigo') ordenamiento = { codigoRegion: 1 };
        if (orden === 'maquinas') ordenamiento = { 'estadisticas.totalMaquinas': -1 };
        if (orden === 'ingresos') ordenamiento = { 'estadisticas.totalIngresos': -1 };

        const regiones = await Region.find(filtros)
                                   .sort(ordenamiento)
                                   .select('-__v');

        res.json({
            exito: true,
            total: regiones.length,
            regiones
        });

    } catch (error) {
        console.error('Error obteniendo regiones:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            mensaje: error.message
        });
    }
});

// ==================== OBTENER REGIÓN ESPECÍFICA ====================

/**
 * GET /api/regiones/:codigo
 * Obtiene detalles de una región específica
 */
router.get('/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        
        const region = await Region.findOne({ codigoRegion: codigo.toUpperCase() });
        
        if (!region) {
            return res.status(404).json({
                error: 'Región no encontrada',
                mensaje: `No existe una región con código: ${codigo}`
            });
        }

        // Actualizar estadísticas antes de devolver
        await region.actualizarEstadisticas();

        res.json({
            exito: true,
            region
        });

    } catch (error) {
        console.error('Error obteniendo región:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            mensaje: error.message
        });
    }
});

// ==================== CREAR NUEVA REGIÓN ====================

/**
 * POST /api/regiones
 * Crea una nueva región
 */
router.post('/', async (req, res) => {
    try {
        const {
            codigoRegion,
            nombre,
            descripcion,
            color,
            icono,
            orden,
            notas,
            creadoPor
        } = req.body;

        // Validaciones básicas
        if (!codigoRegion || !nombre) {
            return res.status(400).json({
                error: 'Datos incompletos',
                mensaje: 'El código y nombre de la región son obligatorios'
            });
        }

        // Verificar si ya existe
        const regionExistente = await Region.findOne({ 
            codigoRegion: codigoRegion.toUpperCase() 
        });
        
        if (regionExistente) {
            return res.status(409).json({
                error: 'Región ya existe',
                mensaje: `Ya existe una región con código: ${codigoRegion}`
            });
        }

        // Crear nueva región
        const nuevaRegion = new Region({
            codigoRegion: codigoRegion.toUpperCase(),
            nombre,
            descripcion,
            color: color || '#2563eb',
            icono: icono || 'fas fa-map-marker-alt',
            orden: orden || 0,
            notas,
            creadoPor: creadoPor || 'Admin'
        });

        const regionGuardada = await nuevaRegion.save();

        res.status(201).json({
            exito: true,
            mensaje: 'Región creada exitosamente',
            region: regionGuardada
        });

    } catch (error) {
        console.error('Error creando región:', error);
        
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                error: 'Errores de validación',
                errores
            });
        }

        res.status(500).json({
            error: 'Error interno del servidor',
            mensaje: error.message
        });
    }
});

// ==================== ACTUALIZAR REGIÓN ====================

/**
 * PUT /api/regiones/:codigo
 * Actualiza una región existente
 */
router.put('/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const actualizaciones = req.body;

        // No permitir cambiar el código de región
        delete actualizaciones.codigoRegion;
        delete actualizaciones.estadisticas;

        const region = await Region.findOneAndUpdate(
            { codigoRegion: codigo.toUpperCase() },
            actualizaciones,
            { new: true, runValidators: true }
        );

        if (!region) {
            return res.status(404).json({
                error: 'Región no encontrada',
                mensaje: `No existe una región con código: ${codigo}`
            });
        }

        res.json({
            exito: true,
            mensaje: 'Región actualizada exitosamente',
            region
        });

    } catch (error) {
        console.error('Error actualizando región:', error);
        
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                error: 'Errores de validación',
                errores
            });
        }

        res.status(500).json({
            error: 'Error interno del servidor',
            mensaje: error.message
        });
    }
});

// ==================== ACTIVAR/DESACTIVAR REGIÓN ====================

/**
 * PUT /api/regiones/:codigo/estado
 * Cambia el estado activo/inactivo de una región
 */
router.put('/:codigo/estado', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { activa } = req.body;

        if (typeof activa !== 'boolean') {
            return res.status(400).json({
                error: 'Estado inválido',
                mensaje: 'El campo activa debe ser true o false'
            });
        }

        const region = await Region.findOneAndUpdate(
            { codigoRegion: codigo.toUpperCase() },
            { activa },
            { new: true }
        );

        if (!region) {
            return res.status(404).json({
                error: 'Región no encontrada',
                mensaje: `No existe una región con código: ${codigo}`
            });
        }

        res.json({
            exito: true,
            mensaje: `Región ${activa ? 'activada' : 'desactivada'} exitosamente`,
            region
        });

    } catch (error) {
        console.error('Error cambiando estado de región:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            mensaje: error.message
        });
    }
});

// ==================== ELIMINAR REGIÓN ====================

/**
 * DELETE /api/regiones/:codigo
 * Elimina una región (solo si no tiene locales o máquinas asociadas)
 */
router.delete('/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        
        const region = await Region.findOne({ codigoRegion: codigo.toUpperCase() });
        
        if (!region) {
            return res.status(404).json({
                error: 'Región no encontrada',
                mensaje: `No existe una región con código: ${codigo}`
            });
        }

        // Verificar si se puede eliminar
        const validacion = await region.puedeEliminar();
        
        if (!validacion.puedeEliminar) {
            return res.status(409).json({
                error: 'No se puede eliminar',
                mensaje: validacion.razon
            });
        }

        await Region.deleteOne({ codigoRegion: codigo.toUpperCase() });

        res.json({
            exito: true,
            mensaje: 'Región eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando región:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            mensaje: error.message
        });
    }
});

// ==================== ACTUALIZAR ESTADÍSTICAS ====================

/**
 * POST /api/regiones/:codigo/actualizar-estadisticas
 * Actualiza las estadísticas de una región específica
 */
router.post('/:codigo/actualizar-estadisticas', async (req, res) => {
    try {
        const { codigo } = req.params;
        
        const region = await Region.findOne({ codigoRegion: codigo.toUpperCase() });
        
        if (!region) {
            return res.status(404).json({
                error: 'Región no encontrada',
                mensaje: `No existe una región con código: ${codigo}`
            });
        }

        const estadisticas = await region.actualizarEstadisticas();

        res.json({
            exito: true,
            mensaje: 'Estadísticas actualizadas exitosamente',
            estadisticas
        });

    } catch (error) {
        console.error('Error actualizando estadísticas:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            mensaje: error.message
        });
    }
});

// ==================== OBTENER REGIONES PARA SELECT ====================

/**
 * GET /api/regiones/select/opciones
 * Obtiene regiones activas formateadas para elementos select
 */
router.get('/select/opciones', async (req, res) => {
    try {
        const regiones = await Region.obtenerRegionesActivas();
        
        const opciones = regiones.map(region => ({
            value: region.codigoRegion,
            text: region.nombre,
            color: region.color,
            icono: region.icono
        }));

        res.json({
            exito: true,
            opciones
        });

    } catch (error) {
        console.error('Error obteniendo opciones de regiones:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            mensaje: error.message
        });
    }
});

// ==================== ESTADÍSTICAS GENERALES ====================

/**
 * GET /api/regiones/estadisticas/generales
 * Obtiene estadísticas generales de todas las regiones
 */
router.get('/estadisticas/generales', async (req, res) => {
    try {
        const estadisticas = await Region.obtenerEstadisticasGenerales();

        res.json({
            exito: true,
            estadisticas: estadisticas[0] || {
                totalRegiones: 0,
                totalLocales: 0,
                totalMaquinas: 0,
                maquinasActivas: 0,
                totalIngresos: 0
            }
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas generales:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            mensaje: error.message
        });
    }
});

module.exports = router;
