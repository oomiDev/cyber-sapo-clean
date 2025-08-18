/**
 * 🎮 MODELO DE PARTIDAS - CYBER SAPO
 * 
 * Este archivo es como un "ESPECIALISTA EN PARTIDAS" que sabe todo sobre:
 * - Cómo guardar una partida nueva en la base de datos
 * - Cómo buscar partidas anteriores
 * - Cómo calcular estadísticas de las partidas
 * - Cómo validar que los datos de una partida sean correctos
 * 
 * CONEXIÓN CON LA BASE DE DATOS:
 * Este modelo se conecta directamente con la tabla "games" en la base de datos.
 * Cada función aquí traduce las peticiones de JavaScript a consultas SQL.
 */

const databaseManager = require('../config/database');

/**
 * 🏗️ CLASE MODELO PARA PARTIDAS
 * 
 * Esta clase es como un "ADMINISTRADOR DE PARTIDAS" que maneja
 * todas las operaciones relacionadas con las partidas del juego.
 */
class GameModel {
    
    /**
     * 💾 GUARDAR UNA NUEVA PARTIDA EN LA BASE DE DATOS
     * 
     * Cuando alguien termina de jugar una partida, esta función:
     * 1. Recibe todos los datos de la partida
     * 2. Los valida para asegurar que estén correctos
     * 3. Los guarda en la tabla "games" de la base de datos
     * 4. Actualiza las estadísticas de la máquina
     * 
     * FLUJO DE DATOS:
     * Frontend → Controlador → Este Modelo → Base de Datos
     */
    static async create(gameData) {
        console.log('🎮 GameModel: Guardando nueva partida...');
        
        // 🔍 VALIDAR DATOS OBLIGATORIOS
        // Es como revisar que tenemos toda la información necesaria
        const requiredFields = ['machine_id', 'location_id', 'players_count', 'game_type', 'duration_seconds', 'revenue'];
        
        for (const field of requiredFields) {
            if (!gameData[field]) {
                throw new Error(`❌ Campo obligatorio faltante: ${field}`);
            }
        }

        // 📝 PREPARAR LOS DATOS PARA LA BASE DE DATOS
        // Establecer valores por defecto si no se proporcionan
        const {
            machine_id,
            location_id,
            players_count,
            game_type = 'individual',
            duration_seconds,
            revenue,
            credits_used = 1,
            winner_score = null,
            total_score = null,
            started_at = new Date().toISOString(),
            ended_at = null
        } = gameData;

        // Si no se proporciona ended_at, calcularlo basado en started_at + duration
        const finalEndedAt = ended_at || new Date(new Date(started_at).getTime() + (duration_seconds * 1000)).toISOString();

        try {
            // 💾 INSERTAR LA PARTIDA EN LA BASE DE DATOS
            // Esta consulta SQL guarda todos los datos de la partida
            const result = await databaseManager.run(`
                INSERT INTO games (
                    machine_id, location_id, players_count, game_type, 
                    duration_seconds, revenue, credits_used, winner_score, 
                    total_score, started_at, ended_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                machine_id, location_id, players_count, game_type,
                duration_seconds, revenue, credits_used, winner_score,
                total_score, started_at, finalEndedAt
            ]);

            console.log(`✅ Partida guardada con ID: ${result.lastID}`);

            // 📊 ACTUALIZAR ESTADÍSTICAS DE LA MÁQUINA
            // Cada vez que se juega una partida, actualizamos los totales de la máquina
            await this.updateMachineStats(machine_id);

            // 📈 GENERAR ESTADÍSTICAS DIARIAS Y HORARIAS
            await this.updateDailyStats(machine_id, location_id, started_at);
            await this.updateHourlyStats(machine_id, location_id, started_at);

            return {
                id: result.lastID,
                ...gameData,
                ended_at: finalEndedAt,
                created_at: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error guardando partida:', error.message);
            throw error;
        }
    }

    /**
     * 🔍 BUSCAR PARTIDAS CON FILTROS
     * 
     * Esta función permite buscar partidas según diferentes criterios:
     * - Por máquina específica
     * - Por ubicación
     * - Por rango de fechas
     * - Por tipo de juego
     * - Con paginación (mostrar de a 20, por ejemplo)
     */
    static async findAll(filters = {}) {
        console.log('🔍 GameModel: Buscando partidas con filtros:', filters);

        const {
            machine_id,
            location_id,
            game_type,
            start_date,
            end_date,
            page = 1,
            limit = 20
        } = filters;

        // 🏗️ CONSTRUIR LA CONSULTA SQL DINÁMICAMENTE
        // Empezamos con la consulta base y agregamos filtros según lo que se necesite
        let whereClause = 'WHERE 1=1'; // Truco: 1=1 siempre es verdadero, facilita agregar más condiciones
        let params = [];

        // Agregar filtros uno por uno
        if (machine_id) {
            whereClause += ' AND g.machine_id = ?';
            params.push(machine_id);
        }

        if (location_id) {
            whereClause += ' AND g.location_id = ?';
            params.push(location_id);
        }

        if (game_type) {
            whereClause += ' AND g.game_type = ?';
            params.push(game_type);
        }

        if (start_date) {
            whereClause += ' AND DATE(g.started_at) >= ?';
            params.push(start_date);
        }

        if (end_date) {
            whereClause += ' AND DATE(g.started_at) <= ?';
            params.push(end_date);
        }

        // 📄 CALCULAR PAGINACIÓN
        const offset = (page - 1) * limit;

        try {
            // 🔍 CONSULTA PRINCIPAL CON INFORMACIÓN ADICIONAL
            // Unimos (JOIN) con las tablas de máquinas y ubicaciones para obtener más información
            const query = `
                SELECT 
                    g.*,
                    m.name as machine_name,
                    l.name as location_name,
                    l.city,
                    l.country
                FROM games g
                LEFT JOIN machines m ON g.machine_id = m.id
                LEFT JOIN locations l ON g.location_id = l.id
                ${whereClause}
                ORDER BY g.started_at DESC
                LIMIT ? OFFSET ?
            `;

            params.push(limit, offset);
            const games = await databaseManager.query(query, params);

            // 📊 CONTAR TOTAL DE RESULTADOS PARA PAGINACIÓN
            const countQuery = `SELECT COUNT(*) as total FROM games g ${whereClause}`;
            const countParams = params.slice(0, -2); // Remover limit y offset
            const countResult = await databaseManager.get(countQuery, countParams);

            return {
                games,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult.total,
                    pages: Math.ceil(countResult.total / limit)
                }
            };

        } catch (error) {
            console.error('❌ Error buscando partidas:', error.message);
            throw error;
        }
    }

    /**
     * 🎯 BUSCAR UNA PARTIDA ESPECÍFICA POR ID
     * 
     * Cuando necesitamos los detalles completos de una partida específica.
     */
    static async findById(gameId) {
        console.log(`🔍 GameModel: Buscando partida ID: ${gameId}`);

        try {
            const query = `
                SELECT 
                    g.*,
                    m.name as machine_name,
                    l.name as location_name,
                    l.city,
                    l.country,
                    l.address
                FROM games g
                LEFT JOIN machines m ON g.machine_id = m.id
                LEFT JOIN locations l ON g.location_id = l.id
                WHERE g.id = ?
            `;

            const game = await databaseManager.get(query, [gameId]);
            
            if (!game) {
                throw new Error(`Partida con ID ${gameId} no encontrada`);
            }

            return game;

        } catch (error) {
            console.error('❌ Error buscando partida por ID:', error.message);
            throw error;
        }
    }

    /**
     * 📊 OBTENER ESTADÍSTICAS DE PARTIDAS
     * 
     * Esta función calcula estadísticas útiles como:
     * - Total de partidas jugadas
     * - Ingresos totales
     * - Tiempo total de juego
     * - Promedios por partida
     * - Distribución por tipo de juego
     */
    static async getStats(filters = {}) {
        console.log('📊 GameModel: Calculando estadísticas...');

        const { machine_id, location_id, start_date, end_date } = filters;

        // Construir filtros para las consultas
        let whereClause = 'WHERE 1=1';
        let params = [];

        if (machine_id) {
            whereClause += ' AND machine_id = ?';
            params.push(machine_id);
        }

        if (location_id) {
            whereClause += ' AND location_id = ?';
            params.push(location_id);
        }

        if (start_date) {
            whereClause += ' AND DATE(started_at) >= ?';
            params.push(start_date);
        }

        if (end_date) {
            whereClause += ' AND DATE(started_at) <= ?';
            params.push(end_date);
        }

        try {
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
                ${whereClause}
            `, params);

            // 🎮 DISTRIBUCIÓN POR TIPO DE JUEGO
            const gameTypeStats = await databaseManager.query(`
                SELECT 
                    game_type,
                    COUNT(*) as games,
                    COALESCE(SUM(revenue), 0) as revenue,
                    COALESCE(AVG(players_count), 0) as avg_players,
                    COALESCE(AVG(duration_seconds), 0) as avg_duration
                FROM games 
                ${whereClause}
                GROUP BY game_type
                ORDER BY games DESC
            `, params);

            // ⏰ DISTRIBUCIÓN POR HORAS DEL DÍA
            const hourlyStats = await databaseManager.query(`
                SELECT 
                    CAST(strftime('%H', started_at) as INTEGER) as hour,
                    COUNT(*) as games,
                    COALESCE(SUM(revenue), 0) as revenue
                FROM games 
                ${whereClause}
                GROUP BY CAST(strftime('%H', started_at) as INTEGER)
                ORDER BY hour
            `, params);

            return {
                general: generalStats,
                by_game_type: gameTypeStats,
                by_hour: hourlyStats
            };

        } catch (error) {
            console.error('❌ Error calculando estadísticas:', error.message);
            throw error;
        }
    }

