/**
 * RUTAS PARA RECEPCIÓN Y GESTIÓN DE PULSOS
 * 
 * Este archivo maneja todas las rutas relacionadas con la recepción
 * de pulsos de las máquinas expendedoras y su procesamiento.
 */

const express = require('express');
const router = express.Router();
const Maquina = require('../models/Maquina');
const Pulso = require('../models/Pulso');

/**
 * POST /api/pulsos/recibir
 * ENDPOINT PRINCIPAL PARA RECIBIR PULSOS DE LAS MÁQUINAS
 * 
 * Este endpoint recibe los pulsos de la tecla "M" de cada máquina
 * y los procesa para actualizar estadísticas y generar registros.
 */
router.post('/recibir', async (req, res) => {
    const inicioTiempo = Date.now();
    
    try {
        // PASO 1: Validar datos recibidos
        const { codigoMaquina, valorPulso, numeroSecuencia } = req.body;
        
        // Validaciones básicas
        if (!codigoMaquina) {
            return res.status(400).json({
                error: 'Código de máquina requerido',
                mensaje: 'El campo codigoMaquina es obligatorio'
            });
        }

        // PASO 2: Buscar la máquina en la base de datos
        const maquina = await Maquina.findOne({ 
            codigoMaquina: codigoMaquina.toUpperCase(),
            activa: true 
        });

        if (!maquina) {
            return res.status(404).json({
                error: 'Máquina no encontrada',
                mensaje: `No existe una máquina activa con código ${codigoMaquina}`
            });
        }

        // PASO 3: Verificar que la máquina esté operativa
        if (maquina.estado.operativo !== 'Activa') {
            return res.status(403).json({
                error: 'Máquina no operativa',
                mensaje: `La máquina ${codigoMaquina} está en estado: ${maquina.estado.operativo}`
            });
        }

        // PASO 4: Determinar el valor del pulso
        const valorFinal = valorPulso || maquina.configuracion.valorPorPulso;

        // PASO 5: Crear registro del pulso
        const nuevoPulso = new Pulso({
            maquina: maquina._id,
            codigoMaquina: maquina.codigoMaquina,
            valorPulso: valorFinal,
            moneda: maquina.configuracion.moneda,
            fechaHora: new Date(),
            ubicacion: {
                region: maquina.ubicacion.region,
                ciudad: maquina.ubicacion.ciudad,
                direccion: maquina.ubicacion.direccion
            },
            metadata: {
                ipOrigen: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                numeroSecuencia: numeroSecuencia,
                tiempoProcesamiento: 0 // Se calculará al final
            }
        });

        // PASO 6: Guardar el pulso en la base de datos
        await nuevoPulso.save();

        // PASO 7: Actualizar estadísticas de la máquina
        await maquina.registrarPulso(valorFinal);

        // PASO 8: Calcular tiempo de procesamiento
        const tiempoProcesamiento = Date.now() - inicioTiempo;
        nuevoPulso.metadata.tiempoProcesamiento = tiempoProcesamiento;
        await nuevoPulso.save();

        // PASO 9: Respuesta exitosa
        res.status(201).json({
            mensaje: 'Pulso recibido y procesado correctamente',
            datos: {
                pulsoid: nuevoPulso._id,
                codigoMaquina: maquina.codigoMaquina,
                valorPulso: valorFinal,
                moneda: maquina.configuracion.moneda,
                fechaHora: nuevoPulso.fechaHora,
                estadisticasActualizadas: {
                    totalPulsos: maquina.estadisticas.totalPulsos,
                    totalIngresos: maquina.estadisticas.totalIngresos,
                    pulsosHoy: maquina.estadisticas.pulsosHoy,
                    ingresosHoy: maquina.estadisticas.ingresosHoy
                }
            },
            tiempoProcesamiento: `${tiempoProcesamiento}ms`
        });

        // Log para monitoreo
        console.log(`✅ Pulso procesado: ${codigoMaquina} - ${valorFinal} ${maquina.configuracion.moneda} - ${tiempoProcesamiento}ms`);

    } catch (error) {
        console.error('❌ Error procesando pulso:', error);
        
        res.status(500).json({
            error: 'Error interno del servidor',
            mensaje: 'No se pudo procesar el pulso',
            detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/pulsos/lote
 * RECIBIR MÚLTIPLES PULSOS EN UNA SOLA PETICIÓN
 * 
 * Para casos donde la máquina acumula varios pulsos y los envía juntos
 */
router.post('/lote', async (req, res) => {
    const inicioTiempo = Date.now();
    
    try {
        const { pulsos } = req.body;
        
        if (!Array.isArray(pulsos) || pulsos.length === 0) {
            return res.status(400).json({
                error: 'Datos inválidos',
                mensaje: 'Se requiere un array de pulsos no vacío'
            });
        }

        const resultados = [];
        const errores = [];

        // Procesar cada pulso individualmente
        for (let i = 0; i < pulsos.length; i++) {
            try {
                const pulsoData = pulsos[i];
                
                // Buscar máquina
                const maquina = await Maquina.findOne({ 
                    codigoMaquina: pulsoData.codigoMaquina?.toUpperCase(),
                    activa: true 
                });

                if (!maquina) {
                    errores.push({
                        indice: i,
                        error: `Máquina ${pulsoData.codigoMaquina} no encontrada`
                    });
                    continue;
                }

                // Crear y guardar pulso
                const valorFinal = pulsoData.valorPulso || maquina.configuracion.valorPorPulso;
                
                const nuevoPulso = new Pulso({
                    maquina: maquina._id,
                    codigoMaquina: maquina.codigoMaquina,
                    valorPulso: valorFinal,
                    moneda: maquina.configuracion.moneda,
                    fechaHora: pulsoData.fechaHora ? new Date(pulsoData.fechaHora) : new Date(),
                    ubicacion: {
                        region: maquina.ubicacion.region,
                        ciudad: maquina.ubicacion.ciudad,
                        direccion: maquina.ubicacion.direccion
                    },
                    metadata: {
                        ipOrigen: req.ip,
                        userAgent: req.get('User-Agent'),
                        numeroSecuencia: pulsoData.numeroSecuencia
                    }
                });

                await nuevoPulso.save();
                await maquina.registrarPulso(valorFinal);

                resultados.push({
                    indice: i,
                    pulsoid: nuevoPulso._id,
                    codigoMaquina: maquina.codigoMaquina,
                    valorPulso: valorFinal,
                    procesado: true
                });

            } catch (error) {
                errores.push({
                    indice: i,
                    error: error.message
                });
            }
        }

        const tiempoProcesamiento = Date.now() - inicioTiempo;

        res.status(200).json({
            mensaje: 'Procesamiento de lote completado',
            resumen: {
                totalPulsos: pulsos.length,
                procesadosExitosamente: resultados.length,
                errores: errores.length
            },
            resultados,
            errores,
            tiempoProcesamiento: `${tiempoProcesamiento}ms`
        });

    } catch (error) {
        console.error('❌ Error procesando lote de pulsos:', error);
        
        res.status(500).json({
            error: 'Error interno del servidor',
            mensaje: 'No se pudo procesar el lote de pulsos'
        });
    }
});

/**
 * GET /api/pulsos/maquina/:codigo
 * OBTENER HISTORIAL DE PULSOS DE UNA MÁQUINA ESPECÍFICA
 */
router.get('/maquina/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        const { 
            fechaInicio, 
            fechaFin, 
            limite = 100, 
            pagina = 1 
        } = req.query;

        // Construir filtros
        const filtros = {
            codigoMaquina: codigo.toUpperCase(),
            activo: true
        };

        if (fechaInicio || fechaFin) {
            filtros.fechaHora = {};
            if (fechaInicio) filtros.fechaHora.$gte = new Date(fechaInicio);
            if (fechaFin) filtros.fechaHora.$lte = new Date(fechaFin);
        }

        // Calcular paginación
        const skip = (parseInt(pagina) - 1) * parseInt(limite);

        // Obtener pulsos
        const pulsos = await Pulso.find(filtros)
            .sort({ fechaHora: -1 })
            .limit(parseInt(limite))
            .skip(skip)
            .populate('maquina', 'nombre ubicacion');

        // Contar total para paginación
        const total = await Pulso.countDocuments(filtros);

        res.json({
            pulsos,
            paginacion: {
                paginaActual: parseInt(pagina),
                totalPaginas: Math.ceil(total / parseInt(limite)),
                totalRegistros: total,
                registrosPorPagina: parseInt(limite)
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo pulsos:', error);
        res.status(500).json({
            error: 'Error obteniendo historial de pulsos'
        });
    }
});

/**
 * GET /api/pulsos/estadisticas/tiempo-real
 * ESTADÍSTICAS EN TIEMPO REAL DE TODOS LOS PULSOS
 */
router.get('/estadisticas/tiempo-real', async (req, res) => {
    try {
        const ahora = new Date();
        const hace24Horas = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
        const haceUnaHora = new Date(ahora.getTime() - 60 * 60 * 1000);

        // Estadísticas de las últimas 24 horas
        const estadisticas24h = await Pulso.aggregate([
            {
                $match: {
                    fechaHora: { $gte: hace24Horas },
                    activo: true
                }
            },
            {
                $group: {
                    _id: null,
                    totalPulsos: { $sum: 1 },
                    totalIngresos: { $sum: '$valorPulso' },
                    maquinasActivas: { $addToSet: '$codigoMaquina' }
                }
            }
        ]);

        // Estadísticas de la última hora
        const estadisticas1h = await Pulso.aggregate([
            {
                $match: {
                    fechaHora: { $gte: haceUnaHora },
                    activo: true
                }
            },
            {
                $group: {
                    _id: null,
                    totalPulsos: { $sum: 1 },
                    totalIngresos: { $sum: '$valorPulso' }
                }
            }
        ]);

        // Últimos 10 pulsos
        const ultimosPulsos = await Pulso.find({ activo: true })
            .sort({ fechaHora: -1 })
            .limit(10)
            .select('codigoMaquina valorPulso moneda fechaHora ubicacion.region');

        res.json({
            timestamp: ahora,
            ultimas24Horas: estadisticas24h[0] || { totalPulsos: 0, totalIngresos: 0, maquinasActivas: [] },
            ultimaHora: estadisticas1h[0] || { totalPulsos: 0, totalIngresos: 0 },
            ultimosPulsos,
            maquinasActivasCount: estadisticas24h[0]?.maquinasActivas?.length || 0
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas en tiempo real:', error);
        res.status(500).json({
            error: 'Error obteniendo estadísticas'
        });
    }
});

/**
 * DELETE /api/pulsos/:id
 * ELIMINAR UN PULSO ESPECÍFICO (SOFT DELETE)
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const pulso = await Pulso.findById(id);
        if (!pulso) {
            return res.status(404).json({
                error: 'Pulso no encontrado'
            });
        }

        // Soft delete
        pulso.activo = false;
        await pulso.save();

        res.json({
            mensaje: 'Pulso eliminado correctamente',
            pulsoid: id
        });

    } catch (error) {
        console.error('❌ Error eliminando pulso:', error);
        res.status(500).json({
            error: 'Error eliminando pulso'
        });
    }
});

module.exports = router;
