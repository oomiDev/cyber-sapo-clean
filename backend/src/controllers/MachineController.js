/**
 * 🎰 CONTROLADOR DE MÁQUINAS - CYBER SAPO
 * 
 * Este archivo es como un "RECEPCIONISTA ESPECIALIZADO EN MÁQUINAS" que:
 * - Recibe peticiones del panel de administración sobre máquinas
 * - Valida que los datos estén correctos
 * - Llama al modelo correspondiente para interactuar con la base de datos
 * - Devuelve respuestas formateadas al frontend
 * 
 * FLUJO DE COMUNICACIÓN:
 * Panel Admin → API REST → Este Controlador → MachineModel → Base de Datos
 *                               ↓
 * Panel Admin ← Respuesta JSON ← Este Controlador ← MachineModel ← Base de Datos
 * 
 * ENDPOINTS QUE MANEJA:
 * POST /api/machines - Registrar nueva máquina
 * GET /api/machines - Obtener lista de máquinas con filtros
 * GET /api/machines/:id - Obtener detalles de una máquina específica
 * PUT /api/machines/:id/status - Cambiar estado de una máquina
 * GET /api/machines/:id/stats - Obtener estadísticas detalladas de una máquina
 * GET /api/machines/summary - Obtener resumen general de todas las máquinas
 */

const MachineModel = require('../models/MachineModel');

/**
 * 🏗️ CLASE CONTROLADOR PARA MÁQUINAS
 * 
 * Esta clase actúa como intermediario entre las peticiones HTTP
 * y la lógica de negocio de las máquinas.
 */
class MachineController {

    /**
     * 🆕 REGISTRAR UNA NUEVA MÁQUINA
     * 
     * Cuando se instala una nueva máquina CYBER SAPO:
     * 1. El panel de administración envía los datos via POST
     * 2. Este método valida los datos
     * 3. Llama al MachineModel para guardar en la base de datos
     * 4. Devuelve confirmación al panel de administración
     * 
     * DATOS QUE RECIBE:
     * - location_id: En qué ubicación se instala (obligatorio)
     * - name: Nombre de la máquina (opcional, se genera automáticamente)
     * - status: Estado inicial (opcional, default: 'available')
     */
    static async create(req, res) {
        console.log('🎰 MachineController.create: Nueva máquina recibida');
        console.log('📝 Datos recibidos:', req.body);

        try {
            // 🔍 EXTRAER DATOS DEL CUERPO DE LA PETICIÓN
            const machineData = req.body;

            // ✅ VALIDACIONES BÁSICAS
            if (!machineData.location_id) {
                return res.status(400).json({
                    success: false,
                    error: 'location_id es obligatorio',
                    message: 'Debes especificar en qué ubicación se instalará la máquina'
                });
            }

            // 🔢 VALIDAR TIPO DE DATO
            if (!Number.isInteger(machineData.location_id) || machineData.location_id <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'location_id debe ser un número entero positivo'
                });
            }

