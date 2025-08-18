/**
 * 🏢 MODELO DE UBICACIONES - CYBER SAPO
 * 
 * Este archivo es como un "ESPECIALISTA EN UBICACIONES" que sabe todo sobre:
 * - Cómo registrar nuevas ubicaciones donde instalar máquinas
 * - Cómo buscar y filtrar ubicaciones por país, ciudad, tipo de negocio
 * - Cómo obtener estadísticas de rendimiento por ubicación
 * - Cómo gestionar la información de contacto y detalles de cada lugar
 * 
 * CONEXIÓN CON LA BASE DE DATOS:
 * Este modelo se conecta con la tabla "locations" y se relaciona con:
 * - business_types (tipos de negocio: bar, casino, etc.)
 * - machines (máquinas instaladas en cada ubicación)
 * - games (partidas jugadas en cada ubicación)
 */

const databaseManager = require('../config/database');

/**
 * 🏗️ CLASE MODELO PARA UBICACIONES
 * 
 * Esta clase es como un "ADMINISTRADOR DE UBICACIONES" que maneja
 * todas las operaciones relacionadas con los lugares donde están las máquinas.
 */
class LocationModel {

    /**
     * 🆕 REGISTRAR UNA NUEVA UBICACIÓN EN EL SISTEMA
     * 
     * Cuando queremos instalar máquinas CYBER SAPO en un nuevo lugar:
     * 1. Validamos que todos los datos obligatorios estén presentes
     * 2. Verificamos que el tipo de negocio sea válido
     * 3. Registramos la ubicación en la base de datos
     * 4. Devolvemos la información completa de la nueva ubicación
     * 
     * FLUJO DE DATOS:
     * Panel Admin → Controlador → Este Modelo → Base de Datos
     */
    static async create(locationData) {
        console.log('🏢 LocationModel: Registrando nueva ubicación...');

        // 🔍 VALIDAR DATOS OBLIGATORIOS
        const requiredFields = ['name', 'country', 'city'];
        
        for (const field of requiredFields) {
            if (!locationData[field]) {
                throw new Error(`❌ Campo obligatorio faltante: ${field}`);
            }
        }

        // 🏷️ VERIFICAR QUE EL TIPO DE NEGOCIO EXISTE
        const { business_type = 'other' } = locationData;
        
        const businessTypeExists = await databaseManager.get(
            'SELECT name FROM business_types WHERE name = ? AND active = 1',
            [business_type]
        );

        if (!businessTypeExists) {
            throw new Error(`❌ Tipo de negocio '${business_type}' no válido`);
        }

        // 📝 PREPARAR DATOS CON VALORES POR DEFECTO
        const {
            name,
            country,
            city,
            address = null,
            phone = null,
            email = null,
            description = null,
            latitude = null,
            longitude = null,
            active = 1
        } = locationData;

        try {
            // 💾 INSERTAR LA UBICACIÓN EN LA BASE DE DATOS
            const result = await databaseManager.run(`
                INSERT INTO locations (
                    name, country, city, address, phone, email, 
                    business_type, description, latitude, longitude, active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                name, country, city, address, phone, email,
                business_type, description, latitude, longitude, active
            ]);

            console.log(`✅ Ubicación registrada: ${name} (ID: ${result.lastID}) en ${city}, ${country}`);

            // 🔍 OBTENER LA UBICACIÓN COMPLETA PARA DEVOLVERLA
            const newLocation = await this.findById(result.lastID);
            return newLocation;

        } catch (error) {
            console.error('❌ Error registrando ubicación:', error.message);
            throw error;
        }
    }

    /**
     * 🔍 BUSCAR TODAS LAS UBICACIONES CON FILTROS Y PAGINACIÓN
     * 
     * Esta función permite buscar ubicaciones según diferentes criterios:
     * - Por país específico
     * - Por ciudad específica
     * - Por tipo de negocio (bar, casino, etc.)
     * - Por nombre (búsqueda de texto)
     * - Con información de cuántas máquinas tiene cada ubicación
     * - Con estadísticas de rendimiento
     */
    static async findAll(filters = {}) {
        console.log('🔍 LocationModel: Buscando ubicaciones con filtros:', filters);

        const {
            country,
            city,
            business_type,
            search,
            active = 1,
            page = 1,
            limit = 20
        } = filters;

        // 🏗️ CONSTRUIR LA CONSULTA SQL DINÁMICAMENTE
        let whereClause = 'WHERE l.active = ?';
        let params = [active];

        if (country) {
            whereClause += ' AND l.country = ?';
            params.push(country);
        }

        if (city) {
            whereClause += ' AND l.city = ?';
            params.push(city);
        }

        if (business_type) {
            whereClause += ' AND l.business_type = ?';
            params.push(business_type);
        }

        if (search) {
            whereClause += ' AND (l.name LIKE ? OR l.address LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        // 📄 CALCULAR PAGINACIÓN
        const offset = (page - 1) * limit;

        try {
            // 🔍 CONSULTA PRINCIPAL CON INFORMACIÓN COMPLETA
            // Unimos con business_types para obtener iconos y descripciones
            // Unimos con machines para contar cuántas máquinas hay y sus estados
            const query = `
                SELECT 
                    l.*,
                    bt.icon as business_type_icon,
                    bt.description as business_type_description,
                    COUNT(m.id) as machine_count,
                    SUM(CASE WHEN m.status = 'available' THEN 1 ELSE 0 END) as available_machines,
                    SUM(CASE WHEN m.status = 'occupied' THEN 1 ELSE 0 END) as occupied_machines,
                    SUM(CASE WHEN m.status = 'offline' THEN 1 ELSE 0 END) as offline_machines,
                    -- Estadísticas de rendimiento
                    COALESCE(SUM(m.total_games), 0) as total_games,
                    COALESCE(SUM(m.total_revenue), 0) as total_revenue,
                    COALESCE(SUM(m.total_playtime), 0) as total_playtime
                FROM locations l
                LEFT JOIN business_types bt ON l.business_type = bt.name
                LEFT JOIN machines m ON l.id = m.location_id
                ${whereClause}
                GROUP BY l.id
                ORDER BY l.name
                LIMIT ? OFFSET ?
            `;

            params.push(limit, offset);
            const locations = await databaseManager.query(query, params);

            // 📊 CONTAR TOTAL PARA PAGINACIÓN
            const countQuery = `SELECT COUNT(*) as total FROM locations l ${whereClause}`;
            const countParams = params.slice(0, -2); // Remover limit y offset
            const countResult = await databaseManager.get(countQuery, countParams);

            return {
                locations,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult.total,
                    pages: Math.ceil(countResult.total / limit)
                }
            };

        } catch (error) {
            console.error('❌ Error buscando ubicaciones:', error.message);
            throw error;
        }
    }

    /**
     * 🎯 BUSCAR UNA UBICACIÓN ESPECÍFICA POR ID
     * 
     * Obtiene toda la información detallada de una ubicación específica,
     * incluyendo estadísticas de todas sus máquinas.
     */
    static async findById(locationId) {
        console.log(`🔍 LocationModel: Buscando ubicación ID: ${locationId}`);

        try {
            const query = `
                SELECT 
                    l.*,
                    bt.icon as business_type_icon,
                    bt.description as business_type_description,
                    COUNT(m.id) as machine_count,
                    SUM(CASE WHEN m.status = 'available' THEN 1 ELSE 0 END) as available_machines,
                    SUM(CASE WHEN m.status = 'occupied' THEN 1 ELSE 0 END) as occupied_machines,
                    SUM(CASE WHEN m.status = 'offline' THEN 1 ELSE 0 END) as offline_machines,
                    -- Estadísticas totales
                    COALESCE(SUM(m.total_games), 0) as total_games,
                    COALESCE(SUM(m.total_revenue), 0) as total_revenue,
                    COALESCE(SUM(m.total_playtime), 0) as total_playtime,
                    -- Estadísticas de los últimos 30 días
                    (SELECT COUNT(*) FROM games WHERE location_id = l.id AND started_at >= datetime('now', '-30 days')) as games_last_30_days,
                    (SELECT COALESCE(SUM(revenue), 0) FROM games WHERE location_id = l.id AND started_at >= datetime('now', '-30 days')) as revenue_last_30_days
                FROM locations l
                LEFT JOIN business_types bt ON l.business_type = bt.name
                LEFT JOIN machines m ON l.id = m.location_id
                WHERE l.id = ?
                GROUP BY l.id
            `;

            const location = await databaseManager.get(query, [locationId]);

            if (!location) {
                throw new Error(`Ubicación con ID ${locationId} no encontrada`);
            }

            return location;

        } catch (error) {
            console.error('❌ Error buscando ubicación por ID:', error.message);
            throw error;
        }
    }

    /**
     * ✏️ ACTUALIZAR INFORMACIÓN DE UNA UBICACIÓN
     * 
     * Permite modificar los datos de una ubicación existente:
     * - Información de contacto (teléfono, email)
     * - Dirección
     * - Descripción
     * - Coordenadas GPS
     * - Estado activo/inactivo
     */
    static async update(locationId, updateData) {
        console.log(`✏️ LocationModel: Actualizando ubicación ID: ${locationId}`);

        try {
            // 🔍 VERIFICAR QUE LA UBICACIÓN EXISTE
            const existingLocation = await this.findById(locationId);

            // 🏷️ VERIFICAR TIPO DE NEGOCIO SI SE ESTÁ ACTUALIZANDO
            if (updateData.business_type) {
                const businessTypeExists = await databaseManager.get(
                    'SELECT name FROM business_types WHERE name = ? AND active = 1',
                    [updateData.business_type]
                );

                if (!businessTypeExists) {
                    throw new Error(`❌ Tipo de negocio '${updateData.business_type}' no válido`);
                }
            }

            // 🏗️ CONSTRUIR LA CONSULTA DE ACTUALIZACIÓN DINÁMICAMENTE
            const allowedFields = ['name', 'country', 'city', 'address', 'phone', 'email', 'business_type', 'description', 'latitude', 'longitude', 'active'];
            const updates = [];
            const params = [];

            for (const [key, value] of Object.entries(updateData)) {
                if (allowedFields.includes(key) && value !== undefined) {
                    updates.push(`${key} = ?`);
                    params.push(value);
                }
            }

            if (updates.length === 0) {
                throw new Error('❌ No hay campos válidos para actualizar');
            }

            // Agregar timestamp de actualización
            updates.push('updated_at = CURRENT_TIMESTAMP');
            params.push(locationId);

            // ✏️ EJECUTAR LA ACTUALIZACIÓN
            const result = await databaseManager.run(
                `UPDATE locations SET ${updates.join(', ')} WHERE id = ?`,
                params
            );

            if (result.changes === 0) {
                throw new Error('No se pudo actualizar la ubicación');
            }

            console.log(`✅ Ubicación ${existingLocation.name} actualizada exitosamente`);

            // 🔍 DEVOLVER LA UBICACIÓN ACTUALIZADA
            return await this.findById(locationId);

        } catch (error) {
            console.error('❌ Error actualizando ubicación:', error.message);
            throw error;
        }
    }

    /**
     * 🗑️ DESACTIVAR UNA UBICACIÓN
     * 
     * En lugar de eliminar completamente una ubicación, la marcamos como inactiva.
     * Esto preserva el historial de partidas y estadísticas.
     */
    static async deactivate(locationId) {
        console.log(`🗑️ LocationModel: Desactivando ubicación ID: ${locationId}`);

        try {
            // 🔍 VERIFICAR QUE LA UBICACIÓN EXISTE Y ESTÁ ACTIVA
            const location = await this.findById(locationId);
            
            if (!location.active) {
                throw new Error('La ubicación ya está desactivada');
            }

            // 🎰 VERIFICAR SI HAY MÁQUINAS ACTIVAS
            if (location.machine_count > 0) {
                console.log(`⚠️ Advertencia: La ubicación ${location.name} tiene ${location.machine_count} máquinas. Considera desactivarlas primero.`);
            }

            // 🗑️ MARCAR COMO INACTIVA
            await this.update(locationId, { active: 0 });

            console.log(`✅ Ubicación ${location.name} desactivada exitosamente`);

            return await this.findById(locationId);

        } catch (error) {
            console.error('❌ Error desactivando ubicación:', error.message);
            throw error;
        }
    }

    /**
     * 📊 OBTENER ESTADÍSTICAS DETALLADAS DE UNA UBICACIÓN
     * 
     * Calcula estadísticas completas para una ubicación específica:
     * - Rendimiento de todas sus máquinas
     * - Tendencias de ingresos por día
     * - Distribución de actividad por horas
     * - Tipos de juego más populares
     * - Comparación con otras ubicaciones
     */
    static async getDetailedStats(locationId, period = '30d') {
        console.log(`📊 LocationModel: Calculando estadísticas detalladas para ubicación ${locationId} (período: ${period})`);

        // 🗓️ DETERMINAR FILTRO DE FECHA
        let dateFilter = '';
        switch(period) {
            case '7d':
                dateFilter = "AND g.started_at >= datetime('now', '-7 days')";
                break;
            case '30d':
                dateFilter = "AND g.started_at >= datetime('now', '-30 days')";
                break;
            case '90d':
                dateFilter = "AND g.started_at >= datetime('now', '-90 days')";
                break;
            case '1y':
                dateFilter = "AND g.started_at >= datetime('now', '-1 year')";
                break;
            case 'all':
                dateFilter = '';
                break;
            default:
                dateFilter = "AND g.started_at >= datetime('now', '-30 days')";
        }

        try {
            // 🔍 VERIFICAR QUE LA UBICACIÓN EXISTE
            const location = await this.findById(locationId);

            // 📈 ESTADÍSTICAS GENERALES DE LA UBICACIÓN
            const generalStats = await databaseManager.get(`
                SELECT 
                    COUNT(*) as total_games,
                    COALESCE(SUM(g.revenue), 0) as total_revenue,
                    COALESCE(SUM(g.duration_seconds), 0) as total_playtime,
                    COALESCE(AVG(g.players_count), 0) as avg_players,
                    COALESCE(AVG(g.duration_seconds), 0) as avg_duration,
                    COALESCE(AVG(g.revenue), 0) as avg_revenue,
                    MIN(g.started_at) as first_game,
                    MAX(g.started_at) as last_game
                FROM games g
                WHERE g.location_id = ? ${dateFilter}
            `, [locationId]);

            // 🎰 RENDIMIENTO POR MÁQUINA
            const machinePerformance = await databaseManager.query(`
                SELECT 
                    m.name as machine_name,
                    COUNT(g.id) as games,
                    COALESCE(SUM(g.revenue), 0) as revenue,
                    COALESCE(SUM(g.duration_seconds), 0) as playtime,
                    COALESCE(AVG(g.players_count), 0) as avg_players
                FROM machines m
                LEFT JOIN games g ON m.id = g.machine_id ${dateFilter.replace('g.started_at', 'g.started_at')}
                WHERE m.location_id = ?
                GROUP BY m.id, m.name
                ORDER BY revenue DESC
            `, [locationId]);

            // 📅 TENDENCIA DIARIA
            const dailyTrend = await databaseManager.query(`
                SELECT 
                    DATE(g.started_at) as date,
                    COUNT(*) as games,
                    COALESCE(SUM(g.revenue), 0) as revenue,
                    COUNT(DISTINCT g.machine_id) as active_machines
                FROM games g
                WHERE g.location_id = ? ${dateFilter}
                GROUP BY DATE(g.started_at)
                ORDER BY date
            `, [locationId]);

            // ⏰ DISTRIBUCIÓN POR HORAS
            const hourlyDistribution = await databaseManager.query(`
                SELECT 
                    CAST(strftime('%H', g.started_at) as INTEGER) as hour,
                    COUNT(*) as games,
                    COALESCE(SUM(g.revenue), 0) as revenue
                FROM games g
                WHERE g.location_id = ? ${dateFilter}
                GROUP BY CAST(strftime('%H', g.started_at) as INTEGER)
                ORDER BY hour
            `, [locationId]);

            // 🎮 DISTRIBUCIÓN POR TIPO DE JUEGO
            const gameTypeDistribution = await databaseManager.query(`
                SELECT 
                    g.game_type,
                    COUNT(*) as games,
                    COALESCE(SUM(g.revenue), 0) as revenue,
                    COALESCE(AVG(g.players_count), 0) as avg_players,
                    COALESCE(AVG(g.duration_seconds), 0) as avg_duration
                FROM games g
                WHERE g.location_id = ? ${dateFilter}
                GROUP BY g.game_type
                ORDER BY games DESC
            `, [locationId]);

            return {
                location: location,
                period: period,
                general: generalStats,
                machine_performance: machinePerformance,
                daily_trend: dailyTrend,
                hourly_distribution: hourlyDistribution,
                game_type_distribution: gameTypeDistribution
            };

        } catch (error) {
            console.error('❌ Error calculando estadísticas detalladas de ubicación:', error.message);
            throw error;
        }
    }

    /**
     * 🌍 OBTENER LISTA DE PAÍSES ÚNICOS
     * 
     * Devuelve todos los países donde hay ubicaciones activas.
     * Útil para filtros y formularios.
     */
    static async getCountries() {
        console.log('🌍 LocationModel: Obteniendo lista de países...');

        try {
            const countries = await databaseManager.query(`
                SELECT DISTINCT country 
                FROM locations 
                WHERE active = 1 AND country IS NOT NULL 
                ORDER BY country
            `);

            return countries.map(row => row.country);

        } catch (error) {
            console.error('❌ Error obteniendo países:', error.message);
            throw error;
        }
    }

    /**
     * 🏙️ OBTENER LISTA DE CIUDADES POR PAÍS
     * 
     * Devuelve todas las ciudades de un país específico donde hay ubicaciones.
     */
    static async getCitiesByCountry(country) {
        console.log(`🏙️ LocationModel: Obteniendo ciudades de ${country}...`);

        try {
            const cities = await databaseManager.query(`
                SELECT DISTINCT city 
                FROM locations 
                WHERE active = 1 AND country = ? AND city IS NOT NULL 
                ORDER BY city
            `, [country]);

            return cities.map(row => row.city);

        } catch (error) {
            console.error('❌ Error obteniendo ciudades:', error.message);
            throw error;
        }
    }

    /**
     * 📈 OBTENER RESUMEN GENERAL DE UBICACIONES
     * 
     * Proporciona estadísticas generales de todas las ubicaciones:
     * - Total de ubicaciones por país
     * - Total por tipo de negocio
     * - Ubicaciones más rentables
     * - Distribución geográfica
     */
    static async getSummary() {
        console.log('📈 LocationModel: Calculando resumen general de ubicaciones...');

        try {
            // 🌍 ESTADÍSTICAS POR PAÍS
            const byCountry = await databaseManager.query(`
                SELECT 
                    country, 
                    COUNT(*) as locations,
                    SUM(
                        (SELECT COUNT(*) FROM machines WHERE location_id = l.id)
                    ) as total_machines,
                    SUM(
                        (SELECT COALESCE(SUM(total_revenue), 0) FROM machines WHERE location_id = l.id)
                    ) as total_revenue
                FROM locations l
                WHERE active = 1 AND country IS NOT NULL 
                GROUP BY country 
                ORDER BY locations DESC
            `);

            // 🏢 ESTADÍSTICAS POR TIPO DE NEGOCIO
            const byBusinessType = await databaseManager.query(`
                SELECT 
                    l.business_type,
                    bt.icon,
                    bt.description,
                    COUNT(*) as locations,
                    SUM(
                        (SELECT COUNT(*) FROM machines WHERE location_id = l.id)
                    ) as total_machines,
                    SUM(
                        (SELECT COALESCE(SUM(total_revenue), 0) FROM machines WHERE location_id = l.id)
                    ) as total_revenue
                FROM locations l
                LEFT JOIN business_types bt ON l.business_type = bt.name
                WHERE l.active = 1 
                GROUP BY l.business_type 
                ORDER BY locations DESC
            `);

            // 🏆 TOP 10 UBICACIONES POR INGRESOS
            const topByRevenue = await databaseManager.query(`
                SELECT 
                    l.name,
                    l.city,
                    l.country,
                    l.business_type,
                    COUNT(m.id) as machine_count,
                    COALESCE(SUM(m.total_revenue), 0) as total_revenue,
                    COALESCE(SUM(m.total_games), 0) as total_games
                FROM locations l
                LEFT JOIN machines m ON l.id = m.location_id
                WHERE l.active = 1
                GROUP BY l.id
                ORDER BY total_revenue DESC
                LIMIT 10
            `);

            // 📊 ESTADÍSTICAS GENERALES
            const generalStats = await databaseManager.get(`
                SELECT 
                    COUNT(*) as total_locations,
                    COUNT(DISTINCT country) as total_countries,
                    COUNT(DISTINCT city) as total_cities,
                    (SELECT COUNT(*) FROM machines WHERE location_id IN (SELECT id FROM locations WHERE active = 1)) as total_machines,
                    (SELECT COALESCE(SUM(total_revenue), 0) FROM machines WHERE location_id IN (SELECT id FROM locations WHERE active = 1)) as total_revenue
                FROM locations
                WHERE active = 1
            `);

            return {
                general: generalStats,
                by_country: byCountry,
                by_business_type: byBusinessType,
                top_by_revenue: topByRevenue
            };

        } catch (error) {
            console.error('❌ Error calculando resumen de ubicaciones:', error.message);
            throw error;
        }
    }
}

// 📤 EXPORTAR EL MODELO PARA QUE OTROS ARCHIVOS LO PUEDAN USAR
module.exports = LocationModel;
