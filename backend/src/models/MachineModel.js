/**
 * 🎰 MODELO DE MÁQUINAS - CYBER SAPO
 * 
 * Este archivo es como un "ESPECIALISTA EN MÁQUINAS" que sabe todo sobre:
 * - Cómo registrar nuevas máquinas en el sistema
 * - Cómo buscar y filtrar máquinas
 * - Cómo actualizar el estado de las máquinas (disponible, ocupada, fuera de servicio)
 * - Cómo obtener estadísticas detalladas de cada máquina
 * 
 * CONEXIÓN CON LA BASE DE DATOS:
 * Este modelo se conecta con la tabla "machines" y se relaciona con:
 * - locations (ubicaciones donde están las máquinas)
 * - games (partidas jugadas en cada máquina)
 * - daily_machine_stats (estadísticas diarias)
 * - hourly_machine_stats (estadísticas horarias)
 */

const databaseManager = require('../config/database');

/**
 * 🏗️ CLASE MODELO PARA MÁQUINAS
 * 
 * Esta clase es como un "ADMINISTRADOR DE MÁQUINAS" que maneja
 * todas las operaciones relacionadas con las máquinas CYBER SAPO.
 */
class MachineModel {

    /**
     * 🆕 REGISTRAR UNA NUEVA MÁQUINA EN EL SISTEMA
     * 
     * Cuando se instala una nueva máquina CYBER SAPO en una ubicación:
     * 1. Validamos que todos los datos estén correctos
     * 2. Verificamos que la ubicación exista
     * 3. Generamos un nombre único para la máquina
     * 4. La registramos en la base de datos
     * 
     * FLUJO DE DATOS:
     * Panel Admin → Controlador → Este Modelo → Base de Datos
     */
    static async create(machineData) {
        console.log('🎰 MachineModel: Registrando nueva máquina...');

        // 🔍 VALIDAR DATOS OBLIGATORIOS
        const { location_id, name } = machineData;
        
        if (!location_id) {
            throw new Error('❌ location_id es obligatorio');
        }

        // 🏢 VERIFICAR QUE LA UBICACIÓN EXISTE
        const location = await databaseManager.get(
            'SELECT id, name FROM locations WHERE id = ? AND active = 1',
            [location_id]
        );

        if (!location) {
            throw new Error(`❌ Ubicación con ID ${location_id} no encontrada o inactiva`);
        }

        // 🏷️ GENERAR NOMBRE ÚNICO SI NO SE PROPORCIONA
        let machineName = name;
        if (!machineName) {
            // Contar máquinas existentes para generar el siguiente número
            const count = await databaseManager.get('SELECT COUNT(*) as total FROM machines');
            const nextNumber = (count.total + 1).toString().padStart(3, '0');
            machineName = `CYBER-${nextNumber}`;
        }

        // 📝 PREPARAR DATOS CON VALORES POR DEFECTO
        const {
            status = 'available',
            total_games = 0,
            total_revenue = 0.0,
            total_playtime = 0
        } = machineData;

        try {
            // 💾 INSERTAR LA MÁQUINA EN LA BASE DE DATOS
            const result = await databaseManager.run(`
                INSERT INTO machines (
                    name, location_id, status, total_games, 
                    total_revenue, total_playtime
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
                machineName, location_id, status, total_games,
                total_revenue, total_playtime
            ]);

            console.log(`✅ Máquina registrada: ${machineName} (ID: ${result.lastID}) en ${location.name}`);

            // 🔍 OBTENER LA MÁQUINA COMPLETA PARA DEVOLVERLA
            const newMachine = await this.findById(result.lastID);
            return newMachine;

        } catch (error) {
            console.error('❌ Error registrando máquina:', error.message);
            throw error;
        }
    }

    /**
     * 🔍 BUSCAR TODAS LAS MÁQUINAS CON FILTROS Y PAGINACIÓN
     * 
     * Esta función permite buscar máquinas según diferentes criterios:
     * - Por ubicación específica
     * - Por estado (disponible, ocupada, fuera de servicio)
     * - Por ciudad o país
     * - Con información completa de ubicación y estadísticas
     */
    static async findAll(filters = {}) {
        console.log('🔍 MachineModel: Buscando máquinas con filtros:', filters);

        const {
            location_id,
            status,
            city,
            country,
            search,
            page = 1,
            limit = 20
        } = filters;

        // 🏗️ CONSTRUIR LA CONSULTA SQL DINÁMICAMENTE
        let whereClause = 'WHERE 1=1';
        let params = [];

        if (location_id) {
            whereClause += ' AND m.location_id = ?';
            params.push(location_id);
        }

        if (status) {
            whereClause += ' AND m.status = ?';
            params.push(status);
        }

        if (city) {
            whereClause += ' AND l.city = ?';
            params.push(city);
        }

        if (country) {
            whereClause += ' AND l.country = ?';
            params.push(country);
        }

        if (search) {
            whereClause += ' AND (m.name LIKE ? OR l.name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        // 📄 CALCULAR PAGINACIÓN
        const offset = (page - 1) * limit;

        try {
            // 🔍 CONSULTA PRINCIPAL CON INFORMACIÓN COMPLETA
            // Unimos con locations para obtener información de la ubicación
            // Calculamos estadísticas adicionales como promedios
            const query = `
                SELECT 
                    m.*,
                    l.name as location_name,
                    l.city,
                    l.country,
                    l.address,
                    l.business_type,
                    bt.icon as business_type_icon,
                    bt.description as business_type_description,
                    -- Calcular estadísticas adicionales
                    CASE 
                        WHEN m.total_games > 0 THEN ROUND(m.total_revenue / m.total_games, 2)
                        ELSE 0 
                    END as avg_revenue_per_game,
                    CASE 
                        WHEN m.total_games > 0 THEN ROUND(m.total_playtime / m.total_games, 2)
                        ELSE 0 
                    END as avg_duration_per_game,
                    ROUND(m.total_playtime / 3600.0, 2) as total_hours_played
                FROM machines m
                LEFT JOIN locations l ON m.location_id = l.id
                LEFT JOIN business_types bt ON l.business_type = bt.name
                ${whereClause}
                ORDER BY m.name
                LIMIT ? OFFSET ?
            `;

            params.push(limit, offset);
            const machines = await databaseManager.query(query, params);

            // 📊 CONTAR TOTAL PARA PAGINACIÓN
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM machines m
                LEFT JOIN locations l ON m.location_id = l.id
                ${whereClause}
            `;
            const countParams = params.slice(0, -2); // Remover limit y offset
            const countResult = await databaseManager.get(countQuery, countParams);

            return {
                machines,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult.total,
                    pages: Math.ceil(countResult.total / limit)
                }
            };

        } catch (error) {
            console.error('❌ Error buscando máquinas:', error.message);
            throw error;
        }
    }