            // 🎰 VALIDAR ESTADO SI SE PROPORCIONA
            if (machineData.status) {
                const validStatuses = ['available', 'occupied', 'offline'];
                if (!validStatuses.includes(machineData.status)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Estado inválido',
                        valid_statuses: validStatuses,
                        message: `El estado debe ser uno de: ${validStatuses.join(', ')}`
                    });
                }
            }

            // 💾 REGISTRAR LA MÁQUINA EN LA BASE DE DATOS
            console.log('💾 Registrando máquina en la base de datos...');
            const newMachine = await MachineModel.create(machineData);

            // ✅ RESPUESTA EXITOSA
            console.log(`✅ Máquina registrada exitosamente: ${newMachine.name} (ID: ${newMachine.id})`);
            
            res.status(201).json({
                success: true,
                message: 'Máquina registrada exitosamente',
                data: newMachine
            });

        } catch (error) {
            // ❌ MANEJO DE ERRORES
            console.error('❌ Error en MachineController.create:', error.message);
            
            if (error.message.includes('no encontrada')) {
                res.status(404).json({
                    success: false,
                    error: 'Ubicación no encontrada',
                    message: 'La ubicación especificada no existe o está inactiva'
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Error interno del servidor',
                    message: 'No se pudo registrar la máquina. Inténtalo de nuevo.',
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        }
    }

    /**
     * 🔍 OBTENER LISTA DE MÁQUINAS CON FILTROS
     * 
     * Permite al panel de administración obtener máquinas según criterios:
     * - Por ubicación específica
     * - Por estado (disponible, ocupada, fuera de servicio)
     * - Por ciudad o país
     * - Búsqueda por nombre
     * - Con paginación
     * 
     * PARÁMETROS DE CONSULTA (query params):
     * - location_id: Filtrar por ubicación
     * - status: Filtrar por estado
     * - city: Filtrar por ciudad
     * - country: Filtrar por país
     * - search: Búsqueda por nombre de máquina o ubicación
     * - page: Página actual (default: 1)
     * - limit: Elementos por página (default: 20)
     */
    static async getAll(req, res) {
        console.log('🔍 MachineController.getAll: Obteniendo lista de máquinas');
        console.log('📝 Filtros recibidos:', req.query);

        try {
            // 🔍 EXTRAER PARÁMETROS DE CONSULTA
            const filters = {
                location_id: req.query.location_id ? parseInt(req.query.location_id) : undefined,
                status: req.query.status,
                city: req.query.city,
                country: req.query.country,
                search: req.query.search,
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

            // 🎰 VALIDAR ESTADO SI SE PROPORCIONA
            if (filters.status) {
                const validStatuses = ['available', 'occupied', 'offline'];
                if (!validStatuses.includes(filters.status)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Estado inválido',
                        valid_statuses: validStatuses
                    });
                }
            }

            // 🔍 OBTENER MÁQUINAS DE LA BASE DE DATOS
            console.log('🔍 Buscando máquinas con filtros:', filters);
            const result = await MachineModel.findAll(filters);

            // ✅ RESPUESTA EXITOSA
            res.json({
                success: true,
                message: `${result.machines.length} máquinas encontradas`,
                data: result.machines,
                pagination: result.pagination,
                filters: filters
            });

        } catch (error) {
            // ❌ MANEJO DE ERRORES
            console.error('❌ Error en MachineController.getAll:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                message: 'No se pudieron obtener las máquinas. Inténtalo de nuevo.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * 🎯 OBTENER UNA MÁQUINA ESPECÍFICA POR ID
     * 
     * Devuelve todos los detalles de una máquina específica,
     * incluyendo información de ubicación y estadísticas calculadas.
     */
    static async getById(req, res) {
        console.log('🎯 MachineController.getById: Obteniendo máquina específica');

        try {
            // 🔍 EXTRAER ID DE LOS PARÁMETROS DE LA URL
            const machineId = parseInt(req.params.id);

            // 🔢 VALIDAR ID
            if (!machineId || machineId <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de máquina inválido',
                    message: 'El ID debe ser un número entero positivo'
                });
            }

            // 🔍 BUSCAR LA MÁQUINA EN LA BASE DE DATOS
            console.log(`🔍 Buscando máquina con ID: ${machineId}`);
            const machine = await MachineModel.findById(machineId);

            // ✅ RESPUESTA EXITOSA
            res.json({
                success: true,
                message: 'Máquina encontrada',
                data: machine
            });

        } catch (error) {
            // ❌ MANEJO DE ERRORES
            console.error('❌ Error en MachineController.getById:', error.message);
            
            if (error.message.includes('no encontrada')) {
                res.status(404).json({
                    success: false,
                    error: 'Máquina no encontrada',
                    message: `No existe una máquina con ID ${req.params.id}`
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Error interno del servidor',
                    message: 'No se pudo obtener la máquina. Inténtalo de nuevo.',
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        }
    }

    /**
     * 🔄 CAMBIAR EL ESTADO DE UNA MÁQUINA
     * 
     * Permite cambiar el estado de una máquina entre:
     * - 'available' (disponible para jugar)
     * - 'occupied' (alguien está jugando)
     * - 'offline' (fuera de servicio)
     * 
     * USOS TÍPICOS:
     * - Cuando empieza una partida: available → occupied
     * - Cuando termina una partida: occupied → available
     * - Para mantenimiento: cualquier estado → offline
     * - Después de mantenimiento: offline → available
     */
    static async updateStatus(req, res) {
        console.log('🔄 MachineController.updateStatus: Cambiando estado de máquina');

        try {
            // 🔍 EXTRAER PARÁMETROS
            const machineId = parseInt(req.params.id);
            const { status } = req.body;

            // 🔢 VALIDAR ID
            if (!machineId || machineId <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de máquina inválido'
                });
            }

            // ✅ VALIDAR ESTADO
            if (!status) {
                return res.status(400).json({
                    success: false,
                    error: 'Estado es obligatorio',
                    message: 'Debes especificar el nuevo estado de la máquina'
                });
            }

            const validStatuses = ['available', 'occupied', 'offline'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: 'Estado inválido',
                    valid_statuses: validStatuses,
                    message: `El estado debe ser uno de: ${validStatuses.join(', ')}`
                });
            }

            // 🔄 ACTUALIZAR EL ESTADO EN LA BASE DE DATOS
            console.log(`🔄 Cambiando estado de máquina ${machineId} a '${status}'`);
            const updatedMachine = await MachineModel.updateStatus(machineId, status);

            // ✅ RESPUESTA EXITOSA
            res.json({
                success: true,
                message: `Estado de máquina actualizado a '${status}'`,
                data: updatedMachine,
                previous_status: updatedMachine.status !== status ? 'unknown' : status,
                new_status: status
            });

        } catch (error) {
            // ❌ MANEJO DE ERRORES
            console.error('❌ Error en MachineController.updateStatus:', error.message);
            
            if (error.message.includes('no encontrada')) {
                res.status(404).json({
                    success: false,
                    error: 'Máquina no encontrada',
                    message: `No existe una máquina con ID ${req.params.id}`
                });
            } else if (error.message.includes('inválido')) {
                res.status(400).json({
                    success: false,
                    error: 'Estado inválido',
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Error interno del servidor',
                    message: 'No se pudo actualizar el estado. Inténtalo de nuevo.',
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        }
    }

    /**
     * 📊 OBTENER ESTADÍSTICAS DETALLADAS DE UNA MÁQUINA
     * 
     * Calcula y devuelve estadísticas completas para una máquina específica:
     * - Estadísticas generales (totales, promedios)
     * - Tendencias diarias de ingresos
     * - Distribución por horas del día
     * - Distribución por días de la semana
     * - Tipos de juego más populares
     * - Partidas más largas
     * - Partidas recientes
     * 
     * PARÁMETROS DE CONSULTA:
     * - period: Período de análisis ('7d', '30d', '90d', '1y', 'all')
     */
    static async getStats(req, res) {
        console.log('📊 MachineController.getStats: Calculando estadísticas de máquina');

        try {
            // 🔍 EXTRAER PARÁMETROS
            const machineId = parseInt(req.params.id);
            const period = req.query.period || '30d';

            // 🔢 VALIDAR ID
            if (!machineId || machineId <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de máquina inválido'
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
            console.log(`📊 Calculando estadísticas para máquina ${machineId} (período: ${period})`);
            const stats = await MachineModel.getDetailedStats(machineId, period);

            // ✅ RESPUESTA EXITOSA
            res.json({
                success: true,
                message: 'Estadísticas calculadas exitosamente',
                data: stats
            });

        } catch (error) {
            // ❌ MANEJO DE ERRORES
            console.error('❌ Error en MachineController.getStats:', error.message);
            
            if (error.message.includes('no encontrada')) {
                res.status(404).json({
                    success: false,
                    error: 'Máquina no encontrada',
                    message: `No existe una máquina con ID ${req.params.id}`
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
     * 📈 OBTENER RESUMEN GENERAL DE TODAS LAS MÁQUINAS
     * 
     * Proporciona un resumen general del estado de todas las máquinas:
     * - Cuántas están disponibles, ocupadas, fuera de servicio
     * - Totales generales de ingresos y partidas
     * - Top 5 máquinas más rentables
     * - Top 5 máquinas con más partidas
     */
    static async getSummary(req, res) {
        console.log('📈 MachineController.getSummary: Calculando resumen general');

        try {
            // 📊 OBTENER RESUMEN DE LA BASE DE DATOS
            console.log('📊 Calculando resumen general de máquinas...');
            const summary = await MachineModel.getSummary();

            // ✅ RESPUESTA EXITOSA
            res.json({
                success: true,
                message: 'Resumen calculado exitosamente',
                data: summary
            });

        } catch (error) {
            // ❌ MANEJO DE ERRORES
            console.error('❌ Error en MachineController.getSummary:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                message: 'No se pudo calcular el resumen. Inténtalo de nuevo.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * 🔧 OBTENER ESTADO EN TIEMPO REAL DE UNA MÁQUINA
     * 
     * Devuelve el estado actual de una máquina específica.
     * Útil para el frontend del juego para saber si puede empezar una partida.
     */
    static async getStatus(req, res) {
        console.log('🔧 MachineController.getStatus: Obteniendo estado de máquina');

        try {
            // 🔍 EXTRAER ID
            const machineId = parseInt(req.params.id);

            // 🔢 VALIDAR ID
            if (!machineId || machineId <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de máquina inválido'
                });
            }

            // 🔍 OBTENER INFORMACIÓN BÁSICA DE LA MÁQUINA
            const machine = await MachineModel.findById(machineId);

            // ✅ RESPUESTA EXITOSA CON INFORMACIÓN MÍNIMA
            res.json({
                success: true,
                message: 'Estado obtenido exitosamente',
                data: {
                    id: machine.id,
                    name: machine.name,
                    status: machine.status,
                    location_name: machine.location_name,
                    last_game_at: machine.last_game_at,
                    available: machine.status === 'available'
                }
            });

        } catch (error) {
            // ❌ MANEJO DE ERRORES
            console.error('❌ Error en MachineController.getStatus:', error.message);
            
            if (error.message.includes('no encontrada')) {
                res.status(404).json({
                    success: false,
                    error: 'Máquina no encontrada',
                    message: `No existe una máquina con ID ${req.params.id}`
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Error interno del servidor',
                    message: 'No se pudo obtener el estado. Inténtalo de nuevo.',
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        }
    }
}

// 📤 EXPORTAR EL CONTROLADOR PARA QUE LAS RUTAS LO PUEDAN USAR
module.exports = MachineController;
