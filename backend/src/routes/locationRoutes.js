/**
 * 🏢 RUTAS DE UBICACIONES - CYBER SAPO
 * 
 * Este archivo define todas las rutas (URLs) relacionadas con las ubicaciones donde
 * están instaladas las máquinas CYBER SAPO. Es como un "MAPA DE DIRECCIONES" que
 * le dice al servidor qué hacer cuando recibe peticiones sobre ubicaciones.
 * 
 * FLUJO DE COMUNICACIÓN:
 * 1. Panel Admin envía petición HTTP a una URL (ej: GET /api/locations)
 * 2. Express.js busca en este archivo qué función debe ejecutar
 * 3. Este archivo llama al LocationController correspondiente
 * 4. El LocationController procesa la petición y devuelve respuesta
 * 
 * RUTAS DISPONIBLES:
 * POST   /api/locations              - Registrar nueva ubicación
 * GET    /api/locations              - Obtener lista de ubicaciones con filtros
 * GET    /api/locations/summary      - Obtener resumen general de ubicaciones
 * GET    /api/locations/countries    - Obtener lista de países
 * GET    /api/locations/cities       - Obtener lista de ciudades por país
 * GET    /api/locations/:id          - Obtener detalles de una ubicación específica
 * PUT    /api/locations/:id          - Actualizar información de una ubicación
 * DELETE /api/locations/:id          - Desactivar una ubicación
 * GET    /api/locations/:id/stats    - Obtener estadísticas detalladas de una ubicación
 */

const express = require('express');
const LocationController = require('../controllers/LocationController');

// 🛤️ CREAR UN ROUTER DE EXPRESS
const router = express.Router();

/**
 * 🆕 POST /api/locations - REGISTRAR NUEVA UBICACIÓN
 * 
 * Cuando se quiere instalar máquinas CYBER SAPO en un nuevo lugar.
 * 
 * DATOS ESPERADOS EN EL BODY:
 * {
 *   "name": "Bar El Sapo Dorado",
 *   "country": "España",
 *   "city": "Madrid",
 *   "address": "Calle Mayor 123",          // Opcional
 *   "phone": "+34 91 123 4567",           // Opcional
 *   "email": "info@sapodorado.es",        // Opcional
 *   "business_type": "bar",               // Opcional, default: "other"
 *   "description": "Bar tradicional...",  // Opcional
 *   "latitude": 40.4168,                  // Opcional
 *   "longitude": -3.7038                  // Opcional
 * }
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "success": true,
 *   "message": "Ubicación registrada exitosamente",
 *   "data": {
 *     "id": 1,
 *     "name": "Bar El Sapo Dorado",
 *     "country": "España",
 *     "city": "Madrid",
 *     "business_type": "bar",
 *     "business_type_icon": "🍺",
 *     "machine_count": 0,
 *     "created_at": "2024-01-15T10:00:00.000Z"
 *   }
 * }
 */
router.post('/', LocationController.create);

/**
 * 🔍 GET /api/locations - OBTENER LISTA DE UBICACIONES CON FILTROS
 * 
 * Permite obtener una lista de ubicaciones con diferentes filtros.
 * 
 * PARÁMETROS DE CONSULTA OPCIONALES:
 * - country: Filtrar por país específico
 * - city: Filtrar por ciudad específica
 * - business_type: Filtrar por tipo de negocio (bar, casino, etc.)
 * - search: Búsqueda por nombre o dirección
 * - active: Solo activas (1) o todas (0) - default: 1
 * - page: Número de página (default: 1)
 * - limit: Elementos por página (default: 20, máximo: 100)
 * 
 * EJEMPLO DE USO:
 * GET /api/locations?country=España&business_type=bar&page=1&limit=10
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "success": true,
 *   "message": "5 ubicaciones encontradas",
 *   "data": [
 *     {
 *       "id": 1,
 *       "name": "Bar El Sapo Dorado",
 *       "country": "España",
 *       "city": "Madrid",
 *       "business_type": "bar",
 *       "business_type_icon": "🍺",
 *       "machine_count": 4,
 *       "available_machines": 3,
 *       "occupied_machines": 1,
 *       "offline_machines": 0,
 *       "total_games": 1500,
 *       "total_revenue": 7500.50
 *     }
 *   ],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 10,
 *     "total": 5,
 *     "pages": 1
 *   }
 * }
 */