    /**
     * 🎯 BUSCAR UNA MÁQUINA ESPECÍFICA POR ID
     * 
     * Obtiene toda la información detallada de una máquina específica,
     * incluyendo datos de ubicación y estadísticas calculadas.
     */
    static async findById(machineId) {
        console.log(`🔍 MachineModel: Buscando máquina ID: ${machineId}`);

        try {
            const query = `
                SELECT 
                    m.*,
                    l.name as location_name,
                    l.city,
                    l.country,
                    l.address,
                    l.phone,
                    l.email,
                    l.business_type,
                    bt.icon as business_type_icon,
                    bt.description as business_type_description,
                    -- Estadísticas calculadas
                    CASE 
                        WHEN m.total_games > 0 THEN ROUND(m.total_revenue / m.total_games, 2)
                        ELSE 0 
                    END as avg_revenue_per_game,
                    CASE 
                        WHEN m.total_games > 0 THEN ROUND(m.total_playtime / m.total_games, 2)
                        ELSE 0 
                    END as avg_duration_per_game,
                    ROUND(m.total_playtime / 3600.0, 2) as total_hours_played,
                    -- Estadísticas de los últimos 30 días
                    (SELECT COUNT(*) FROM games WHERE machine_id = m.id AND started_at >= datetime('now', '-30 days')) as games_last_30_days,
                    (SELECT COALESCE(SUM(revenue), 0) FROM games WHERE machine_id = m.id AND started_at >= datetime('now', '-30 days')) as revenue_last_30_days
                FROM machines m
                LEFT JOIN locations l ON m.location_id = l.id
                LEFT JOIN business_types bt ON l.business_type = bt.name
                WHERE m.id = ?
            `;

            const machine = await databaseManager.get(query, [machineId]);

            if (!machine) {
                throw new Error(`Máquina con ID ${machineId} no encontrada`);
            }

            return machine;

        } catch (error) {
            console.error('❌ Error buscando máquina por ID:', error.message);
            throw error;
        }
    }

