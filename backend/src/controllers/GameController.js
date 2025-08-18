/**
 * 🎮 CONTROLADOR DE PARTIDAS - CYBER SAPO
 * 
 * Este archivo es como un "RECEPCIONISTA ESPECIALIZADO EN PARTIDAS" que:
 * - Recibe peticiones del frontend sobre partidas
 * - Valida que los datos estén correctos
 * - Llama al modelo correspondiente para interactuar con la base de datos
 * - Devuelve respuestas formateadas al frontend
 * 
 * FLUJO DE COMUNICACIÓN:
 * Frontend (juego) → API REST → Este Controlador → GameModel → Base de Datos
 *                                      ↓
 * Frontend (juego) ← Respuesta JSON ← Este Controlador ← GameModel ← Base de Datos
 * 
 * ENDPOINTS QUE MANEJA:
 * POST /api/games - Registrar nueva partida
 * GET /api/games - Obtener lista de partidas con filtros
 * GET /api/games/:id - Obtener detalles de una partida específica
 * GET /api/games/stats - Obtener estadísticas de partidas
 */

const GameModel = require('../models/GameModel');

/**
 * 🏗️ CLASE CONTROLADOR PARA PARTIDAS
 * 
 * Esta clase actúa como intermediario entre las peticiones HTTP
 * y la lógica de negocio de las partidas.
 */
class GameController {

    /**
     * 💾 REGISTRAR UNA NUEVA PARTIDA
     * 
     * Cuando un jugador termina una partida en el frontend:
     * 1. El frontend envía los datos de la partida via POST
     * 2. Este método valida los datos
     * 3. Llama al GameModel para guardar en la base de datos
     * 4. Devuelve confirmación al frontend
     * 
     * DATOS QUE RECIBE:
     * - machine_id: En qué máquina se jugó
     * - location_id: En qué ubicación está la máquina
     * - players_count: Cuántos jugadores participaron
     * - game_type: Tipo de juego (individual, parejas, equipos)
     * - duration_seconds: Cuánto duró la partida
     * - revenue: Cuánto dinero generó
     * - winner_score: Puntuación del ganador
     * - total_score: Puntuación total de todos los jugadores
     */
    static async create(req, res) {
        console.log('🎮 GameController.create: Nueva partida recibida');
        console.log('📝 Datos recibidos:', req.body);

        try {
            // 🔍 EXTRAER DATOS DEL CUERPO DE LA PETICIÓN
            const gameData = req.body;

            // ✅ VALIDACIONES BÁSICAS
            // Verificar que los campos obligatorios estén presentes
            const requiredFields = ['machine_id', 'location_id', 'players_count', 'game_type', 'duration_seconds', 'revenue'];
            const missingFields = requiredFields.filter(field => !gameData[field]);

            if (missingFields.length > 0) {
                console.log('❌ Campos faltantes:', missingFields);
                return res.status(400).json({
                    success: false,
                    error: 'Campos obligatorios faltantes',
                    missing_fields: missingFields,
                    message: `Los siguientes campos son obligatorios: ${missingFields.join(', ')}`
                });
            }

            // 🔢 VALIDAR TIPOS DE DATOS
            if (!Number.isInteger(gameData.machine_id) || gameData.machine_id <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'machine_id debe ser un número entero positivo'
                });
            }

