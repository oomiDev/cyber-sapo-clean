/**
 * 🏢 CONTROLADOR DE UBICACIONES - CYBER SAPO
 * 
 * Este archivo es como un "RECEPCIONISTA ESPECIALIZADO EN UBICACIONES" que:
 * - Recibe peticiones del panel de administración sobre ubicaciones
 * - Valida que los datos estén correctos
 * - Llama al modelo correspondiente para interactuar con la base de datos
 * - Devuelve respuestas formateadas al frontend
 * 
 * FLUJO DE COMUNICACIÓN:
 * Panel Admin → API REST → Este Controlador → LocationModel → Base de Datos
 *                               ↓
 * Panel Admin ← Respuesta JSON ← Este Controlador ← LocationModel ← Base de Datos
 * 
 * ENDPOINTS QUE MANEJA:
 * POST /api/locations - Registrar nueva ubicación
 * GET /api/locations - Obtener lista de ubicaciones con filtros
 * GET /api/locations/:id - Obtener detalles de una ubicación específica
 * PUT /api/locations/:id - Actualizar información de una ubicación
 * DELETE /api/locations/:id - Desactivar una ubicación
 * GET /api/locations/:id/stats - Obtener estadísticas detalladas de una ubicación
 * GET /api/locations/summary - Obtener resumen general de todas las ubicaciones
 * GET /api/locations/countries - Obtener lista de países
 * GET /api/locations/cities - Obtener lista de ciudades por país
 */

const LocationModel = require('../models/LocationModel');

/**
 * 🏗️ CLASE CONTROLADOR PARA UBICACIONES
 * 
 * Esta clase actúa como intermediario entre las peticiones HTTP
 * y la lógica de negocio de las ubicaciones.
 */
class LocationController {