    /**
     * 📊 ACTUALIZAR ESTADÍSTICAS DE UNA MÁQUINA
     * 
     * Cada vez que se juega una partida, actualizamos los totales de la máquina:
     * - Total de partidas jugadas
     * - Ingresos totales
     * - Tiempo total de juego
     * - Fecha de la última partida
     */
    static async updateMachineStats(machineId) {
        console.log(`📊 Actualizando estadísticas de máquina ${machineId}...`);

        try {
            await databaseManager.run(`
                UPDATE machines 
                SET 
                    total_games = (
                        SELECT COUNT(*) 
                        FROM games 
                        WHERE machine_id = ?
                    ),
                    total_revenue = (
                        SELECT COALESCE(SUM(revenue), 0) 
                        FROM games 
                        WHERE machine_id = ?
                    ),
                    total_playtime = (
                        SELECT COALESCE(SUM(duration_seconds), 0) 
                        FROM games 
                        WHERE machine_id = ?
                    ),
                    last_game_at = (
                        SELECT MAX(started_at) 
                        FROM games 
                        WHERE machine_id = ?
                    )
                WHERE id = ?
            `, [machineId, machineId, machineId, machineId, machineId]);

            console.log(`✅ Estadísticas de máquina ${machineId} actualizadas`);

        } catch (error) {
            console.error('❌ Error actualizando estadísticas de máquina:', error.message);
            throw error;
        }
    }

