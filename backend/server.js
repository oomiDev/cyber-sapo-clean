const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Base de datos SQLite
const dbPath = path.join(__dirname, 'cyber_sapo.db');
const db = new sqlite3.Database(dbPath);

// Inicializar base de datos
function initializeDatabase() {
    // Crear tabla de ubicaciones
    db.run(`CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        address TEXT,
        city TEXT,
        country TEXT,
        phone TEXT,
        email TEXT,
        business_type TEXT DEFAULT 'bar',
        description TEXT,
        latitude REAL,
        longitude REAL,
        active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creando tabla locations:', err);
        } else {
            console.log('✅ Tabla locations creada/verificada');
            // Agregar columnas si no existen (para compatibilidad con versiones anteriores)
            addLocationColumnsIfNotExist();
        }
    });
    
    // Crear tabla de tipos de negocio
    db.run(`CREATE TABLE IF NOT EXISTS business_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        icon TEXT DEFAULT '🏢',
        description TEXT,
        active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creando tabla business_types:', err);
        } else {
            console.log('✅ Tabla business_types creada/verificada');
            insertDefaultBusinessTypes();
        }
    });

    // Crear tabla de máquinas
    db.run(`CREATE TABLE IF NOT EXISTS machines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location_id INTEGER,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'available',
        max_players INTEGER DEFAULT 4,
        current_players INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (location_id) REFERENCES locations (id)
    )`, (err) => {
        if (err) {
            console.error('Error creando tabla machines:', err);
        } else {
            console.log('✅ Tabla machines creada/verificada');
        }
    });

    // Crear tabla de partidas (actualizada)
    db.run(`CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        machine_id INTEGER,
        location_id INTEGER,
        player_id TEXT,
        player_name TEXT NOT NULL,
        game_type TEXT DEFAULT 'individual',
        players INTEGER DEFAULT 1,
        score INTEGER DEFAULT 0,
        duration INTEGER DEFAULT 0,
        revenue REAL DEFAULT 0,
        status TEXT DEFAULT 'completed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (machine_id) REFERENCES machines (id),
        FOREIGN KEY (location_id) REFERENCES locations (id)
    )`, (err) => {
        if (err) {
            console.error('Error creando tabla games:', err);
        } else {
            console.log('✅ Tabla games creada/verificada');
            addGameColumnsIfNotExist();
        }
    });

    // Crear tabla de jugadores
    db.run(`CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        country TEXT DEFAULT 'España',
        city TEXT,
        level INTEGER DEFAULT 1,
        total_score INTEGER DEFAULT 0,
        best_score INTEGER DEFAULT 0,
        total_games INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        accuracy REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creando tabla players:', err);
        } else {
            console.log('✅ Tabla players creada/verificada');
        }
    });

    // Crear tabla de logros
    db.run(`CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        icon TEXT DEFAULT '🏆',
        points INTEGER DEFAULT 0,
        condition_type TEXT,
        condition_value INTEGER,
        active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creando tabla achievements:', err);
        } else {
            console.log('✅ Tabla achievements creada/verificada');
            insertDefaultAchievements();
        }
    });

    // Crear tabla de logros de jugadores
    db.run(`CREATE TABLE IF NOT EXISTS player_achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id TEXT,
        achievement_id INTEGER,
        unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players (id),
        FOREIGN KEY (achievement_id) REFERENCES achievements (id),
        UNIQUE(player_id, achievement_id)
    )`, (err) => {
        if (err) {
            console.error('Error creando tabla player_achievements:', err);
        } else {
            console.log('✅ Tabla player_achievements creada/verificada');
        }
    });

    // Crear tabla de torneos
    db.run(`CREATE TABLE IF NOT EXISTS tournaments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        location_id INTEGER,
        start_date DATETIME,
        end_date DATETIME,
        max_participants INTEGER DEFAULT 50,
        entry_fee REAL DEFAULT 0,
        prize_pool REAL DEFAULT 0,
        status TEXT DEFAULT 'upcoming',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (location_id) REFERENCES locations (id)
    )`, (err) => {
        if (err) {
            console.error('Error creando tabla tournaments:', err);
        } else {
            console.log('✅ Tabla tournaments creada/verificada');
        }
    });

    // Crear tabla de participantes en torneos
    db.run(`CREATE TABLE IF NOT EXISTS tournament_participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER,
        player_id TEXT,
        registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'registered',
        FOREIGN KEY (tournament_id) REFERENCES tournaments (id),
        FOREIGN KEY (player_id) REFERENCES players (id),
        UNIQUE(tournament_id, player_id)
    )`, (err) => {
        if (err) {
            console.error('Error creando tabla tournament_participants:', err);
        } else {
            console.log('✅ Tabla tournament_participants creada/verificada');
        }
    });

    // Crear tabla de retos semanales
    db.run(`CREATE TABLE IF NOT EXISTS weekly_challenges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        challenge_type TEXT,
        target_value INTEGER,
        reward_points INTEGER DEFAULT 100,
        reward_description TEXT,
        start_date DATE,
        end_date DATE,
        active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creando tabla weekly_challenges:', err);
        } else {
            console.log('✅ Tabla weekly_challenges creada/verificada');
            insertDefaultChallenges();
        }
    });

    // Crear tabla de progreso de retos
    db.run(`CREATE TABLE IF NOT EXISTS player_challenge_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id TEXT,
        challenge_id INTEGER,
        current_progress INTEGER DEFAULT 0,
        completed BOOLEAN DEFAULT 0,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players (id),
        FOREIGN KEY (challenge_id) REFERENCES weekly_challenges (id),
        UNIQUE(player_id, challenge_id)
    )`, (err) => {
        if (err) {
            console.error('Error creando tabla player_challenge_progress:', err);
        } else {
            console.log('✅ Tabla player_challenge_progress creada/verificada');
            insertTestData();
        }
    });
}

/**
 * Agregar columnas a la tabla locations si no existen
 */
function addLocationColumnsIfNotExist() {
    const columnsToAdd = [
        { name: 'city', type: 'TEXT' },
        { name: 'country', type: 'TEXT' },
        { name: 'email', type: 'TEXT' },
        { name: 'business_type', type: 'TEXT DEFAULT "bar"' },
        { name: 'latitude', type: 'REAL' },
        { name: 'longitude', type: 'REAL' },
        { name: 'active', type: 'BOOLEAN DEFAULT 1' },
        { name: 'updated_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
    ];
    
    columnsToAdd.forEach(column => {
        db.run(`ALTER TABLE locations ADD COLUMN ${column.name} ${column.type}`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error(`Error agregando columna ${column.name}:`, err);
            }
        });
    });
}

/**
 * Agregar columnas a la tabla games si no existen
 */
function addGameColumnsIfNotExist() {
    const columnsToAdd = [
        { name: 'location_id', type: 'INTEGER' },
        { name: 'player_id', type: 'TEXT' },
        { name: 'game_type', type: 'TEXT DEFAULT "individual"' },
        { name: 'players', type: 'INTEGER DEFAULT 1' },
        { name: 'duration', type: 'INTEGER DEFAULT 0' },
        { name: 'revenue', type: 'REAL DEFAULT 0' }
    ];
    
    columnsToAdd.forEach(column => {
        db.run(`ALTER TABLE games ADD COLUMN ${column.name} ${column.type}`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error(`Error agregando columna ${column.name}:`, err);
            }
        });
    });
}

/**
 * Insertar logros por defecto
 */
function insertDefaultAchievements() {
    const achievements = [
        { name: 'Primera Victoria', description: 'Gana tu primera partida', icon: '🥇', condition_type: 'wins', condition_value: 1, points: 50 },
        { name: 'Maestro de Precisión', description: 'Alcanza 80% de precisión', icon: '🎯', condition_type: 'accuracy', condition_value: 80, points: 100 },
        { name: 'Rana de Oro', description: 'Supera los 2000 puntos', icon: '🏆', condition_type: 'best_score', condition_value: 2000, points: 200 },
        { name: 'Veterano', description: 'Juega 50 partidas', icon: '⭐', condition_type: 'total_games', condition_value: 50, points: 150 },
        { name: 'Campeón Local', description: 'Gana 10 partidas', icon: '👑', condition_type: 'wins', condition_value: 10, points: 300 }
    ];
    
    achievements.forEach(achievement => {
        db.run(
            "INSERT OR IGNORE INTO achievements (name, description, icon, condition_type, condition_value, points) VALUES (?, ?, ?, ?, ?, ?)",
            [achievement.name, achievement.description, achievement.icon, achievement.condition_type, achievement.condition_value, achievement.points]
        );
    });
}

/**
 * Insertar retos semanales por defecto
 */
function insertDefaultChallenges() {
    const challenges = [
        { name: 'Precisión Extrema', description: 'Consigue 3 ranas pequeñas seguidas', challenge_type: 'precision_streak', target_value: 3, reward_points: 100 },
        { name: 'Puntuación Alta', description: 'Supera los 1,500 puntos esta semana', challenge_type: 'weekly_high_score', target_value: 1500, reward_points: 150 },
        { name: 'Maratón de Juegos', description: 'Juega 10 partidas esta semana', challenge_type: 'weekly_games', target_value: 10, reward_points: 75 }
    ];
    
    challenges.forEach(challenge => {
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        
        db.run(
            "INSERT OR IGNORE INTO weekly_challenges (name, description, challenge_type, target_value, reward_points, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [challenge.name, challenge.description, challenge.challenge_type, challenge.target_value, challenge.reward_points, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
        );
    });
}

/**
 * Insertar tipos de negocio por defecto
 */
function insertDefaultBusinessTypes() {
    const defaultTypes = [
        { name: 'bar', icon: '🍺', description: 'Bar tradicional' },
        { name: 'pub', icon: '🍻', description: 'Pub irlandés o inglés' },
        { name: 'restaurante', icon: '🍽️', description: 'Restaurante' },
        { name: 'discoteca', icon: '🕺', description: 'Discoteca o club nocturno' },
        { name: 'cafe', icon: '☕', description: 'Cafetería' },
        { name: 'hotel', icon: '🏨', description: 'Hotel' },
        { name: 'casino', icon: '🎰', description: 'Casino' },
        { name: 'centro_comercial', icon: '🏬', description: 'Centro comercial' },
        { name: 'otro', icon: '🏢', description: 'Otro tipo de negocio' }
    ];
    
    defaultTypes.forEach(type => {
        db.run(
            "INSERT OR IGNORE INTO business_types (name, icon, description) VALUES (?, ?, ?)",
            [type.name, type.icon, type.description],
            function(err) {
                if (err) {
                    console.error(`Error insertando tipo de negocio ${type.name}:`, err);
                }
            }
        );
    });
}

function insertTestData() {
    // Verificar si ya hay datos
    db.get("SELECT COUNT(*) as count FROM locations", (err, row) => {
        if (err || row.count > 0) return;

        // Insertar ubicaciones de prueba
        const testLocations = [
            {
                name: 'Bar El Sapo',
                address: 'Calle Principal 123',
                city: 'Madrid',
                country: 'España',
                phone: '+34 123 456 789',
                email: 'info@barelsapo.com',
                business_type: 'bar'
            },
            {
                name: 'Café Central',
                address: 'Plaza Mayor 45',
                city: 'Barcelona',
                country: 'España',
                phone: '+34 987 654 321',
                email: 'contacto@cafecentral.com',
                business_type: 'cafe'
            },
            {
                name: 'Pub The Frog',
                address: 'Avenida Libertad 67',
                city: 'Valencia',
                country: 'España',
                phone: '+34 555 123 456',
                email: 'hello@pubthefrog.com',
                business_type: 'pub'
            },
            {
                name: 'Discoteca Neon',
                address: 'Calle de la Noche 89',
                city: 'Sevilla',
                country: 'España',
                phone: '+34 666 777 888',
                email: 'info@discotecaneon.com',
                business_type: 'discoteca'
            }
        ];
        
        testLocations.forEach((location, index) => {
            db.run(
                "INSERT OR IGNORE INTO locations (name, address, city, country, phone, email, business_type) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [location.name, location.address, location.city, location.country, location.phone, location.email, location.business_type],
                function(err) {
                    if (err) return;
                    
                    // Insertar máquinas de prueba solo para la primera ubicación
                    if (index === 0) {
                        const machines = [
                            { name: 'Sapo Master', status: 'available', max_players: 6, current_players: 0 },
                            { name: 'Rana Champion', status: 'occupied', max_players: 4, current_players: 2 },
                            { name: 'Cyber Frog', status: 'full', max_players: 8, current_players: 8 }
                        ];
                        
                        machines.forEach(machine => {
                            db.run("INSERT INTO machines (location_id, name, status, max_players, current_players) VALUES (?, ?, ?, ?, ?)",
                                [this.lastID, machine.name, machine.status, machine.max_players, machine.current_players]);
                        });
                    }
                }
            );
        });

        console.log('✅ Datos de prueba insertados');
    });
}

// RUTAS API

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'CYBER SAPO Backend funcionando' });
});

// Obtener todas las máquinas
app.get('/api/machines', (req, res) => {
    const query = `
        SELECT 
            m.*,
            l.name as location_name,
            l.address as location_address,
            l.city as location_city,
            l.phone as location_phone
        FROM machines m
        LEFT JOIN locations l ON m.location_id = l.id
        ORDER BY l.name, m.name
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error obteniendo máquinas:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        res.json({
            success: 'Máquinas obtenidas exitosamente',
            data: rows
        });
    });
});