    /**
     * 🆕 REGISTRAR UNA NUEVA UBICACIÓN
     * 
     * Cuando se quiere instalar máquinas CYBER SAPO en un nuevo lugar:
     * 1. El panel de administración envía los datos via POST
     * 2. Este método valida los datos
     * 3. Llama al LocationModel para guardar en la base de datos
     * 4. Devuelve confirmación al panel de administración
     * 
     * DATOS QUE RECIBE:
     * - name: Nombre del lugar (obligatorio)
     * - country: País (obligatorio)
     * - city: Ciudad (obligatorio)
     * - address: Dirección (opcional)
     * - phone: Teléfono (opcional)
     * - email: Email (opcional)
     * - business_type: Tipo de negocio (opcional, default: 'other')
     * - description: Descripción (opcional)
     * - latitude: Coordenada GPS (opcional)
     * - longitude: Coordenada GPS (opcional)
     */
    static async create(req, res) {
        console.log('🏢 LocationController.create: Nueva ubicación recibida');
        console.log('📝 Datos recibidos:', req.body);

        try {
            // 🔍 EXTRAER DATOS DEL CUERPO DE LA PETICIÓN
            const locationData = req.body;

            // ✅ VALIDACIONES BÁSICAS
            const requiredFields = ['name', 'country', 'city'];
            const missingFields = requiredFields.filter(field => !locationData[field]);

            if (missingFields.length > 0) {
                console.log('❌ Campos faltantes:', missingFields);
                return res.status(400).json({
                    success: false,
                    error: 'Campos obligatorios faltantes',
                    missing_fields: missingFields,
                    message: `Los siguientes campos son obligatorios: ${missingFields.join(', ')}`
                });
            }

            // 📧 VALIDAR EMAIL SI SE PROPORCIONA
            if (locationData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(locationData.email)) {
                return res.status(400).json({
                    success: false,
                    error: 'Formato de email inválido'
                });
            }

            // 🌍 VALIDAR COORDENADAS GPS SI SE PROPORCIONAN
            if (locationData.latitude !== undefined) {
                const lat = parseFloat(locationData.latitude);
                if (isNaN(lat) || lat < -90 || lat > 90) {
                    return res.status(400).json({
                        success: false,
                        error: 'latitude debe ser un número entre -90 y 90'
                    });
                }
                locationData.latitude = lat;
            }

            if (locationData.longitude !== undefined) {
                const lng = parseFloat(locationData.longitude);
                if (isNaN(lng) || lng < -180 || lng > 180) {
                    return res.status(400).json({
                        success: false,
                        error: 'longitude debe ser un número entre -180 y 180'
                    });
                }
                locationData.longitude = lng;
            }

            // 💾 REGISTRAR LA UBICACIÓN EN LA BASE DE DATOS
            console.log('💾 Registrando ubicación en la base de datos...');
            const newLocation = await LocationModel.create(locationData);

            // ✅ RESPUESTA EXITOSA
            console.log(`✅ Ubicación registrada exitosamente: ${newLocation.name} (ID: ${newLocation.id})`);
            
            res.status(201).json({
                success: true,
                message: 'Ubicación registrada exitosamente',
                data: newLocation
            });

        } catch (error) {
            // ❌ MANEJO DE ERRORES
            console.error('❌ Error en LocationController.create:', error.message);
            
            if (error.message.includes('no válido')) {
                res.status(400).json({
                    success: false,
                    error: 'Tipo de negocio inválido',
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Error interno del servidor',
                    message: 'No se pudo registrar la ubicación. Inténtalo de nuevo.',
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        }
    }

    /**
     * 🔍 OBTENER LISTA DE UBICACIONES CON FILTROS
     * 
     * Permite al panel de administración obtener ubicaciones según criterios:
     * - Por país específico
     * - Por ciudad específica
     * - Por tipo de negocio
     * - Búsqueda por nombre
     * - Solo activas o incluir inactivas
     * - Con paginación
     * 
     * PARÁMETROS DE CONSULTA (query params):
     * - country: Filtrar por país
     * - city: Filtrar por ciudad
     * - business_type: Filtrar por tipo de negocio
     * - search: Búsqueda por nombre o dirección
     * - active: Solo activas (1) o todas (0) (default: 1)
     * - page: Página actual (default: 1)
     * - limit: Elementos por página (default: 20)
     */
    static async getAll(req, res) {
        console.log('🔍 LocationController.getAll: Obteniendo lista de ubicaciones');
        console.log('📝 Filtros recibidos:', req.query);

        try {
            // 🔍 EXTRAER PARÁMETROS DE CONSULTA
            const filters = {
                country: req.query.country,
                city: req.query.city,
                business_type: req.query.business_type,
                search: req.query.search,
                active: req.query.active !== undefined ? parseInt(req.query.active) : 1,
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 20
            };

            // 🔢 VALIDAR PARÁMETROS NUMÉRICOS
            if (filters.page <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'page debe ser un número positivo'
                });
            }

            if (filters.limit <= 0 || filters.limit > 100) {
                return res.status(400).json({
                    success: false,
                    error: 'limit debe ser un número entre 1 y 100'
                });
            }

            if (filters.active !== 0 && filters.active !== 1) {
                return res.status(400).json({
                    success: false,
                    error: 'active debe ser 0 o 1'
                });
            }

            // 🔍 OBTENER UBICACIONES DE LA BASE DE DATOS
            console.log('🔍 Buscando ubicaciones con filtros:', filters);
            const result = await LocationModel.findAll(filters);

            // ✅ RESPUESTA EXITOSA
            res.json({
                success: true,
                message: `${result.locations.length} ubicaciones encontradas`,
                data: result.locations,
                pagination: result.pagination,
                filters: filters
            });

        } catch (error) {
            // ❌ MANEJO DE ERRORES
            console.error('❌ Error en LocationController.getAll:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                message: 'No se pudieron obtener las ubicaciones. Inténtalo de nuevo.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * 🎯 OBTENER UNA UBICACIÓN ESPECÍFICA POR ID
     * 
     * Devuelve todos los detalles de una ubicación específica,
     * incluyendo estadísticas de todas sus máquinas.
     */
    static async getById(req, res) {
        console.log('🎯 LocationController.getById: Obteniendo ubicación específica');

        try {
            // 🔍 EXTRAER ID DE LOS PARÁMETROS DE LA URL
            const locationId = parseInt(req.params.id);

            // 🔢 VALIDAR ID
            if (!locationId || locationId <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de ubicación inválido',
                    message: 'El ID debe ser un número entero positivo'
                });
            }

            // 🔍 BUSCAR LA UBICACIÓN EN LA BASE DE DATOS
            console.log(`🔍 Buscando ubicación con ID: ${locationId}`);
            const location = await LocationModel.findById(locationId);

            // ✅ RESPUESTA EXITOSA
            res.json({
                success: true,
                message: 'Ubicación encontrada',
                data: location
            });

        } catch (error) {
            // ❌ MANEJO DE ERRORES
            console.error('❌ Error en LocationController.getById:', error.message);
            
            if (error.message.includes('no encontrada')) {
                res.status(404).json({
                    success: false,
                    error: 'Ubicación no encontrada',
                    message: `No existe una ubicación con ID ${req.params.id}`
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Error interno del servidor',
                    message: 'No se pudo obtener la ubicación. Inténtalo de nuevo.',
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        }
    }

    /**
     * ✏️ ACTUALIZAR INFORMACIÓN DE UNA UBICACIÓN
     * 
     * Permite modificar los datos de una ubicación existente.
     * Solo se actualizan los campos que se envían en la petición.
     */
    static async update(req, res) {
        console.log('✏️ LocationController.update: Actualizando ubicación');

        try {
            // 🔍 EXTRAER PARÁMETROS
            const locationId = parseInt(req.params.id);
            const updateData = req.body;

            // 🔢 VALIDAR ID
            if (!locationId || locationId <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de ubicación inválido'
                });
            }

            // ✅ VALIDAR DATOS SI SE PROPORCIONAN
            if (updateData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.email)) {
                return res.status(400).json({
                    success: false,
                    error: 'Formato de email inválido'
                });
            }

            if (updateData.latitude !== undefined) {
                const lat = parseFloat(updateData.latitude);
                if (isNaN(lat) || lat < -90 || lat > 90) {
                    return res.status(400).json({
                        success: false,
                        error: 'latitude debe ser un número entre -90 y 90'
                    });
                }
                updateData.latitude = lat;
            }

            if (updateData.longitude !== undefined) {
                const lng = parseFloat(updateData.longitude);
                if (isNaN(lng) || lng < -180 || lng > 180) {
                    return res.status(400).json({
                        success: false,
                        error: 'longitude debe ser un número entre -180 y 180'
                    });
                }
                updateData.longitude = lng;
            }

            // ✏️ ACTUALIZAR EN LA BASE DE DATOS
            console.log(`✏️ Actualizando ubicación ${locationId} con datos:`, updateData);
            const updatedLocation = await LocationModel.update(locationId, updateData);

            // ✅ RESPUESTA EXITOSA
            res.json({
                success: true,
                message: 'Ubicación actualizada exitosamente',
                data: updatedLocation
            });

        } catch (error) {
            // ❌ MANEJO DE ERRORES
            console.error('❌ Error en LocationController.update:', error.message);
            
            if (error.message.includes('no encontrada')) {
                res.status(404).json({
                    success: false,
                    error: 'Ubicación no encontrada',
                    message: `No existe una ubicación con ID ${req.params.id}`
                });
            } else if (error.message.includes('no válido')) {
                res.status(400).json({
                    success: false,
                    error: 'Datos inválidos',
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Error interno del servidor',
                    message: 'No se pudo actualizar la ubicación. Inténtalo de nuevo.',
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        }
    }

    /**
     * 🗑️ DESACTIVAR UNA UBICACIÓN
     * 
     * En lugar de eliminar completamente una ubicación, la marcamos como inactiva.
     * Esto preserva el historial de partidas y estadísticas.
     */
    static async deactivate(req, res) {
        console.log('🗑️ LocationController.deactivate: Desactivando ubicación');

        try {
            // 🔍 EXTRAER ID
            const locationId = parseInt(req.params.id);

            // 🔢 VALIDAR ID
            if (!locationId || locationId <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de ubicación inválido'
                });
            }

            // 🗑️ DESACTIVAR EN LA BASE DE DATOS
            console.log(`🗑️ Desactivando ubicación ${locationId}`);
            const deactivatedLocation = await LocationModel.deactivate(locationId);

            // ✅ RESPUESTA EXITOSA
            res.json({
                success: true,
                message: 'Ubicación desactivada exitosamente',
                data: deactivatedLocation,
                warning: deactivatedLocation.machine_count > 0 ? 
                    `Esta ubicación tiene ${deactivatedLocation.machine_count} máquinas. Considera desactivarlas también.` : 
                    null
            });

        } catch (error) {
            // ❌ MANEJO DE ERRORES
            console.error('❌ Error en LocationController.deactivate:', error.message);
            
            if (error.message.includes('no encontrada')) {
                res.status(404).json({
                    success: false,
                    error: 'Ubicación no encontrada',
                    message: `No existe una ubicación con ID ${req.params.id}`
                });
            } else if (error.message.includes('ya está desactivada')) {
                res.status(400).json({
                    success: false,
                    error: 'Ubicación ya desactivada',
                    message: 'Esta ubicación ya está desactivada'
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Error interno del servidor',
                    message: 'No se pudo desactivar la ubicación. Inténtalo de nuevo.',
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        }
    }

    /**
     * 📊 OBTENER ESTADÍSTICAS DETALLADAS DE UNA UBICACIÓN
     * 
     * Calcula y devuelve estadísticas completas para una ubicación específica:
     * - Rendimiento de todas sus máquinas
     * - Tendencias de ingresos por día
     * - Distribución de actividad por horas
     * - Tipos de juego más populares
     * 
     * PARÁMETROS DE CONSULTA:
     * - period: Período de análisis ('7d', '30d', '90d', '1y', 'all')
     */
    static async getStats(req, res) {
        console.log('📊 LocationController.getStats: Calculando estadísticas de ubicación');

        try {
            // 🔍 EXTRAER PARÁMETROS
            const locationId = parseInt(req.params.id);
            const period = req.query.period || '30d';

            // 🔢 VALIDAR ID
            if (!locationId || locationId <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de ubicación inválido'
                });
            }

            // 📅 VALIDAR PERÍODO
            const validPeriods = ['7d', '30d', '90d', '1y', 'all'];
            if (!validPeriods.includes(period)) {
                return res.status(400).json({
                    success: false,
                    error: 'Período inválido',
                    valid_periods: validPeriods,
                    message: `El período debe ser uno de: ${validPeriods.join(', ')}`
                });
            }

            // 📊 CALCULAR ESTADÍSTICAS DETALLADAS
            console.log(`📊 Calculando estadísticas para ubicación ${locationId} (período: ${period})`);
            const stats = await LocationModel.getDetailedStats(locationId, period);

            // ✅ RESPUESTA EXITOSA
            res.json({
                success: true,
                message: 'Estadísticas calculadas exitosamente',
                data: stats
            });

        } catch (error) {
            // ❌ MANEJO DE ERRORES
            console.error('❌ Error en LocationController.getStats:', error.message);
            
            if (error.message.includes('no encontrada')) {
                res.status(404).json({
                    success: false,
                    error: 'Ubicación no encontrada',
                    message: `No existe una ubicación con ID ${req.params.id}`
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Error interno del servidor',
                    message: 'No se pudieron calcular las estadísticas. Inténtalo de nuevo.',
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        }
    }

    /**
     * 📈 OBTENER RESUMEN GENERAL DE TODAS LAS UBICACIONES
     * 
     * Proporciona estadísticas generales de todas las ubicaciones:
     * - Total de ubicaciones por país
     * - Total por tipo de negocio
     * - Top 10 ubicaciones más rentables
     * - Distribución geográfica
     */
    static async getSummary(req, res) {
        console.log('📈 LocationController.getSummary: Calculando resumen general');

        try {
            // 📊 OBTENER RESUMEN DE LA BASE DE DATOS
            console.log('📊 Calculando resumen general de ubicaciones...');
            const summary = await LocationModel.getSummary();

            // ✅ RESPUESTA EXITOSA
            res.json({
                success: true,
                message: 'Resumen calculado exitosamente',
                data: summary
            });

        } catch (error) {
            // ❌ MANEJO DE ERRORES
            console.error('❌ Error en LocationController.getSummary:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                message: 'No se pudo calcular el resumen. Inténtalo de nuevo.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * 🌍 OBTENER LISTA DE PAÍSES
     * 
     * Devuelve todos los países donde hay ubicaciones activas.
     * Útil para filtros y formularios.
     */
    static async getCountries(req, res) {
        console.log('🌍 LocationController.getCountries: Obteniendo lista de países');

        try {
            // 🌍 OBTENER PAÍSES DE LA BASE DE DATOS
            const countries = await LocationModel.getCountries();

            // ✅ RESPUESTA EXITOSA
            res.json({
                success: true,
                message: `${countries.length} países encontrados`,
                data: countries
            });

        } catch (error) {
            // ❌ MANEJO DE ERRORES
            console.error('❌ Error en LocationController.getCountries:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                message: 'No se pudieron obtener los países. Inténtalo de nuevo.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * 🏙️ OBTENER LISTA DE CIUDADES POR PAÍS
     * 
     * Devuelve todas las ciudades de un país específico donde hay ubicaciones.
     * 
     * PARÁMETROS DE CONSULTA:
     * - country: País del cual obtener las ciudades (obligatorio)
     */
    static async getCities(req, res) {
        console.log('🏙️ LocationController.getCities: Obteniendo lista de ciudades');

        try {
            // 🔍 EXTRAER PARÁMETRO
            const { country } = req.query;

            // ✅ VALIDAR PAÍS
            if (!country) {
                return res.status(400).json({
                    success: false,
                    error: 'Parámetro country es obligatorio',
                    message: 'Debes especificar el país para obtener sus ciudades'
                });
            }

            // 🏙️ OBTENER CIUDADES DE LA BASE DE DATOS
            console.log(`🏙️ Obteniendo ciudades de ${country}...`);
            const cities = await LocationModel.getCitiesByCountry(country);

            // ✅ RESPUESTA EXITOSA
            res.json({
                success: true,
                message: `${cities.length} ciudades encontradas en ${country}`,
                data: cities,
                country: country
            });

        } catch (error) {
            // ❌ MANEJO DE ERRORES
            console.error('❌ Error en LocationController.getCities:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                message: 'No se pudieron obtener las ciudades. Inténtalo de nuevo.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

// 📤 EXPORTAR EL CONTROLADOR PARA QUE LAS RUTAS LO PUEDAN USAR
module.exports = LocationController;
