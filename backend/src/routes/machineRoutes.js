/**
 * 🎰 RUTAS DE MÁQUINAS - CYBER SAPO
 * 
 * Este archivo define todas las rutas (URLs) relacionadas con las máquinas del juego.
 * Es como un "MAPA DE DIRECCIONES" que le dice al servidor qué hacer cuando
 * recibe peticiones sobre máquinas.
 * 
 * FLUJO DE COMUNICACIÓN:
 * 1. Panel Admin/Frontend envía petición HTTP a una URL (ej: GET /api/machines)
 * 2. Express.js busca en este archivo qué función debe ejecutar
 * 3. Este archivo llama al MachineController correspondiente
 * 4. El MachineController procesa la petición y devuelve respuesta
 * 
 * RUTAS DISPONIBLES:
 * POST   /api/machines              - Registrar nueva máquina
 * GET    /api/machines              - Obtener lista de máquinas con filtros
 * GET    /api/machines/summary      - Obtener resumen general de máquinas
 * GET    /api/machines/:id          - Obtener detalles de una máquina específica
 * GET    /api/machines/:id/status   - Obtener estado actual de una máquina
 * PUT    /api/machines/:id/status   - Cambiar estado de una máquina
 * GET    /api/machines/:id/stats    - Obtener estadísticas detalladas de una máquina
 */

const express = require('express');
const MachineController = require('../controllers/MachineController');

// 🛤️ CREAR UN ROUTER DE EXPRESS
const router = express.Router();

/**
 * 🆕 POST /api/machines - REGISTRAR NUEVA MÁQUINA
 * 
 * Cuando se instala una nueva máquina CYBER SAPO en una ubicación.
 * 
 * DATOS ESPERADOS EN EL BODY:
 * {
 *   "location_id": 1,
 *   "name": "CYBER-001",        // Opcional, se genera automáticamente
 *   "status": "available"       // Opcional, default: "available"
 * }
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "success": true,
 *   "message": "Máquina registrada exitosamente",
 *   "data": {
 *     "id": 1,
 *     "name": "CYBER-001",
 *     "location_id": 1,
 *     "location_name": "Bar El Sapo Dorado",
 *     "status": "available",
 *     "total_games": 0,
 *     "total_revenue": 0,
 *     "created_at": "2024-01-15T10:00:00.000Z"
 *   }
 * }
 */
router.post('/', MachineController.create);

/**
 * 🔍 GET /api/machines - OBTENER LISTA DE MÁQUINAS CON FILTROS
 * 
 * Permite obtener una lista de máquinas con diferentes filtros.
 * 
 * PARÁMETROS DE CONSULTA OPCIONALES:
 * - location_id: Filtrar por ubicación específica
 * - status: Filtrar por estado (available, occupied, offline)
 * - city: Filtrar por ciudad
 * - country: Filtrar por país
 * - search: Búsqueda por nombre de máquina o ubicación
 * - page: Número de página (default: 1)
 * - limit: Elementos por página (default: 20, máximo: 100)
 * 
 * EJEMPLO DE USO:
 * GET /api/machines?status=available&city=Madrid&page=1&limit=10
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "success": true,
 *   "message": "8 máquinas encontradas",
 *   "data": [
 *     {
 *       "id": 1,
 *       "name": "CYBER-001",
 *       "status": "available",
 *       "location_name": "Bar El Sapo Dorado",
 *       "city": "Madrid",
 *       "country": "España",
 *       "total_games": 150,
 *       "total_revenue": 750.50,
 *       "avg_revenue_per_game": 5.00
 *     }
 *   ],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 10,
 *     "total": 8,
 *     "pages": 1
 *   }
 * }
 */
router.get('/', MachineController.getAll);

/**
 * 📈 GET /api/machines/summary - OBTENER RESUMEN GENERAL
 * 
 * Proporciona un resumen del estado de todas las máquinas.
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "success": true,
 *   "message": "Resumen calculado exitosamente",
 *   "data": {
 *     "by_status": [
 *       { "status": "available", "count": 45 },
 *       { "status": "occupied", "count": 8 },
 *       { "status": "offline", "count": 2 }
 *     ],
 *     "general": {
 *       "total_machines": 55,
 *       "total_games": 15000,
 *       "total_revenue": 75000.50,
 *       "avg_revenue_per_machine": 1363.64
 *     },
 *     "top_by_revenue": [ ... top 5 máquinas más rentables ... ],
 *     "top_by_games": [ ... top 5 máquinas con más partidas ... ]
 *   }
 * }
 */
router.get('/summary', MachineController.getSummary);