// Conectar a una máquina
app.post('/api/machines/:id/connect', (req, res) => {
    const machineId = req.params.id;
    const { playerName } = req.body;

    if (!playerName) {
        return res.status(400).json({ error: 'Nombre de jugador requerido' });
    }

    // Verificar disponibilidad
    db.get("SELECT * FROM machines WHERE id = ?", [machineId], (err, machine) => {
        if (err || !machine) {
            return res.status(404).json({ error: 'Máquina no encontrada' });
        }

        if (machine.current_players >= machine.max_players) {
            return res.status(400).json({ error: 'Máquina llena' });
        }

        // Actualizar contador de jugadores
        const newCount = machine.current_players + 1;
        const newStatus = newCount >= machine.max_players ? 'full' : 'occupied';

        db.run("UPDATE machines SET current_players = ?, status = ? WHERE id = ?",
            [newCount, newStatus, machineId], (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Error actualizando máquina' });
                }

                // Crear registro de partida
                db.run("INSERT INTO games (machine_id, player_name) VALUES (?, ?)",
                    [machineId, playerName], (err) => {
                        if (err) {
                            console.error('Error creando partida:', err);
                        }

                        res.json({
                            success: true,
                            message: `¡Conectado a ${machine.name}!`,
                            machine: {
                                id: machine.id,
                                name: machine.name,
                                current_players: newCount,
                                max_players: machine.max_players
                            }
                        });
                    });
            });
    });
});

