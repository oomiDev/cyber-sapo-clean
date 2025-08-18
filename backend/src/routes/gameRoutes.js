/**
 * 🎮 RUTAS DE PARTIDAS - CYBER SAPO
 * 
 * Este archivo define todas las rutas (URLs) relacionadas con las partidas del juego.
 * Es como un "MAPA DE DIRECCIONES" que le dice al servidor qué hacer cuando
 * recibe peticiones sobre partidas.
 * 
 * FLUJO DE COMUNICACIÓN:
 * 1. Frontend envía petición HTTP a una URL (ej: POST /api/games)
 * 2. Express.js busca en este archivo qué función debe ejecutar
 * 3. Este archivo llama al GameController correspondiente
 * 4. El GameController procesa la petición y devuelve respuesta
 * 
 * RUTAS DISPONIBLES:
 * POST   /api/games           - Registrar nueva partida
 * GET    /api/games           - Obtener lista de partidas con filtros
 * GET    /api/games/:id       - Obtener detalles de una partida específica
 * GET    /api/games/stats     - Obtener estadísticas de partidas
 * POST   /api/games/start     - Iniciar nueva partida (cambiar estado máquina)
 * POST   /api/games/end       - Finalizar partida (registrar y liberar máquina)
 */

const express = require('express');
const GameController = require('../controllers/GameController');

// 🛤️ CREAR UN ROUTER DE EXPRESS
// Un router es como un "sub-servidor" que maneja solo las rutas de partidas
const router = express.Router();

/**
 * 💾 POST /api/games - REGISTRAR NUEVA PARTIDA
 * 
 * Cuando un jugador termina una partida en el frontend, envía todos los datos
 * de la partida para que se guarden en la base de datos.
 * 
 * DATOS ESPERADOS EN EL BODY:
 * {
 *   "machine_id": 1,
 *   "location_id": 1,
 *   "players_count": 2,
 *   "game_type": "parejas",
 *   "duration_seconds": 450,
 *   "revenue": 5.00,
 *   "winner_score": 3500,
 *   "total_score": 6800
 * }
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "success": true,
 *   "message": "Partida registrada exitosamente",
 *   "data": { ... datos de la partida guardada ... },
 *   "game_id": 123
 * }
 */
router.post('/', GameController.create);

/**
 * 🔍 GET /api/games - OBTENER LISTA DE PARTIDAS CON FILTROS
 * 
 * Permite obtener una lista de partidas con diferentes filtros.
 * Útil para el panel de administración y análisis.
 * 
 * PARÁMETROS DE CONSULTA OPCIONALES:
 * - machine_id: Filtrar por máquina específica
 * - location_id: Filtrar por ubicación específica
 * - game_type: Filtrar por tipo de juego (individual, parejas, equipos)
 * - start_date: Fecha de inicio (formato: YYYY-MM-DD)
 * - end_date: Fecha de fin (formato: YYYY-MM-DD)
 * - page: Número de página (default: 1)
 * - limit: Elementos por página (default: 20, máximo: 100)
 * 
 * EJEMPLO DE USO:
 * GET /api/games?machine_id=1&game_type=parejas&page=1&limit=10
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "success": true,
 *   "message": "15 partidas encontradas",
 *   "data": [ ... array de partidas ... ],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 10,
 *     "total": 15,
 *     "pages": 2
 *   }
 * }
 */
router.get('/', GameController.getAll);

/**
 * 📊 GET /api/games/stats - OBTENER ESTADÍSTICAS DE PARTIDAS
 * 
 * Calcula estadísticas útiles sobre las partidas jugadas.
 * Útil para dashboards y reportes.
 * 
 * PARÁMETROS DE CONSULTA OPCIONALES:
 * - machine_id: Estadísticas de una máquina específica
 * - location_id: Estadísticas de una ubicación específica
 * - start_date: Desde qué fecha calcular
 * - end_date: Hasta qué fecha calcular
 * 
 * EJEMPLO DE USO:
 * GET /api/games/stats?location_id=1&start_date=2024-01-01&end_date=2024-01-31
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "success": true,
 *   "data": {
 *     "general": {
 *       "total_games": 150,
 *       "total_revenue": 750.50,
 *       "avg_players": 2.3,
 *       "avg_duration": 420
 *     },
 *     "by_game_type": [ ... distribución por tipo ... ],
 *     "by_hour": [ ... distribución por hora del día ... ]
 *   }
 * }
 */
router.get('/stats', GameController.getStats);

/**
 * 🎮 POST /api/games/start - INICIAR NUEVA PARTIDA
 * 
 * Cuando un jugador empieza a jugar, esta ruta:
 * 1. Cambia el estado de la máquina a 'occupied'
 * 2. Registra el inicio de la partida
 * 3. Devuelve confirmación
 * 
 * DATOS ESPERADOS EN EL BODY:
 * {
 *   "machine_id": 1,
 *   "location_id": 1,
 *   "players_count": 2,
 *   "game_type": "parejas"
 * }
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "success": true,
 *   "message": "Partida iniciada exitosamente",
 *   "data": {
 *     "machine_id": 1,
 *     "status": "in_progress",
 *     "started_at": "2024-01-15T14:30:00.000Z"
 *   }
 * }
 */
router.post('/start', GameController.startGame);

/**
 * 🏁 POST /api/games/end - FINALIZAR PARTIDA
 * 
 * Cuando un jugador termina de jugar, esta ruta:
 * 1. Registra todos los datos finales de la partida
 * 2. Cambia el estado de la máquina a 'available'
 * 3. Actualiza estadísticas
 * 
 * DATOS ESPERADOS EN EL BODY:
 * {
 *   "machine_id": 1,
 *   "location_id": 1,
 *   "players_count": 2,
 *   "game_type": "parejas",
 *   "duration_seconds": 450,
 *   "revenue": 5.00,
 *   "winner_score": 3500,
 *   "total_score": 6800
 * }
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "success": true,
 *   "message": "Partida finalizada y registrada exitosamente",
 *   "data": { ... datos completos de la partida ... },
 *   "machine_status": "available"
 * }
 */
router.post('/end', GameController.endGame);

/**
 * 🎯 GET /api/games/:id - OBTENER DETALLES DE UNA PARTIDA ESPECÍFICA
 * 
 * Devuelve toda la información de una partida específica por su ID.
 * 
 * PARÁMETROS DE URL:
 * - id: ID numérico de la partida
 * 
 * EJEMPLO DE USO:
 * GET /api/games/123
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "success": true,
 *   "message": "Partida encontrada",
 *   "data": {
 *     "id": 123,
 *     "machine_id": 1,
 *     "machine_name": "CYBER-001",
 *     "location_name": "Bar El Sapo Dorado",
 *     "players_count": 2,
 *     "game_type": "parejas",
 *     "duration_seconds": 450,
 *     "revenue": 5.00,
 *     "winner_score": 3500,
 *     "started_at": "2024-01-15T14:30:00.000Z",
 *     "ended_at": "2024-01-15T14:37:30.000Z"
 *   }
 * }
 * 
 * RESPUESTA DE ERROR (404):
 * {
 *   "success": false,
 *   "error": "Partida no encontrada",
 *   "message": "No existe una partida con ID 123"
 * }
 */
router.get('/:id', GameController.getById);

// 📤 EXPORTAR EL ROUTER PARA QUE EL SERVIDOR PRINCIPAL LO PUEDA USAR
module.exports = router;