    /**
     * 🔄 ACTUALIZAR EL ESTADO DE UNA MÁQUINA
     * 
     * Cambia el estado de una máquina entre:
     * - 'available' (disponible para jugar)
     * - 'occupied' (alguien está jugando)
     * - 'offline' (fuera de servicio)
     * 
     * FLUJO TÍPICO:
     * 1. Jugador empieza partida → estado cambia a 'occupied'
     * 2. Jugador termina partida → estado cambia a 'available'
     * 3. Mantenimiento → estado cambia a 'offline'
     */
    static async updateStatus(machineId, newStatus) {
        console.log(`🔄 MachineModel: Actualizando estado de máquina ${machineId} a '${newStatus}'`);

        // 🔍 VALIDAR ESTADO
        const validStatuses = ['available', 'occupied', 'offline'];
        if (!validStatuses.includes(newStatus)) {
            throw new Error(`❌ Estado inválido: ${newStatus}. Estados válidos: ${validStatuses.join(', ')}`);
        }

        try {
            // 🔍 VERIFICAR QUE LA MÁQUINA EXISTE
            const machine = await this.findById(machineId);
            if (!machine) {
                throw new Error(`Máquina con ID ${machineId} no encontrada`);
            }

            // 🔄 ACTUALIZAR EL ESTADO
            const result = await databaseManager.run(
                'UPDATE machines SET status = ? WHERE id = ?',
                [newStatus, machineId]
            );

            if (result.changes === 0) {
                throw new Error('No se pudo actualizar el estado de la máquina');
            }

            console.log(`✅ Estado de máquina ${machine.name} actualizado: ${machine.status} → ${newStatus}`);

            // 🔍 DEVOLVER LA MÁQUINA ACTUALIZADA
            return await this.findById(machineId);

        } catch (error) {
            console.error('❌ Error actualizando estado de máquina:', error.message);
            throw error;
        }
    }

    /**
     * 📊 OBTENER ESTADÍSTICAS DETALLADAS DE UNA MÁQUINA
     * 
     * Calcula estadísticas completas para una máquina específica:
     * - Estadísticas generales (totales, promedios)
     * - Tendencias diarias
     * - Distribución por horas del día
     * - Distribución por días de la semana
     * - Tipos de juego más populares
     * - Partidas recientes
     */
    static async getDetailedStats(machineId, period = '30d') {
        console.log(`📊 MachineModel: Calculando estadísticas detalladas para máquina ${machineId} (período: ${period})`);

        // 🗓️ DETERMINAR FILTRO DE FECHA SEGÚN EL PERÍODO
        let dateFilter = '';
        switch(period) {
            case '7d':
                dateFilter = "AND started_at >= datetime('now', '-7 days')";
                break;
            case '30d':
                dateFilter = "AND started_at >= datetime('now', '-30 days')";
                break;
            case '90d':
                dateFilter = "AND started_at >= datetime('now', '-90 days')";
                break;
            case '1y':
                dateFilter = "AND started_at >= datetime('now', '-1 year')";
                break;
            case 'all':
                dateFilter = '';
                break;
            default:
                dateFilter = "AND started_at >= datetime('now', '-30 days')";
        }

        try {
            // 🔍 VERIFICAR QUE LA MÁQUINA EXISTE
            const machine = await this.findById(machineId);

            // 📈 ESTADÍSTICAS GENERALES
            const generalStats = await databaseManager.get(`
                SELECT 
                    COUNT(*) as total_games,
                    COALESCE(SUM(revenue), 0) as total_revenue,
                    COALESCE(SUM(duration_seconds), 0) as total_playtime,
                    COALESCE(AVG(players_count), 0) as avg_players,
                    COALESCE(AVG(duration_seconds), 0) as avg_duration,
                    COALESCE(AVG(revenue), 0) as avg_revenue,
                    MIN(started_at) as first_game,
                    MAX(started_at) as last_game
                FROM games 
                WHERE machine_id = ? ${dateFilter}
            `, [machineId]);

            // 📅 TENDENCIA DIARIA DE INGRESOS
            const dailyRevenue = await databaseManager.query(`
                SELECT 
                    DATE(started_at) as date,
                    COUNT(*) as games,
                    COALESCE(SUM(revenue), 0) as revenue,
                    COALESCE(SUM(duration_seconds), 0) as playtime
                FROM games 
                WHERE machine_id = ? ${dateFilter}
                GROUP BY DATE(started_at)
                ORDER BY date
            `, [machineId]);

            // ⏰ DISTRIBUCIÓN POR HORAS DEL DÍA
            const hourlyDistribution = await databaseManager.query(`
                SELECT 
                    CAST(strftime('%H', started_at) as INTEGER) as hour,
                    COUNT(*) as games,
                    COALESCE(SUM(revenue), 0) as revenue
                FROM games 
                WHERE machine_id = ? ${dateFilter}
                GROUP BY CAST(strftime('%H', started_at) as INTEGER)
                ORDER BY hour
            `, [machineId]);

            // 📅 DISTRIBUCIÓN POR DÍAS DE LA SEMANA
            const weeklyDistribution = await databaseManager.query(`
                SELECT 
                    CASE CAST(strftime('%w', started_at) as INTEGER)
                        WHEN 0 THEN 'Domingo'
                        WHEN 1 THEN 'Lunes'
                        WHEN 2 THEN 'Martes'
                        WHEN 3 THEN 'Miércoles'
                        WHEN 4 THEN 'Jueves'
                        WHEN 5 THEN 'Viernes'
                        WHEN 6 THEN 'Sábado'
                    END as day_name,
                    CAST(strftime('%w', started_at) as INTEGER) as day_number,
                    COUNT(*) as games,
                    COALESCE(SUM(revenue), 0) as revenue,
                    COALESCE(AVG(duration_seconds), 0) as avg_duration
                FROM games 
                WHERE machine_id = ? ${dateFilter}
                GROUP BY CAST(strftime('%w', started_at) as INTEGER)
                ORDER BY day_number
            `, [machineId]);

            // 🎮 DISTRIBUCIÓN POR TIPO DE JUEGO
            const gameTypeDistribution = await databaseManager.query(`
                SELECT 
                    game_type,
                    COUNT(*) as games,
                    COALESCE(SUM(revenue), 0) as revenue,
                    COALESCE(AVG(players_count), 0) as avg_players,
                    COALESCE(AVG(duration_seconds), 0) as avg_duration
                FROM games 
                WHERE machine_id = ? ${dateFilter}
                GROUP BY game_type
                ORDER BY games DESC
            `, [machineId]);

            // 🏆 TOP 10 PARTIDAS MÁS LARGAS
            const longestGames = await databaseManager.query(`
                SELECT 
                    started_at,
                    duration_seconds,
                    players_count,
                    game_type,
                    revenue,
                    winner_score
                FROM games 
                WHERE machine_id = ? ${dateFilter}
                ORDER BY duration_seconds DESC
                LIMIT 10
            `, [machineId]);

            // 🕒 PARTIDAS RECIENTES
            const recentGames = await databaseManager.query(`
                SELECT 
                    started_at,
                    ended_at,
                    duration_seconds,
                    players_count,
                    game_type,
                    revenue,
                    winner_score,
                    total_score
                FROM games 
                WHERE machine_id = ? ${dateFilter}
                ORDER BY started_at DESC
                LIMIT 20
            `, [machineId]);

            return {
                machine: machine,
                period: period,
                general: generalStats,
                daily_revenue: dailyRevenue,
                hourly_distribution: hourlyDistribution,
                weekly_distribution: weeklyDistribution,
                game_type_distribution: gameTypeDistribution,
                longest_games: longestGames,
                recent_games: recentGames
            };

        } catch (error) {
            console.error('❌ Error calculando estadísticas detalladas:', error.message);
            throw error;
        }
    }