// Obtener historial de partidas
app.get('/api/games', (req, res) => {
    const query = `
        SELECT 
            g.*,
            m.name as machine_name,
            l.name as location_name
        FROM games g
        LEFT JOIN machines m ON g.machine_id = m.id
        LEFT JOIN locations l ON m.location_id = l.id
        ORDER BY g.created_at DESC
        LIMIT 50
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error obteniendo historial' });
        }

        res.json({
            success: true,
            data: rows
        });
    });
});

// ENDPOINTS DE ADMINISTRACIÓN

// Cambiar estado de máquina
app.put('/api/machines/:id/status', (req, res) => {
    const machineId = req.params.id;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Estado requerido' });
    }

    const validStatuses = ['available', 'occupied', 'full', 'offline'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Estado inválido' });
    }

    db.run("UPDATE machines SET status = ? WHERE id = ?", [status, machineId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error actualizando estado' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Máquina no encontrada' });
        }

        res.json({
            success: true,
            message: `Estado actualizado a: ${status}`
        });
    });
});

// Reiniciar máquina
app.post('/api/machines/:id/reset', (req, res) => {
    const machineId = req.params.id;

    db.run("UPDATE machines SET current_players = 0, status = 'available' WHERE id = ?", [machineId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error reiniciando máquina' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Máquina no encontrada' });
        }

        res.json({
            success: true,
            message: 'Máquina reiniciada correctamente'
        });
    });
});

// Eliminar máquina
app.delete('/api/machines/:id', (req, res) => {
    const machineId = req.params.id;

    db.run("DELETE FROM machines WHERE id = ?", [machineId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error eliminando máquina' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Máquina no encontrada' });
        }

        res.json({
            success: true,
            message: 'Máquina eliminada correctamente'
        });
    });
});

// Reiniciar todas las máquinas
app.post('/api/machines/reset-all', (req, res) => {
    db.run("UPDATE machines SET current_players = 0, status = 'available'", function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error reiniciando máquinas' });
        }

        res.json({
            success: true,
            message: `${this.changes} máquinas reiniciadas correctamente`
        });
    });
});

// Agregar nueva máquina
app.post('/api/machines', (req, res) => {
    const { name, location_id, max_players, status } = req.body;

    if (!name || !location_id) {
        return res.status(400).json({ error: 'Nombre y ubicación son requeridos' });
    }

    const machineData = {
        name,
        location_id,
        max_players: max_players || 4,
        status: status || 'available',
        current_players: 0
    };

    db.run(
        "INSERT INTO machines (location_id, name, status, max_players, current_players) VALUES (?, ?, ?, ?, ?)",
        [machineData.location_id, machineData.name, machineData.status, machineData.max_players, machineData.current_players],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Error agregando máquina' });
            }

            res.json({
                success: true,
                message: 'Máquina agregada correctamente',
                machine_id: this.lastID
            });
        }
    );
});

// GESTIÓN DE UBICACIONES (BARES/LOCALES)

// Obtener todas las ubicaciones con filtros
app.get('/api/locations', (req, res) => {
    const { country, city, business_type, search, page = 1, limit = 50 } = req.query;
    
    let whereConditions = ['l.active = 1'];
    let params = [];
    
    if (country) {
        whereConditions.push('l.country = ?');
        params.push(country);
    }
    
    if (city) {
        whereConditions.push('l.city = ?');
        params.push(city);
    }
    
    if (business_type) {
        whereConditions.push('l.business_type = ?');
        params.push(business_type);
    }
    
    if (search) {
        whereConditions.push('(l.name LIKE ? OR l.address LIKE ? OR l.city LIKE ?)');
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    
    const query = `
        SELECT 
            l.*,
            bt.icon as business_type_icon,
            bt.description as business_type_description,
            COUNT(m.id) as machine_count,
            COUNT(CASE WHEN m.status = 'available' THEN 1 END) as available_machines,
            COUNT(CASE WHEN m.status = 'occupied' THEN 1 END) as occupied_machines,
            COUNT(CASE WHEN m.status = 'offline' THEN 1 END) as offline_machines
        FROM locations l
        LEFT JOIN business_types bt ON l.business_type = bt.name
        LEFT JOIN machines m ON l.id = m.location_id
        ${whereClause}
        GROUP BY l.id
        ORDER BY l.country, l.city, l.name
        LIMIT ? OFFSET ?
    `;
    
    // Agregar limit y offset a los parámetros
    params.push(limit, offset);
    
    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error obteniendo ubicaciones' });
        }
        
        // Obtener el total de registros para paginación
        const countQuery = `
            SELECT COUNT(DISTINCT l.id) as total
            FROM locations l
            LEFT JOIN business_types bt ON l.business_type = bt.name
            ${whereClause}
        `;
        
        db.get(countQuery, params.slice(0, -2), (err, countResult) => {
            if (err) {
                return res.status(500).json({ error: 'Error contando ubicaciones' });
            }
            
            res.json({
                success: true,
                data: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult.total,
                    pages: Math.ceil(countResult.total / limit)
                }
            });
        });
    });
});

// Obtener una ubicación específica
app.get('/api/locations/:id', (req, res) => {
    const locationId = req.params.id;
    
    const query = `
        SELECT 
            l.*,
            COUNT(m.id) as machine_count
        FROM locations l
        LEFT JOIN machines m ON l.id = m.location_id
        WHERE l.id = ?
        GROUP BY l.id
    `;

    db.get(query, [locationId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Error obteniendo ubicación' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Ubicación no encontrada' });
        }

        res.json({
            success: true,
            data: row
        });
    });
});

// Crear nueva ubicación
app.post('/api/locations', (req, res) => {
    const { name, address, city, country, phone, email, business_type, description, latitude, longitude } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'El nombre es requerido' });
    }
    
    if (!city || !country) {
        return res.status(400).json({ error: 'Ciudad y país son requeridos' });
    }

    const locationData = {
        name: name.trim(),
        address: address ? address.trim() : null,
        city: city.trim(),
        country: country.trim(),
        phone: phone ? phone.trim() : null,
        email: email ? email.trim() : null,
        business_type: business_type || 'bar',
        description: description ? description.trim() : null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null
    };

    db.run(
        "INSERT INTO locations (name, address, city, country, phone, email, business_type, description, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [locationData.name, locationData.address, locationData.city, locationData.country, locationData.phone, locationData.email, locationData.business_type, locationData.description, locationData.latitude, locationData.longitude],
        function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                    return res.status(400).json({ error: 'Ya existe una ubicación con ese nombre' });
                }
                return res.status(500).json({ error: 'Error creando ubicación' });
            }

            res.json({
                success: true,
                message: 'Ubicación creada correctamente',
                location_id: this.lastID,
                data: {
                    id: this.lastID,
                    ...locationData
                }
            });
        }
    );
});

// Actualizar ubicación
app.put('/api/locations/:id', (req, res) => {
    const locationId = req.params.id;
    const { name, address, city, country, phone, email, business_type, description, latitude, longitude } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'El nombre es requerido' });
    }
    
    if (!city || !country) {
        return res.status(400).json({ error: 'Ciudad y país son requeridos' });
    }

    const locationData = {
        name: name.trim(),
        address: address ? address.trim() : null,
        city: city.trim(),
        country: country.trim(),
        phone: phone ? phone.trim() : null,
        email: email ? email.trim() : null,
        business_type: business_type || 'bar',
        description: description ? description.trim() : null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null
    };

    db.run(
        "UPDATE locations SET name = ?, address = ?, city = ?, country = ?, phone = ?, email = ?, business_type = ?, description = ?, latitude = ?, longitude = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [locationData.name, locationData.address, locationData.city, locationData.country, locationData.phone, locationData.email, locationData.business_type, locationData.description, locationData.latitude, locationData.longitude, locationId],
        function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                    return res.status(400).json({ error: 'Ya existe una ubicación con ese nombre' });
                }
                return res.status(500).json({ error: 'Error actualizando ubicación' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Ubicación no encontrada' });
            }

            res.json({
                success: true,
                message: 'Ubicación actualizada correctamente',
                data: {
                    id: locationId,
                    ...locationData
                }
            });
        }
    );
});

// Eliminar ubicación
app.delete('/api/locations/:id', (req, res) => {
    const locationId = req.params.id;

    // Primero verificar si tiene máquinas asociadas
    db.get("SELECT COUNT(*) as machine_count FROM machines WHERE location_id = ?", [locationId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Error verificando ubicación' });
        }

        if (row.machine_count > 0) {
            return res.status(400).json({ 
                error: `No se puede eliminar la ubicación porque tiene ${row.machine_count} máquina(s) asociada(s)`,
                machine_count: row.machine_count
            });
        }

        // Si no tiene máquinas, proceder a eliminar
        db.run("DELETE FROM locations WHERE id = ?", [locationId], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Error eliminando ubicación' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Ubicación no encontrada' });
            }

            res.json({
                success: true,
                message: 'Ubicación eliminada correctamente'
            });
        });
    });
});

// ENDPOINTS PARA TIPOS DE NEGOCIO Y FILTROS

// Obtener todos los tipos de negocio
app.get('/api/business-types', (req, res) => {
    db.all("SELECT * FROM business_types WHERE active = 1 ORDER BY name", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error obteniendo tipos de negocio' });
        }

        res.json({
            success: true,
            data: rows
        });
    });
});

// Crear nuevo tipo de negocio
app.post('/api/business-types', (req, res) => {
    const { name, icon, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const typeData = {
        name: name.trim().toLowerCase(),
        icon: icon || '🏢',
        description: description ? description.trim() : null
    };

    db.run(
        "INSERT INTO business_types (name, icon, description) VALUES (?, ?, ?)",
        [typeData.name, typeData.icon, typeData.description],
        function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                    return res.status(400).json({ error: 'Ya existe un tipo de negocio con ese nombre' });
                }
                return res.status(500).json({ error: 'Error creando tipo de negocio' });
            }

            res.json({
                success: true,
                message: 'Tipo de negocio creado correctamente',
                data: {
                    id: this.lastID,
                    ...typeData
                }
            });
        }
    );
});

// Obtener países únicos
app.get('/api/countries', (req, res) => {
    db.all("SELECT DISTINCT country FROM locations WHERE country IS NOT NULL AND active = 1 ORDER BY country", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error obteniendo países' });
        }

        res.json({
            success: true,
            data: rows.map(row => row.country)
        });
    });
});

// Obtener ciudades por país
app.get('/api/cities', (req, res) => {
    const { country } = req.query;
    
    let query = "SELECT DISTINCT city FROM locations WHERE city IS NOT NULL AND active = 1";
    let params = [];
    
    if (country) {
        query += " AND country = ?";
        params.push(country);
    }
    
    query += " ORDER BY city";
    
    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error obteniendo ciudades' });
        }

        res.json({
            success: true,
            data: rows.map(row => row.city)
        });
    });
});

// Obtener estadísticas de ubicaciones
app.get('/api/locations/stats', (req, res) => {
    const queries = {
        total: "SELECT COUNT(*) as count FROM locations WHERE active = 1",
        by_country: "SELECT country, COUNT(*) as count FROM locations WHERE active = 1 AND country IS NOT NULL GROUP BY country ORDER BY count DESC",
        by_type: "SELECT l.business_type, bt.icon, COUNT(*) as count FROM locations l LEFT JOIN business_types bt ON l.business_type = bt.name WHERE l.active = 1 GROUP BY l.business_type ORDER BY count DESC",
        by_city: "SELECT city, country, COUNT(*) as count FROM locations WHERE active = 1 AND city IS NOT NULL GROUP BY city, country ORDER BY count DESC LIMIT 10"
    };
    
    const results = {};
    let completed = 0;
    const total = Object.keys(queries).length;
    
    Object.entries(queries).forEach(([key, query]) => {
        db.all(query, [], (err, rows) => {
            if (!err) {
                results[key] = rows;
            }
            completed++;
            
            if (completed === total) {
                res.json({
                    success: true,
                    data: results
                });
            }
        });
    });
});

// Función para insertar datos de prueba
function insertTestData() {
    // Verificar si ya hay datos
    db.get("SELECT COUNT(*) as count FROM locations", [], (err, row) => {
        if (err || row.count > 0) {
            console.log('📊 Datos existentes encontrados, omitiendo inserción de datos de prueba');
            return;
        }
        
        console.log('📝 Insertando datos de prueba...');
        
        // Insertar ubicaciones de prueba
        const locations = [
            {
                name: 'Bar El Rincón',
                country: 'España',
                city: 'Madrid',
                address: 'Calle Mayor 123',
                phone: '+34 91 123 4567',
                email: 'info@elrincon.es',
                business_type: 'bar',
                description: 'Bar tradicional en el centro de Madrid'
            },
            {
                name: 'Pub The Crown',
                country: 'Reino Unido',
                city: 'Londres',
                address: '45 Oxford Street',
                phone: '+44 20 7123 4567',
                email: 'contact@thecrown.co.uk',
                business_type: 'pub',
                description: 'Auténtico pub inglés con ambiente tradicional'
            },
            {
                name: 'Restaurante La Paella',
                country: 'España',
                city: 'Valencia',
                address: 'Plaza del Ayuntamiento 8',
                phone: '+34 96 987 6543',
                email: 'reservas@lapaella.es',
                business_type: 'restaurant',
                description: 'Especialistas en paella valenciana auténtica'
            },
            {
                name: 'Discoteca Neon Club',
                country: 'Francia',
                city: 'París',
                address: '12 Rue de Rivoli',
                phone: '+33 1 42 12 34 56',
                email: 'info@neonclub.fr',
                business_type: 'disco',
                description: 'La discoteca más moderna de París'
            },
            {
                name: 'Café Central',
                country: 'Italia',
                city: 'Roma',
                address: 'Via del Corso 100',
                phone: '+39 06 123 4567',
                email: 'info@cafecentral.it',
                business_type: 'cafe',
                description: 'Café tradicional italiano en el corazón de Roma'
            },
            {
                name: 'Hotel Cyber Palace',
                country: 'Estados Unidos',
                city: 'Las Vegas',
                address: '3570 Las Vegas Blvd S',
                phone: '+1 702 123 4567',
                email: 'info@cyberpalace.com',
                business_type: 'hotel',
                description: 'Hotel temático con tecnología de vanguardia'
            },
            {
                name: 'Casino Royal',
                country: 'Mónaco',
                city: 'Monte Carlo',
                address: 'Place du Casino',
                phone: '+377 98 06 21 21',
                email: 'info@casinoroyal.mc',
                business_type: 'casino',
                description: 'El casino más exclusivo de Monte Carlo'
            },
            {
                name: 'Mall Cyber Plaza',
                country: 'Japón',
                city: 'Tokio',
                address: '1-1-1 Shibuya',
                phone: '+81 3 1234 5678',
                email: 'info@cyberplaza.jp',
                business_type: 'mall',
                description: 'Centro comercial futurista con gaming zones'
            },
            {
                name: 'Bar La Cantina',
                country: 'México',
                city: 'Ciudad de México',
                address: 'Av. Reforma 456',
                phone: '+52 55 1234 5678',
                email: 'info@lacantina.mx',
                business_type: 'bar',
                description: 'Bar mexicano con ambiente tradicional'
            },
            {
                name: 'Pub Irish Corner',
                country: 'Irlanda',
                city: 'Dublín',
                address: 'Temple Bar 12',
                phone: '+353 1 234 5678',
                email: 'info@irishcorner.ie',
                business_type: 'pub',
                description: 'Pub irlandés auténtico con música en vivo'
            }
        ];
        
        // Insertar ubicaciones
        const locationStmt = db.prepare(`
            INSERT INTO locations (name, country, city, address, phone, email, business_type, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        locations.forEach(location => {
            locationStmt.run(
                location.name,
                location.country,
                location.city,
                location.address,
                location.phone,
                location.email,
                location.business_type,
                location.description
            );
        });
        locationStmt.finalize();
        
        // Insertar máquinas de prueba para múltiples ubicaciones
        const machines = [
            // Bar El Rincón (Madrid) - 4 máquinas
            { name: 'Cyber Sapo 001', location_id: 1, status: 'available' },
            { name: 'Cyber Sapo 002', location_id: 1, status: 'occupied' },
            { name: 'Cyber Sapo 003', location_id: 1, status: 'offline' },
            { name: 'Cyber Sapo 004', location_id: 1, status: 'available' },
            
            // Pub The Crown (Londres) - 3 máquinas
            { name: 'Cyber Sapo 005', location_id: 2, status: 'available' },
            { name: 'Cyber Sapo 006', location_id: 2, status: 'available' },
            { name: 'Cyber Sapo 007', location_id: 2, status: 'occupied' },
            
            // Restaurante La Paella (Valencia) - 2 máquinas
            { name: 'Cyber Sapo 008', location_id: 3, status: 'available' },
            { name: 'Cyber Sapo 009', location_id: 3, status: 'offline' },
            
            // Discoteca Neon Club (París) - 6 máquinas
            { name: 'Cyber Sapo 010', location_id: 4, status: 'available' },
            { name: 'Cyber Sapo 011', location_id: 4, status: 'available' },
            { name: 'Cyber Sapo 012', location_id: 4, status: 'occupied' },
            { name: 'Cyber Sapo 013', location_id: 4, status: 'occupied' },
            { name: 'Cyber Sapo 014', location_id: 4, status: 'available' },
            { name: 'Cyber Sapo 015', location_id: 4, status: 'offline' },
            
            // Café Central (Roma) - 2 máquinas
            { name: 'Cyber Sapo 016', location_id: 5, status: 'available' },
            { name: 'Cyber Sapo 017', location_id: 5, status: 'available' },
            
            // Hotel Cyber Palace (Las Vegas) - 8 máquinas
            { name: 'Cyber Sapo 018', location_id: 6, status: 'available' },
            { name: 'Cyber Sapo 019', location_id: 6, status: 'occupied' },
            { name: 'Cyber Sapo 020', location_id: 6, status: 'available' },
            { name: 'Cyber Sapo 021', location_id: 6, status: 'occupied' },
            { name: 'Cyber Sapo 022', location_id: 6, status: 'available' },
            { name: 'Cyber Sapo 023', location_id: 6, status: 'offline' },
            { name: 'Cyber Sapo 024', location_id: 6, status: 'available' },
            { name: 'Cyber Sapo 025', location_id: 6, status: 'occupied' },
            
            // Casino Royal (Monte Carlo) - 5 máquinas
            { name: 'Cyber Sapo 026', location_id: 7, status: 'available' },
            { name: 'Cyber Sapo 027', location_id: 7, status: 'available' },
            { name: 'Cyber Sapo 028', location_id: 7, status: 'occupied' },
            { name: 'Cyber Sapo 029', location_id: 7, status: 'available' },
            { name: 'Cyber Sapo 030', location_id: 7, status: 'offline' },
            
            // Mall Cyber Plaza (Tokio) - 10 máquinas
            { name: 'Cyber Sapo 031', location_id: 8, status: 'available' },
            { name: 'Cyber Sapo 032', location_id: 8, status: 'available' },
            { name: 'Cyber Sapo 033', location_id: 8, status: 'occupied' },
            { name: 'Cyber Sapo 034', location_id: 8, status: 'occupied' },
            { name: 'Cyber Sapo 035', location_id: 8, status: 'available' },
            { name: 'Cyber Sapo 036', location_id: 8, status: 'occupied' },
            { name: 'Cyber Sapo 037', location_id: 8, status: 'available' },
            { name: 'Cyber Sapo 038', location_id: 8, status: 'offline' },
            { name: 'Cyber Sapo 039', location_id: 8, status: 'available' },
            { name: 'Cyber Sapo 040', location_id: 8, status: 'occupied' },
            
            // Bar La Cantina (Ciudad de México) - 3 máquinas
            { name: 'Cyber Sapo 041', location_id: 9, status: 'available' },
            { name: 'Cyber Sapo 042', location_id: 9, status: 'occupied' },
            { name: 'Cyber Sapo 043', location_id: 9, status: 'available' },
            
            // Pub Irish Corner (Dublín) - 4 máquinas
            { name: 'Cyber Sapo 044', location_id: 10, status: 'available' },
            { name: 'Cyber Sapo 045', location_id: 10, status: 'available' },
            { name: 'Cyber Sapo 046', location_id: 10, status: 'occupied' },
            { name: 'Cyber Sapo 047', location_id: 10, status: 'offline' }
        ];
        
        // Insertar máquinas
        const machineStmt = db.prepare(`
            INSERT INTO machines (name, location_id, status)
            VALUES (?, ?, ?)
        `);
        
        machines.forEach(machine => {
            machineStmt.run(machine.name, machine.location_id, machine.status);
        });
        machineStmt.finalize();
        
        console.log('✅ Datos de prueba insertados correctamente:');
        console.log(`   - ${locations.length} ubicaciones en ${new Set(locations.map(l => l.country)).size} países`);
        console.log(`   - ${machines.length} máquinas distribuidas`);
        console.log(`   - 9 tipos de negocio disponibles`);
    });
}