router.get('/', LocationController.getAll);

/**
 * 📈 GET /api/locations/summary - OBTENER RESUMEN GENERAL
 * 
 * Proporciona estadísticas generales de todas las ubicaciones.
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "success": true,
 *   "message": "Resumen calculado exitosamente",
 *   "data": {
 *     "general": {
 *       "total_locations": 25,
 *       "total_countries": 3,
 *       "total_cities": 8,
 *       "total_machines": 120,
 *       "total_revenue": 150000.75
 *     },
 *     "by_country": [
 *       { "country": "España", "locations": 20, "total_machines": 95, "total_revenue": 120000.50 },
 *       { "country": "Portugal", "locations": 3, "total_machines": 15, "total_revenue": 20000.25 }
 *     ],
 *     "by_business_type": [
 *       { "business_type": "bar", "icon": "🍺", "locations": 12, "total_revenue": 60000.00 },
 *       { "business_type": "casino", "icon": "🎰", "locations": 5, "total_revenue": 50000.00 }
 *     ],
 *     "top_by_revenue": [ ... top 10 ubicaciones más rentables ... ]
 *   }
 * }
 */
router.get('/summary', LocationController.getSummary);

/**
 * 🌍 GET /api/locations/countries - OBTENER LISTA DE PAÍSES
 * 
 * Devuelve todos los países donde hay ubicaciones activas.
 * Útil para filtros y formularios.
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "success": true,
 *   "message": "3 países encontrados",
 *   "data": ["España", "Portugal", "Francia"]
 * }
 */
router.get('/countries', LocationController.getCountries);

/**
 * 🏙️ GET /api/locations/cities - OBTENER LISTA DE CIUDADES POR PAÍS
 * 
 * Devuelve todas las ciudades de un país específico donde hay ubicaciones.
 * 
 * PARÁMETROS DE CONSULTA OBLIGATORIOS:
 * - country: País del cual obtener las ciudades
 * 
 * EJEMPLO DE USO:
 * GET /api/locations/cities?country=España
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "success": true,
 *   "message": "5 ciudades encontradas en España",
 *   "data": ["Madrid", "Barcelona", "Valencia", "Sevilla", "Bilbao"],
 *   "country": "España"
 * }
 */
router.get('/cities', LocationController.getCities);

/**
 * 🎯 GET /api/locations/:id - OBTENER DETALLES DE UNA UBICACIÓN ESPECÍFICA
 * 
 * Devuelve toda la información de una ubicación específica por su ID.
 * 
 * PARÁMETROS DE URL:
 * - id: ID numérico de la ubicación
 * 
 * EJEMPLO DE USO:
 * GET /api/locations/1
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "success": true,
 *   "message": "Ubicación encontrada",
 *   "data": {
 *     "id": 1,
 *     "name": "Bar El Sapo Dorado",
 *     "country": "España",
 *     "city": "Madrid",
 *     "address": "Calle Mayor 123",
 *     "phone": "+34 91 123 4567",
 *     "email": "info@sapodorado.es",
 *     "business_type": "bar",
 *     "business_type_icon": "🍺",
 *     "description": "Bar tradicional en el centro histórico",
 *     "machine_count": 4,
 *     "available_machines": 3,
 *     "occupied_machines": 1,
 *     "offline_machines": 0,
 *     "total_games": 1500,
 *     "total_revenue": 7500.50,
 *     "games_last_30_days": 450,
 *     "revenue_last_30_days": 2250.75,
 *     "created_at": "2024-01-01T10:00:00.000Z"
 *   }
 * }
 */