    /**
     * 📈 OBTENER RESUMEN DE TODAS LAS MÁQUINAS
     * 
     * Proporciona un resumen general del estado de todas las máquinas:
     * - Cuántas están disponibles, ocupadas, fuera de servicio
     * - Totales generales de ingresos y partidas
     * - Máquinas más y menos activas
     */
    static async getSummary() {
        console.log('📈 MachineModel: Calculando resumen general de máquinas...');

        try {
            // 📊 ESTADÍSTICAS POR ESTADO
            const statusStats = await databaseManager.query(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM machines
                GROUP BY status
                ORDER BY count DESC
            `);

            // 💰 ESTADÍSTICAS GENERALES
            const generalStats = await databaseManager.get(`
                SELECT 
                    COUNT(*) as total_machines,
                    COALESCE(SUM(total_games), 0) as total_games,
                    COALESCE(SUM(total_revenue), 0) as total_revenue,
                    COALESCE(SUM(total_playtime), 0) as total_playtime,
                    COALESCE(AVG(total_revenue), 0) as avg_revenue_per_machine
                FROM machines
            `);

            // 🏆 TOP 5 MÁQUINAS POR INGRESOS
            const topByRevenue = await databaseManager.query(`
                SELECT 
                    m.name,
                    m.total_revenue,
                    m.total_games,
                    l.name as location_name,
                    l.city
                FROM machines m
                LEFT JOIN locations l ON m.location_id = l.id
                ORDER BY m.total_revenue DESC
                LIMIT 5
            `);

            // 🎮 TOP 5 MÁQUINAS POR PARTIDAS
            const topByGames = await databaseManager.query(`
                SELECT 
                    m.name,
                    m.total_games,
                    m.total_revenue,
                    l.name as location_name,
                    l.city
                FROM machines m
                LEFT JOIN locations l ON m.location_id = l.id
                ORDER BY m.total_games DESC
                LIMIT 5
            `);

            return {
                by_status: statusStats,
                general: generalStats,
                top_by_revenue: topByRevenue,
                top_by_games: topByGames
            };

        } catch (error) {
            console.error('❌ Error calculando resumen de máquinas:', error.message);
            throw error;
        }
    }
}

// 📤 EXPORTAR EL MODELO PARA QUE OTROS ARCHIVOS LO PUEDAN USAR
module.exports = MachineModel;
