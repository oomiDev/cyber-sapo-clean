/**
 * 🗄️ CONFIGURACIÓN DE BASE DE DATOS - CYBER SAPO
 * 
 * Este archivo es como el "CONECTOR" que permite que nuestro servidor
 * se comunique con la base de datos SQLite.
 * 
 * Piensa en esto como un "traductor" entre JavaScript y la base de datos:
 * - JavaScript habla en objetos y funciones
 * - La base de datos habla en SQL (lenguaje de consultas)
 * - Este archivo traduce entre ambos idiomas
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * 🏗️ CLASE PARA MANEJAR LA BASE DE DATOS
 * 
 * Esta clase es como un "ADMINISTRADOR DE BASE DE DATOS" que:
 * 1. Abre la conexión con la base de datos
 * 2. Crea las tablas si no existen
 * 3. Proporciona métodos para hacer consultas
 * 4. Cierra la conexión cuando terminamos
 */
class DatabaseManager {
    constructor() {
        // 📍 RUTA donde está guardada nuestra base de datos
        // Es como la "dirección" del archivo donde guardamos toda la información
        this.dbPath = path.join(__dirname, '../../cyber_sapo_simple.db');
        
        // 🔗 CONEXIÓN a la base de datos (inicialmente null)
        // Es como tener un "teléfono" para hablar con la base de datos
        this.db = null;
        
        console.log('🔧 DatabaseManager creado - Ruta:', this.dbPath);
    }