    /**
     * 📅 ACTUALIZAR ESTADÍSTICAS DIARIAS
     * 
     * Mantiene un resumen de cada día para cada máquina.
     * Esto permite generar reportes diarios rápidamente.
     */
    static async updateDailyStats(machineId, locationId, gameDate) {
        const date = gameDate.split('T')[0]; // Extraer solo la fecha (YYYY-MM-DD)

        try {
            await databaseManager.run(`
                INSERT OR REPLACE INTO daily_machine_stats 
                (machine_id, location_id, date, games_count, total_revenue, total_playtime, avg_players, avg_duration)
                SELECT 
                    machine_id,
                    location_id,
                    DATE(started_at) as date,
                    COUNT(*) as games_count,
                    SUM(revenue) as total_revenue,
                    SUM(duration_seconds) as total_playtime,
                    AVG(CAST(players_count as REAL)) as avg_players,
                    AVG(CAST(duration_seconds as REAL)) as avg_duration
                FROM games
                WHERE machine_id = ? AND location_id = ? AND DATE(started_at) = ?
                GROUP BY machine_id, location_id, DATE(started_at)
            `, [machineId, locationId, date]);

        } catch (error) {
            console.error('❌ Error actualizando estadísticas diarias:', error.message);
        }
    }

    /**
     * ⏰ ACTUALIZAR ESTADÍSTICAS HORARIAS
     * 
     * Mantiene un resumen de cada hora para análisis detallados.
     * Útil para identificar las horas pico de actividad.
     */
    static async updateHourlyStats(machineId, locationId, gameDate) {
        const date = gameDate.split('T')[0];
        const hour = parseInt(gameDate.split('T')[1].split(':')[0]);

        try {
            await databaseManager.run(`
                INSERT OR REPLACE INTO hourly_machine_stats 
                (machine_id, location_id, date, hour, games_count, revenue, playtime)
                SELECT 
                    machine_id,
                    location_id,
                    DATE(started_at) as date,
                    CAST(strftime('%H', started_at) as INTEGER) as hour,
                    COUNT(*) as games_count,
                    SUM(revenue) as revenue,
                    SUM(duration_seconds) as playtime
                FROM games
                WHERE machine_id = ? AND location_id = ? AND DATE(started_at) = ? AND CAST(strftime('%H', started_at) as INTEGER) = ?
                GROUP BY machine_id, location_id, DATE(started_at), CAST(strftime('%H', started_at) as INTEGER)
            `, [machineId, locationId, date, hour]);

        } catch (error) {
            console.error('❌ Error actualizando estadísticas horarias:', error.message);
        }
    }
}

// 📤 EXPORTAR EL MODELO PARA QUE OTROS ARCHIVOS LO PUEDAN USAR
module.exports = GameModel;