router.get('/:id', LocationController.getById);

/**
 * ✏️ PUT /api/locations/:id - ACTUALIZAR INFORMACIÓN DE UNA UBICACIÓN
 * 
 * Permite modificar los datos de una ubicación existente.
 * Solo se actualizan los campos que se envían en la petición.
 * 
 * DATOS OPCIONALES EN EL BODY:
 * {
 *   "name": "Nuevo nombre",
 *   "address": "Nueva dirección",
 *   "phone": "Nuevo teléfono",
 *   "email": "nuevo@email.com",
 *   "description": "Nueva descripción",
 *   "latitude": 40.4168,
 *   "longitude": -3.7038,
 *   "active": 1
 * }
 * 
 * EJEMPLO DE USO:
 * PUT /api/locations/1
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "success": true,
 *   "message": "Ubicación actualizada exitosamente",
 *   "data": { ... datos completos de la ubicación actualizada ... }
 * }
 */
router.put('/:id', LocationController.update);

/**
 * 🗑️ DELETE /api/locations/:id - DESACTIVAR UNA UBICACIÓN
 * 
 * En lugar de eliminar completamente una ubicación, la marca como inactiva.
 * Esto preserva el historial de partidas y estadísticas.
 * 
 * EJEMPLO DE USO:
 * DELETE /api/locations/1
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "success": true,
 *   "message": "Ubicación desactivada exitosamente",
 *   "data": { ... datos de la ubicación desactivada ... },
 *   "warning": "Esta ubicación tiene 4 máquinas. Considera desactivarlas también."
 * }
 */
router.delete('/:id', LocationController.deactivate);

/**
 * 📊 GET /api/locations/:id/stats - OBTENER ESTADÍSTICAS DETALLADAS
 * 
 * Calcula estadísticas completas para una ubicación específica.
 * 
 * PARÁMETROS DE CONSULTA OPCIONALES:
 * - period: Período de análisis (7d, 30d, 90d, 1y, all) - default: 30d
 * 
 * EJEMPLO DE USO:
 * GET /api/locations/1/stats?period=90d
 * 
 * RESPUESTA EXITOSA:
 * {
 *   "success": true,
 *   "message": "Estadísticas calculadas exitosamente",
 *   "data": {
 *     "location": { ... información de la ubicación ... },
 *     "period": "90d",
 *     "general": {
 *       "total_games": 1500,
 *       "total_revenue": 7500.50,
 *       "avg_players": 2.3,
 *       "avg_duration": 450,
 *       "first_game": "2024-01-01T10:00:00.000Z",
 *       "last_game": "2024-01-15T14:30:00.000Z"
 *     },
 *     "machine_performance": [
 *       { "machine_name": "CYBER-001", "games": 400, "revenue": 2000.00 },
 *       { "machine_name": "CYBER-002", "games": 380, "revenue": 1900.00 }
 *     ],
 *     "daily_trend": [
 *       { "date": "2024-01-01", "games": 25, "revenue": 125.00, "active_machines": 4 },
 *       { "date": "2024-01-02", "games": 30, "revenue": 150.00, "active_machines": 4 }
 *     ],
 *     "hourly_distribution": [
 *       { "hour": 14, "games": 80, "revenue": 400.00 },
 *       { "hour": 20, "games": 120, "revenue": 600.00 }
 *     ],
 *     "game_type_distribution": [
 *       { "game_type": "individual", "games": 800, "revenue": 3200.00 },
 *       { "game_type": "parejas", "games": 500, "revenue": 3000.00 }
 *     ]
 *   }
 * }
 */
router.get('/:id/stats', LocationController.getStats);

// 📤 EXPORTAR EL ROUTER PARA QUE EL SERVIDOR PRINCIPAL LO PUEDA USAR
module.exports = router;