            if (!Number.isInteger(gameData.location_id) || gameData.location_id <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'location_id debe ser un número entero positivo'
                });
            }

            if (!Number.isInteger(gameData.players_count) || gameData.players_count <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'players_count debe ser un número entero positivo'
                });
            }

            if (!Number.isInteger(gameData.duration_seconds) || gameData.duration_seconds <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'duration_seconds debe ser un número entero positivo'
                });
            }

            if (typeof gameData.revenue !== 'number' || gameData.revenue < 0) {
                return res.status(400).json({
                    success: false,
                    error: 'revenue debe ser un número positivo'
                });
            }

            // 🎮 VALIDAR TIPO DE JUEGO
            const validGameTypes = ['individual', 'parejas', 'equipos'];
            if (!validGameTypes.includes(gameData.game_type)) {
                return res.status(400).json({
                    success: false,
                    error: 'game_type inválido',
                    valid_types: validGameTypes,
                    message: `game_type debe ser uno de: ${validGameTypes.join(', ')}`
                });
            }

            // 💾 GUARDAR LA PARTIDA EN LA BASE DE DATOS
            console.log('💾 Guardando partida en la base de datos...');
            const newGame = await GameModel.create(gameData);

            // ✅ RESPUESTA EXITOSA
            console.log(`✅ Partida guardada exitosamente con ID: ${newGame.id}`);
            
            res.status(201).json({
                success: true,
                message: 'Partida registrada exitosamente',
                data: newGame,
                game_id: newGame.id
            });

        } catch (error) {
            // ❌ MANEJO DE ERRORES
            console.error('❌ Error en GameController.create:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                message: 'No se pudo registrar la partida. Inténtalo de nuevo.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * 🔍 OBTENER LISTA DE PARTIDAS CON FILTROS
     * 
     * Permite al frontend o panel de administración obtener partidas según criterios:
     * - Por máquina específica
     * - Por ubicación
     * - Por rango de fechas
     * - Por tipo de juego
     * - Con paginación
     * 
     * PARÁMETROS DE CONSULTA (query params):
     * - machine_id: Filtrar por máquina
     * - location_id: Filtrar por ubicación
     * - game_type: Filtrar por tipo de juego
     * - start_date: Fecha de inicio (YYYY-MM-DD)
     * - end_date: Fecha de fin (YYYY-MM-DD)
     * - page: Página actual (default: 1)
     * - limit: Elementos por página (default: 20)
     */
    static async getAll(req, res) {
        console.log('🔍 GameController.getAll: Obteniendo lista de partidas');
        console.log('📝 Filtros recibidos:', req.query);

        try {
            // 🔍 EXTRAER PARÁMETROS DE CONSULTA
            const filters = {
                machine_id: req.query.machine_id ? parseInt(req.query.machine_id) : undefined,
                location_id: req.query.location_id ? parseInt(req.query.location_id) : undefined,
                game_type: req.query.game_type,
                start_date: req.query.start_date,
                end_date: req.query.end_date,
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

            // 📅 VALIDAR FECHAS
            if (filters.start_date && !/^\d{4}-\d{2}-\d{2}$/.test(filters.start_date)) {
                return res.status(400).json({
                    success: false,
                    error: 'start_date debe tener formato YYYY-MM-DD'
                });
            }

            if (filters.end_date && !/^\d{4}-\d{2}-\d{2}$/.test(filters.end_date)) {
                return res.status(400).json({
                    success: false,
                    error: 'end_date debe tener formato YYYY-MM-DD'
                });
            }

            // 🔍 OBTENER PARTIDAS DE LA BASE DE DATOS
            console.log('🔍 Buscando partidas con filtros:', filters);
            const result = await GameModel.findAll(filters);

            // ✅ RESPUESTA EXITOSA
            res.json({
                success: true,
                message: `${result.games.length} partidas encontradas`,
                data: result.games,
                pagination: result.pagination,
                filters: filters
            });

        } catch (error) {
            // ❌ MANEJO DE ERRORES
            console.error('❌ Error en GameController.getAll:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                message: 'No se pudieron obtener las partidas. Inténtalo de nuevo.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * 🎯 OBTENER UNA PARTIDA ESPECÍFICA POR ID
     * 
     * Devuelve todos los detalles de una partida específica,
     * incluyendo información de la máquina y ubicación.
     */
    static async getById(req, res) {
        console.log('🎯 GameController.getById: Obteniendo partida específica');

        try {
            // 🔍 EXTRAER ID DE LOS PARÁMETROS DE LA URL
            const gameId = parseInt(req.params.id);

            // 🔢 VALIDAR ID
            if (!gameId || gameId <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de partida inválido',
                    message: 'El ID debe ser un número entero positivo'
                });
            }

            // 🔍 BUSCAR LA PARTIDA EN LA BASE DE DATOS
            console.log(`🔍 Buscando partida con ID: ${gameId}`);
            const game = await GameModel.findById(gameId);

            // ✅ RESPUESTA EXITOSA
            res.json({
                success: true,
                message: 'Partida encontrada',
                data: game
            });

        } catch (error) {
            // ❌ MANEJO DE ERRORES
            console.error('❌ Error en GameController.getById:', error.message);
            
            if (error.message.includes('no encontrada')) {
                res.status(404).json({
                    success: false,
                    error: 'Partida no encontrada',
                    message: `No existe una partida con ID ${req.params.id}`
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Error interno del servidor',
                    message: 'No se pudo obtener la partida. Inténtalo de nuevo.',
                    details: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        }
    }

    /**
     * 📊 OBTENER ESTADÍSTICAS DE PARTIDAS
     * 
     * Calcula y devuelve estadísticas útiles sobre las partidas:
     * - Totales generales (partidas, ingresos, tiempo de juego)
     * - Promedios (jugadores por partida, duración, ingresos)
     * - Distribución por tipo de juego
     * - Distribución por horas del día
     * 
     * PARÁMETROS DE CONSULTA:
     * - machine_id: Estadísticas de una máquina específica
     * - location_id: Estadísticas de una ubicación específica
     * - start_date: Desde qué fecha
     * - end_date: Hasta qué fecha
     */
    static async getStats(req, res) {
        console.log('📊 GameController.getStats: Calculando estadísticas de partidas');
        console.log('📝 Filtros recibidos:', req.query);

        try {
            // 🔍 EXTRAER PARÁMETROS DE CONSULTA
            const filters = {
                machine_id: req.query.machine_id ? parseInt(req.query.machine_id) : undefined,
                location_id: req.query.location_id ? parseInt(req.query.location_id) : undefined,
                start_date: req.query.start_date,
                end_date: req.query.end_date
            };

            // 📅 VALIDAR FECHAS
            if (filters.start_date && !/^\d{4}-\d{2}-\d{2}$/.test(filters.start_date)) {
                return res.status(400).json({
                    success: false,
                    error: 'start_date debe tener formato YYYY-MM-DD'
                });
            }

            if (filters.end_date && !/^\d{4}-\d{2}-\d{2}$/.test(filters.end_date)) {
                return res.status(400).json({
                    success: false,
                    error: 'end_date debe tener formato YYYY-MM-DD'
                });
            }

            // 📊 CALCULAR ESTADÍSTICAS
            console.log('📊 Calculando estadísticas con filtros:', filters);
            const stats = await GameModel.getStats(filters);

            // ✅ RESPUESTA EXITOSA
            res.json({
                success: true,
                message: 'Estadísticas calculadas exitosamente',
                data: stats,
                filters: filters
            });

        } catch (error) {
            // ❌ MANEJO DE ERRORES
            console.error('❌ Error en GameController.getStats:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                message: 'No se pudieron calcular las estadísticas. Inténtalo de nuevo.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * 🎮 INICIAR UNA NUEVA PARTIDA (CAMBIAR ESTADO DE MÁQUINA)
     * 
     * Cuando un jugador empieza a jugar:
     * 1. Cambia el estado de la máquina a 'occupied'
     * 2. Registra el inicio de la partida
     * 3. Devuelve confirmación al frontend
     * 
     * Esto permite que otros jugadores sepan que la máquina está ocupada.
     */
    static async startGame(req, res) {
        console.log('🎮 GameController.startGame: Iniciando nueva partida');

        try {
            // 🔍 EXTRAER DATOS
            const { machine_id, location_id, players_count, game_type = 'individual' } = req.body;

            // ✅ VALIDACIONES
            if (!machine_id || !location_id || !players_count) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos faltantes',
                    message: 'machine_id, location_id y players_count son obligatorios'
                });
            }

            // 🎰 CAMBIAR ESTADO DE LA MÁQUINA A 'OCCUPIED'
            const MachineModel = require('../models/MachineModel');
            await MachineModel.updateStatus(machine_id, 'occupied');

            // 📝 REGISTRAR INICIO DE PARTIDA (temporal, se completará cuando termine)
            const gameStartData = {
                machine_id,
                location_id,
                players_count,
                game_type,
                started_at: new Date().toISOString(),
                status: 'in_progress'
            };

            console.log(`✅ Partida iniciada en máquina ${machine_id} con ${players_count} jugadores`);

            // ✅ RESPUESTA EXITOSA
            res.json({
                success: true,
                message: 'Partida iniciada exitosamente',
                data: {
                    machine_id,
                    location_id,
                    players_count,
                    game_type,
                    started_at: gameStartData.started_at,
                    status: 'in_progress'
                }
            });

        } catch (error) {
            // ❌ MANEJO DE ERRORES
            console.error('❌ Error en GameController.startGame:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                message: 'No se pudo iniciar la partida. Inténtalo de nuevo.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * 🏁 FINALIZAR UNA PARTIDA
     * 
     * Cuando un jugador termina de jugar:
     * 1. Registra todos los datos finales de la partida
     * 2. Cambia el estado de la máquina a 'available'
     * 3. Actualiza las estadísticas
     * 4. Devuelve confirmación al frontend
     */
    static async endGame(req, res) {
        console.log('🏁 GameController.endGame: Finalizando partida');

        try {
            // 🔍 EXTRAER DATOS COMPLETOS DE LA PARTIDA
            const gameData = req.body;

            // ✅ VALIDAR QUE TENEMOS TODOS LOS DATOS NECESARIOS
            const requiredFields = ['machine_id', 'location_id', 'players_count', 'game_type', 'duration_seconds', 'revenue'];
            const missingFields = requiredFields.filter(field => !gameData[field]);

            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Campos obligatorios faltantes para finalizar partida',
                    missing_fields: missingFields
                });
            }

            // 💾 GUARDAR LA PARTIDA COMPLETA
            const completedGame = await GameModel.create(gameData);

            // 🎰 CAMBIAR ESTADO DE LA MÁQUINA A 'AVAILABLE'
            const MachineModel = require('../models/MachineModel');
            await MachineModel.updateStatus(gameData.machine_id, 'available');

            console.log(`✅ Partida finalizada: ID ${completedGame.id}, Máquina ${gameData.machine_id} ahora disponible`);

            // ✅ RESPUESTA EXITOSA
            res.json({
                success: true,
                message: 'Partida finalizada y registrada exitosamente',
                data: completedGame,
                machine_status: 'available'
            });

        } catch (error) {
            // ❌ MANEJO DE ERRORES
            console.error('❌ Error en GameController.endGame:', error.message);
            
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                message: 'No se pudo finalizar la partida. Inténtalo de nuevo.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

// 📤 EXPORTAR EL CONTROLADOR PARA QUE LAS RUTAS LO PUEDAN USAR
module.exports = GameController;