    /**
     * 🚀 CONECTAR CON LA BASE DE DATOS
     * 
     * Es como "marcar el número de teléfono" para establecer comunicación
     * con la base de datos. Una vez conectados, podemos enviar y recibir información.
     */
    connect() {
        return new Promise((resolve, reject) => {
            console.log('🔌 Conectando con la base de datos...');
            
            // Crear la conexión usando SQLite3
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Error conectando con la base de datos:', err.message);
                    reject(err);
                } else {
                    console.log('✅ Conectado exitosamente a la base de datos SQLite');
                    resolve();
                }
            });
        });
    }

    /**
     * 🏗️ CREAR TODAS LAS TABLAS DE LA BASE DE DATOS
     * 
     * Las tablas son como "archivadores" donde organizamos la información:
     * - business_types: Tipos de negocios (bar, casino, etc.)
     * - locations: Ubicaciones donde están las máquinas
     * - machines: Las máquinas de juego CYBER SAPO
     * - games: Registro de todas las partidas jugadas
     * - daily_machine_stats: Estadísticas diarias por máquina
     * - hourly_machine_stats: Estadísticas por hora
     */
    async createTables() {
        console.log('🏗️ Creando tablas de la base de datos...');
        
        return new Promise((resolve, reject) => {
            // db.serialize() hace que todas las operaciones se ejecuten en orden
            // Es como decir "haz esto paso a paso, no todo al mismo tiempo"
            this.db.serialize(() => {
                
                // 📋 TABLA: business_types (Tipos de Negocio)
                // Guarda los diferentes tipos de lugares donde pueden estar las máquinas
                this.db.run(`CREATE TABLE IF NOT EXISTS business_types (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Número único para cada tipo
                    name TEXT UNIQUE NOT NULL,              -- Nombre del tipo (ej: "bar", "casino")
                    icon TEXT DEFAULT '🏢',                -- Emoji que representa el tipo
                    description TEXT,                       -- Descripción del tipo de negocio
                    active INTEGER DEFAULT 1,              -- Si está activo (1) o no (0)
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- Cuándo se creó
                )`, (err) => {
                    if (err) console.error('❌ Error creando tabla business_types:', err);
                    else console.log('✅ Tabla business_types creada');
                });

                // 🏢 TABLA: locations (Ubicaciones)
                // Guarda información de cada lugar donde hay máquinas CYBER SAPO
                this.db.run(`CREATE TABLE IF NOT EXISTS locations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Número único para cada ubicación
                    name TEXT NOT NULL,                     -- Nombre del lugar (ej: "Bar El Sapo Dorado")
                    country TEXT NOT NULL,                  -- País donde está
                    city TEXT NOT NULL,                     -- Ciudad donde está
                    address TEXT,                           -- Dirección completa
                    phone TEXT,                             -- Teléfono de contacto
                    email TEXT,                             -- Email de contacto
                    business_type TEXT DEFAULT 'other',     -- Tipo de negocio (conecta con business_types)
                    description TEXT,                       -- Descripción del lugar
                    latitude REAL,                          -- Coordenada GPS (latitud)
                    longitude REAL,                         -- Coordenada GPS (longitud)
                    active INTEGER DEFAULT 1,              -- Si está activo (1) o no (0)
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- Cuándo se creó
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP   -- Cuándo se actualizó por última vez
                )`, (err) => {
                    if (err) console.error('❌ Error creando tabla locations:', err);
                    else console.log('✅ Tabla locations creada');
                });

                // 🎰 TABLA: machines (Máquinas)
                // Guarda información de cada máquina CYBER SAPO
                this.db.run(`CREATE TABLE IF NOT EXISTS machines (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Número único para cada máquina
                    name TEXT NOT NULL,                     -- Nombre de la máquina (ej: "CYBER-001")
                    location_id INTEGER NOT NULL,          -- En qué ubicación está (conecta con locations)
                    status TEXT DEFAULT 'available',       -- Estado: 'available', 'occupied', 'offline'
                    total_games INTEGER DEFAULT 0,         -- Total de partidas jugadas en esta máquina
                    total_revenue REAL DEFAULT 0.0,        -- Total de dinero ganado por esta máquina
                    total_playtime INTEGER DEFAULT 0,      -- Total de tiempo jugado (en segundos)
                    last_game_at DATETIME,                  -- Cuándo se jugó la última partida
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- Cuándo se instaló la máquina
                    FOREIGN KEY (location_id) REFERENCES locations (id)  -- Conecta con la tabla locations
                )`, (err) => {
                    if (err) console.error('❌ Error creando tabla machines:', err);
                    else console.log('✅ Tabla machines creada');
                });

                // 🎮 TABLA: games (Partidas)
                // Guarda el registro de CADA partida que se juega
                this.db.run(`CREATE TABLE IF NOT EXISTS games (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Número único para cada partida
                    machine_id INTEGER NOT NULL,           -- En qué máquina se jugó
                    location_id INTEGER NOT NULL,          -- En qué ubicación se jugó
                    players_count INTEGER NOT NULL,        -- Cuántos jugadores participaron
                    game_type TEXT DEFAULT 'individual',   -- Tipo: 'individual', 'parejas', 'equipos'
                    duration_seconds INTEGER NOT NULL,     -- Cuánto duró la partida (en segundos)
                    revenue REAL NOT NULL,                 -- Cuánto dinero generó esta partida
                    credits_used INTEGER DEFAULT 1,       -- Cuántos créditos se usaron
                    winner_score INTEGER,                  -- Puntuación del ganador
                    total_score INTEGER,                   -- Puntuación total de todos los jugadores
                    started_at DATETIME NOT NULL,          -- Cuándo empezó la partida
                    ended_at DATETIME NOT NULL,            -- Cuándo terminó la partida
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- Cuándo se registró en la base de datos
                    FOREIGN KEY (machine_id) REFERENCES machines (id),      -- Conecta con machines
                    FOREIGN KEY (location_id) REFERENCES locations (id)     -- Conecta con locations
                )`, (err) => {
                    if (err) console.error('❌ Error creando tabla games:', err);
                    else console.log('✅ Tabla games creada');
                });

                // 📊 TABLA: daily_machine_stats (Estadísticas Diarias por Máquina)
                // Guarda un resumen de cada día para cada máquina
                this.db.run(`CREATE TABLE IF NOT EXISTS daily_machine_stats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Número único para cada registro diario
                    machine_id INTEGER NOT NULL,           -- De qué máquina son las estadísticas
                    location_id INTEGER NOT NULL,          -- En qué ubicación está esa máquina
                    date DATE NOT NULL,                    -- Qué día (formato: 2024-01-15)
                    games_count INTEGER DEFAULT 0,         -- Cuántas partidas se jugaron ese día
                    total_revenue REAL DEFAULT 0.0,        -- Cuánto dinero se ganó ese día
                    total_playtime INTEGER DEFAULT 0,      -- Cuánto tiempo se jugó ese día (segundos)
                    avg_players REAL DEFAULT 0.0,          -- Promedio de jugadores por partida
                    avg_duration REAL DEFAULT 0.0,         -- Duración promedio de las partidas
                    peak_hour INTEGER,                     -- A qué hora hubo más actividad
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- Cuándo se calculó esta estadística
                    UNIQUE(machine_id, date),              -- No puede haber dos registros del mismo día para la misma máquina
                    FOREIGN KEY (machine_id) REFERENCES machines (id),      -- Conecta con machines
                    FOREIGN KEY (location_id) REFERENCES locations (id)     -- Conecta con locations
                )`, (err) => {
                    if (err) console.error('❌ Error creando tabla daily_machine_stats:', err);
                    else console.log('✅ Tabla daily_machine_stats creada');
                });

                // ⏰ TABLA: hourly_machine_stats (Estadísticas por Hora)
                // Guarda estadísticas de cada hora del día para cada máquina
                this.db.run(`CREATE TABLE IF NOT EXISTS hourly_machine_stats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Número único para cada registro horario
                    machine_id INTEGER NOT NULL,           -- De qué máquina son las estadísticas
                    location_id INTEGER NOT NULL,          -- En qué ubicación está esa máquina
                    date DATE NOT NULL,                    -- Qué día
                    hour INTEGER NOT NULL,                 -- Qué hora (0-23)
                    games_count INTEGER DEFAULT 0,         -- Cuántas partidas en esa hora
                    revenue REAL DEFAULT 0.0,             -- Cuánto dinero en esa hora
                    playtime INTEGER DEFAULT 0,           -- Cuánto tiempo de juego en esa hora
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- Cuándo se calculó
                    UNIQUE(machine_id, date, hour),        -- No puede haber duplicados
                    FOREIGN KEY (machine_id) REFERENCES machines (id),      -- Conecta con machines
                    FOREIGN KEY (location_id) REFERENCES locations (id)     -- Conecta con locations
                )`, (err) => {
                    if (err) console.error('❌ Error creando tabla hourly_machine_stats:', err);
                    else console.log('✅ Tabla hourly_machine_stats creada');
                    
                    // Cuando terminemos de crear todas las tablas, resolvemos la promesa
                    resolve();
                });
            });
        });
    }

    /**
     * 🌱 INSERTAR DATOS INICIALES
     * 
     * Esto es como "llenar los archivadores" con información básica
     * para que el sistema pueda funcionar desde el primer día.
     */
    async insertInitialData() {
        console.log('🌱 Insertando datos iniciales...');
        
        // Primero insertamos los tipos de negocio
        const businessTypes = [
            { name: 'bar', icon: '🍺', description: 'Bar' },
            { name: 'pub', icon: '🍻', description: 'Pub' },
            { name: 'restaurant', icon: '🍽️', description: 'Restaurante' },
            { name: 'disco', icon: '🕺', description: 'Discoteca' },
            { name: 'cafe', icon: '☕', description: 'Café' },
            { name: 'hotel', icon: '🏨', description: 'Hotel' },
            { name: 'casino', icon: '🎰', description: 'Casino' },
            { name: 'mall', icon: '🏬', description: 'Centro Comercial' },
            { name: 'other', icon: '🏢', description: 'Otro' }
        ];

        // Preparar la consulta para insertar tipos de negocio
        // "INSERT OR IGNORE" significa "inserta solo si no existe ya"
        const stmt = this.db.prepare(`INSERT OR IGNORE INTO business_types (name, icon, description) VALUES (?, ?, ?)`);
        
        businessTypes.forEach(type => {
            stmt.run(type.name, type.icon, type.description);
        });
        
        stmt.finalize();
        console.log('✅ Tipos de negocio insertados');
    }

    /**
     * 🔍 EJECUTAR UNA CONSULTA QUE DEVUELVE MÚLTIPLES RESULTADOS
     * 
     * Es como "hacer una pregunta" a la base de datos y recibir una lista de respuestas.
     * Por ejemplo: "¿Cuáles son todas las máquinas disponibles?"
     */
    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('❌ Error en consulta:', err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * 🔍 EJECUTAR UNA CONSULTA QUE DEVUELVE UN SOLO RESULTADO
     * 
     * Es como hacer una pregunta específica que tiene una sola respuesta.
     * Por ejemplo: "¿Cuántas partidas se jugaron hoy?"
     */
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('❌ Error en consulta get:', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * ✏️ EJECUTAR UNA CONSULTA QUE MODIFICA DATOS
     * 
     * Es como "dar una orden" a la base de datos para cambiar algo.
     * Por ejemplo: "Inserta una nueva partida" o "Actualiza el estado de una máquina"
     */
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('❌ Error en consulta run:', err.message);
                    reject(err);
                } else {
                    // 'this' aquí se refiere al resultado de la operación
                    // lastID = el ID del último registro insertado
                    // changes = cuántos registros se modificaron
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    /**
     * 🚪 CERRAR LA CONEXIÓN CON LA BASE DE DATOS
     * 
     * Es como "colgar el teléfono" cuando terminamos de hablar.
     * Importante hacerlo para liberar recursos del sistema.
     */
    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('❌ Error cerrando base de datos:', err.message);
                        reject(err);
                    } else {
                        console.log('✅ Conexión con base de datos cerrada correctamente');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

// 🏭 CREAR UNA INSTANCIA ÚNICA DEL ADMINISTRADOR DE BASE DE DATOS
// Esto es un "patrón singleton" - solo hay una conexión para toda la aplicación
const databaseManager = new DatabaseManager();

// 📤 EXPORTAR para que otros archivos puedan usar la base de datos
module.exports = databaseManager;