// NUEVOS ENDPOINTS PARA LA APP MÓVIL

// Obtener máquinas por ubicación con QR
app.get('/api/locations/:id/machines', (req, res) => {
    const locationId = req.params.id;
    
    const query = `
        SELECT 
            m.*,
            COUNT(g.id) as total_games,
            ROUND(SUM(g.revenue), 2) as total_revenue
        FROM machines m
        LEFT JOIN games g ON m.id = g.machine_id
        WHERE m.location_id = ?
        GROUP BY m.id
        ORDER BY m.name
    `;

    db.all(query, [locationId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error obteniendo máquinas' });
        }

        res.json({
            success: true,
            data: rows
        });
    });
});

// Conectar por QR (código de máquina)
app.post('/api/machines/connect-qr', (req, res) => {
    const { qr_code, player_id } = req.body;
    
    // El QR code contiene el ID de la máquina
    const machineId = qr_code.replace('CYBER-', '');
    
    db.get("SELECT m.*, l.name as location_name FROM machines m LEFT JOIN locations l ON m.location_id = l.id WHERE m.id = ?", [machineId], (err, machine) => {
        if (err || !machine) {
            return res.status(404).json({ error: 'Código QR inválido' });
        }

        if (machine.status !== 'available') {
            return res.status(400).json({ error: 'Máquina no disponible' });
        }

        res.json({
            success: true,
            message: `Conectado a ${machine.name}`,
            machine: {
                id: machine.id,
                name: machine.name,
                location: machine.location_name,
                status: machine.status
            }
        });
    });
});