/**
 * 🎯 GET /api/machines/:id - OBTENER DETALLES DE UNA MÁQUINA ESPECÍFICA
 * 
 * Devuelve toda la información de una máquina específica por su ID.
 * 
 * PARÁMETROS DE URL:
 * - id: ID numérico de la máquina
 * 
 * EJEMPLO DE USO:
 * GET /api/machines/1
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "success": true,
 *   "message": "Máquina encontrada",
 *   "data": {
 *     "id": 1,
 *     "name": "CYBER-001",
 *     "status": "available",
 *     "location_name": "Bar El Sapo Dorado",
 *     "city": "Madrid",
 *     "country": "España",
 *     "address": "Calle Mayor 123",
 *     "business_type": "bar",
 *     "total_games": 150,
 *     "total_revenue": 750.50,
 *     "total_playtime": 67500,
 *     "avg_revenue_per_game": 5.00,
 *     "total_hours_played": 18.75,
 *     "games_last_30_days": 45,
 *     "revenue_last_30_days": 225.00,
 *     "last_game_at": "2024-01-15T14:30:00.000Z"
 *   }
 * }
 */
router.get('/:id', MachineController.getById);

/**
 * 🔧 GET /api/machines/:id/status - OBTENER ESTADO ACTUAL DE UNA MÁQUINA
 * 
 * Devuelve solo el estado actual de una máquina.
 * Útil para el frontend del juego para verificar disponibilidad.
 * 
 * EJEMPLO DE USO:
 * GET /api/machines/1/status
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "success": true,
 *   "message": "Estado obtenido exitosamente",
 *   "data": {
 *     "id": 1,
 *     "name": "CYBER-001",
 *     "status": "available",
 *     "location_name": "Bar El Sapo Dorado",
 *     "last_game_at": "2024-01-15T14:30:00.000Z",
 *     "available": true
 *   }
 * }
 */
router.get('/:id/status', MachineController.getStatus);

/**
 * 🔄 PUT /api/machines/:id/status - CAMBIAR ESTADO DE UNA MÁQUINA
 * 
 * Permite cambiar el estado de una máquina entre available, occupied, offline.
 * 
 * DATOS ESPERADOS EN EL BODY:
 * {
 *   "status": "occupied"
 * }
 * 
 * ESTADOS VÁLIDOS:
 * - "available": Disponible para jugar
 * - "occupied": Alguien está jugando
 * - "offline": Fuera de servicio (mantenimiento)
 * 
 * EJEMPLO DE USO:
 * PUT /api/machines/1/status
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "success": true,
 *   "message": "Estado de máquina actualizado a 'occupied'",
 *   "data": { ... datos completos de la máquina actualizada ... },
 *   "new_status": "occupied"
 * }
 */
router.put('/:id/status', MachineController.updateStatus);

/**
 * 📊 GET /api/machines/:id/stats - OBTENER ESTADÍSTICAS DETALLADAS
 * 
 * Calcula estadísticas completas para una máquina específica.
 * 
 * PARÁMETROS DE CONSULTA OPCIONALES:
 * - period: Período de análisis (7d, 30d, 90d, 1y, all) - default: 30d
 * 
 * EJEMPLO DE USO:
 * GET /api/machines/1/stats?period=90d
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "success": true,
 *   "message": "Estadísticas calculadas exitosamente",
 *   "data": {
 *     "machine": { ... información de la máquina ... },
 *     "period": "90d",
 *     "general": {
 *       "total_games": 150,
 *       "total_revenue": 750.50,
 *       "avg_players": 2.3,
 *       "avg_duration": 450,
 *       "first_game": "2024-01-01T10:00:00.000Z",
 *       "last_game": "2024-01-15T14:30:00.000Z"
 *     },
 *     "daily_revenue": [
 *       { "date": "2024-01-01", "games": 8, "revenue": 40.00 },
 *       { "date": "2024-01-02", "games": 12, "revenue": 60.00 }
 *     ],
 *     "hourly_distribution": [
 *       { "hour": 14, "games": 15, "revenue": 75.00 },
 *       { "hour": 20, "games": 25, "revenue": 125.00 }
 *     ],
 *     "weekly_distribution": [
 *       { "day_name": "Lunes", "games": 20, "revenue": 100.00 },
 *       { "day_name": "Viernes", "games": 35, "revenue": 175.00 }
 *     ],
 *     "game_type_distribution": [
 *       { "game_type": "individual", "games": 80, "revenue": 320.00 },
 *       { "game_type": "parejas", "games": 50, "revenue": 300.00 }
 *     ],
 *     "longest_games": [ ... top 10 partidas más largas ... ],
 *     "recent_games": [ ... 20 partidas más recientes ... ]
 *   }
 * }
 */
router.get('/:id/stats', MachineController.getStats);

// 📤 EXPORTAR EL ROUTER PARA QUE EL SERVIDOR PRINCIPAL LO PUEDA USAR
module.exports = router;