// Rankings
app.get('/api/rankings/:type', (req, res) => {
    const { type } = req.params;
    const { country, city } = req.query;
    
    let query = `
        SELECT 
            p.id,
            p.name,
            p.country,
            p.city,
            p.best_score,
            p.total_games,
            p.wins,
            p.accuracy,
            ROW_NUMBER() OVER (ORDER BY p.best_score DESC) as position
        FROM players p
        WHERE p.total_games > 0
    `;
    
    let params = [];
    
    if (type === 'national' && country) {
        query += ' AND p.country = ?';
        params.push(country);
    } else if (type === 'local' && city) {
        query += ' AND p.city = ?';
        params.push(city);
    }
    
    query += ' ORDER BY p.best_score DESC LIMIT 50';
    
    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error obteniendo ranking' });
        }

        res.json({
            success: true,
            data: rows
        });
    });
});

// Torneos
app.get('/api/tournaments', (req, res) => {
    const query = `
        SELECT 
            t.*,
            l.name as location_name,
            l.city as location_city,
            COUNT(tp.id) as participants_count
        FROM tournaments t
        LEFT JOIN locations l ON t.location_id = l.id
        LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
        WHERE t.status IN ('upcoming', 'active')
        GROUP BY t.id
        ORDER BY t.start_date ASC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error obteniendo torneos' });
        }

        res.json({
            success: true,
            data: rows
        });
    });
});

// Retos semanales
app.get('/api/challenges/weekly', (req, res) => {
    const { player_id } = req.query;
    
    const query = `
        SELECT 
            wc.*,
            pcp.current_progress,
            pcp.completed
        FROM weekly_challenges wc
        LEFT JOIN player_challenge_progress pcp ON wc.id = pcp.challenge_id AND pcp.player_id = ?
        WHERE wc.active = 1 AND wc.end_date >= date('now')
        ORDER BY wc.created_at ASC
    `;
    
    db.all(query, [player_id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error obteniendo retos' });
        }

        res.json({
            success: true,
            data: rows
        });
    });
});

// Inicializar base de datos y servidor
initializeDatabase();

// Insertar datos de prueba después de inicializar la base de datos
setTimeout(() => {
    insertTestData();
}, 1000);

app.listen(PORT, () => {
    console.log(`🚀 CYBER SAPO Backend ejecutándose en puerto ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🎮 Máquinas: http://localhost:${PORT}/api/machines`);
    console.log(`🏢 Ubicaciones: http://localhost:${PORT}/api/locations`);
    console.log(`🎯 Panel Admin: http://localhost:8080/admin.html`);
});

// Manejo de cierre
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error cerrando base de datos:', err);
        } else {
            console.log('✅ Base de datos cerrada correctamente');
        }
        process.exit(0);
    });
});
