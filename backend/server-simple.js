const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint de salud del backend
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        status: 'online',
        timestamp: new Date().toISOString(),
        message: 'Backend funcionando correctamente'
    });
});

// Base de datos
const dbPath = path.join(__dirname, 'cyber_sapo_simple.db');
const db = new sqlite3.Database(dbPath);

// Inicializar base de datos
function initDB() {
    console.log('🔧 Inicializando base de datos...');
    
    // Crear tablas
    db.serialize(() => {
        // Tabla de tipos de negocio
        db.run(`CREATE TABLE IF NOT EXISTS business_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            icon TEXT DEFAULT '🏢',
            description TEXT,
            active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Tabla de ubicaciones
        db.run(`CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            country TEXT NOT NULL,
            city TEXT NOT NULL,
            address TEXT,
            phone TEXT,
            email TEXT,
            business_type TEXT DEFAULT 'other',
            description TEXT,
            latitude REAL,
            longitude REAL,
            active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Tabla de máquinas
        db.run(`CREATE TABLE IF NOT EXISTS machines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            location_id INTEGER NOT NULL,
            status TEXT DEFAULT 'available',
            total_games INTEGER DEFAULT 0,
            total_revenue REAL DEFAULT 0.0,
            total_playtime INTEGER DEFAULT 0,
            last_game_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (location_id) REFERENCES locations (id)
        )`);

        // Tabla de partidas
        db.run(`CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            machine_id INTEGER NOT NULL,
            location_id INTEGER NOT NULL,
            players_count INTEGER NOT NULL,
            game_type TEXT DEFAULT 'individual',
            duration_seconds INTEGER NOT NULL,
            revenue REAL NOT NULL,
            credits_used INTEGER DEFAULT 1,
            winner_score INTEGER,
            total_score INTEGER,
            started_at DATETIME NOT NULL,
            ended_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (machine_id) REFERENCES machines (id),
            FOREIGN KEY (location_id) REFERENCES locations (id)
        )`);

        // Tabla de métricas diarias por máquina
        db.run(`CREATE TABLE IF NOT EXISTS daily_machine_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            machine_id INTEGER NOT NULL,
            location_id INTEGER NOT NULL,
            date DATE NOT NULL,
            games_count INTEGER DEFAULT 0,
            total_revenue REAL DEFAULT 0.0,
            total_playtime INTEGER DEFAULT 0,
            avg_players REAL DEFAULT 0.0,
            avg_duration REAL DEFAULT 0.0,
            peak_hour INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(machine_id, date),
            FOREIGN KEY (machine_id) REFERENCES machines (id),
            FOREIGN KEY (location_id) REFERENCES locations (id)
        )`);

        // Tabla de métricas por hora
        db.run(`CREATE TABLE IF NOT EXISTS hourly_machine_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            machine_id INTEGER NOT NULL,
            location_id INTEGER NOT NULL,
            date DATE NOT NULL,
            hour INTEGER NOT NULL,
            games_count INTEGER DEFAULT 0,
            revenue REAL DEFAULT 0.0,
            playtime INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(machine_id, date, hour),
            FOREIGN KEY (machine_id) REFERENCES machines (id),
            FOREIGN KEY (location_id) REFERENCES locations (id)
        )`);

        // Insertar tipos de negocio por defecto
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

        const stmt = db.prepare(`INSERT OR IGNORE INTO business_types (name, icon, description) VALUES (?, ?, ?)`);
        businessTypes.forEach(type => {
            stmt.run(type.name, type.icon, type.description);
        });
        stmt.finalize();

        console.log('✅ Base de datos inicializada');
        insertTestData();
    });
}

// Insertar datos de prueba
function insertTestData() {
    db.get("SELECT COUNT(*) as count FROM locations", [], (err, row) => {
        if (err || row.count > 0) {
            console.log('📊 Datos existentes encontrados');
            return;
        }
        
        console.log('📝 Insertando datos de prueba...');
        
        const locations = [
            // Madrid - 8 ubicaciones
            { name: 'Bar El Sapo Dorado', country: 'España', city: 'Madrid', address: 'Calle Mayor 123', phone: '+34 91 123 4567', email: 'info@sapodorado.es', business_type: 'bar', description: 'Bar tradicional en el centro histórico' },
            { name: 'Pub The Golden Frog', country: 'España', city: 'Madrid', address: 'Gran Vía 456', phone: '+34 91 234 5678', email: 'contact@goldenfrog.es', business_type: 'pub', description: 'Pub irlandés con ambiente auténtico' },
            { name: 'Casino Royal Madrid', country: 'España', city: 'Madrid', address: 'Paseo de la Castellana 100', phone: '+34 91 345 6789', email: 'info@royalmadrid.es', business_type: 'casino', description: 'Casino de lujo en zona premium' },
            { name: 'Discoteca Neon Dreams', country: 'España', city: 'Madrid', address: 'Calle Serrano 200', phone: '+34 91 456 7890', email: 'info@neondreams.es', business_type: 'disco', description: 'La discoteca más moderna de Madrid' },
            { name: 'Lounge Cyber Space', country: 'España', city: 'Madrid', address: 'Plaza de Cibeles 5', phone: '+34 91 567 8901', email: 'reservas@cyberspace.es', business_type: 'hotel', description: 'Lounge futurista con tecnología avanzada' },
            { name: 'Restaurante La Rana Gourmet', country: 'España', city: 'Madrid', address: 'Calle Alcalá 300', phone: '+34 91 678 9012', email: 'reservas@ranagourmet.es', business_type: 'restaurant', description: 'Alta cocina con entretenimiento' },
            { name: 'Hotel Sapo Palace', country: 'España', city: 'Madrid', address: 'Plaza Mayor 10', phone: '+34 91 789 0123', email: 'info@sapopalace.es', business_type: 'hotel', description: 'Hotel 5 estrellas con zona de juegos' },
            { name: 'Café Central Frog', country: 'España', city: 'Madrid', address: 'Puerta del Sol 15', phone: '+34 91 890 1234', email: 'info@centralfrog.es', business_type: 'cafe', description: 'Café tradicional con juegos' },
            
            // Barcelona - 6 ubicaciones
            { name: 'Bar Mediterráneo Sapo', country: 'España', city: 'Barcelona', address: 'Las Ramblas 100', phone: '+34 93 123 4567', email: 'info@medisapo.es', business_type: 'bar', description: 'Bar mediterráneo en Las Ramblas' },
            { name: 'Pub British Frog', country: 'España', city: 'Barcelona', address: 'Passeig de Gràcia 150', phone: '+34 93 234 5678', email: 'info@britishfrog.es', business_type: 'pub', description: 'Pub británico auténtico' },
            { name: 'Casino Barcelona Deluxe', country: 'España', city: 'Barcelona', address: 'Port Olímpic 25', phone: '+34 93 345 6789', email: 'info@casinobcn.es', business_type: 'casino', description: 'Casino frente al mar' },
            { name: 'Discoteca Pacha Sapo', country: 'España', city: 'Barcelona', address: 'Av. Diagonal 400', phone: '+34 93 456 7890', email: 'info@pachasapo.es', business_type: 'disco', description: 'Discoteca icónica de Barcelona' },
            { name: 'Lounge Sky Frog', country: 'España', city: 'Barcelona', address: 'Torre Agbar 50F', phone: '+34 93 567 8901', email: 'info@skyfrog.es', business_type: 'hotel', description: 'Lounge en las alturas con vistas panorámicas' },
            { name: 'Restaurante Gaudí Rana', country: 'España', city: 'Barcelona', address: 'Park Güell 1', phone: '+34 93 678 9012', email: 'info@gaudirama.es', business_type: 'restaurant', description: 'Restaurante temático modernista' },
            
            // Valencia - 4 ubicaciones
            { name: 'Bar Ciudad de las Artes', country: 'España', city: 'Valencia', address: 'Ciudad de las Artes 1', phone: '+34 96 123 4567', email: 'info@artesapo.es', business_type: 'bar', description: 'Bar futurista junto a la Ciudad de las Artes' },
            { name: 'Pub Fallas Frog', country: 'España', city: 'Valencia', address: 'Plaza del Ayuntamiento 10', phone: '+34 96 234 5678', email: 'info@fallasfrog.es', business_type: 'pub', description: 'Pub temático de las Fallas' },
            { name: 'Casino Mediterráneo', country: 'España', city: 'Valencia', address: 'Malvarosa Beach 50', phone: '+34 96 345 6789', email: 'info@casinomed.es', business_type: 'casino', description: 'Casino frente a la playa' },
            { name: 'Discoteca Paella Club', country: 'España', city: 'Valencia', address: 'Barrio del Carmen 20', phone: '+34 96 456 7890', email: 'info@paellaclub.es', business_type: 'disco', description: 'Discoteca en el casco histórico' },
            
            // Sevilla - 3 ubicaciones
            { name: 'Bar Flamenco Sapo', country: 'España', city: 'Sevilla', address: 'Barrio Santa Cruz 15', phone: '+34 95 123 4567', email: 'info@flamencosapo.es', business_type: 'bar', description: 'Bar flamenco tradicional' },
            { name: 'Casino Guadalquivir', country: 'España', city: 'Sevilla', address: 'Isla de la Cartuja 100', phone: '+34 95 234 5678', email: 'info@casinoguad.es', business_type: 'casino', description: 'Casino junto al río' },
            { name: 'Discoteca Giralda Night', country: 'España', city: 'Sevilla', address: 'Av. de la Constitución 200', phone: '+34 95 345 6789', email: 'info@giraldanight.es', business_type: 'disco', description: 'Discoteca con vistas a la Giralda' },
            
            // Bilbao - 2 ubicaciones
            { name: 'Bar Guggenheim Frog', country: 'España', city: 'Bilbao', address: 'Museo Guggenheim 2', phone: '+34 94 123 4567', email: 'info@guggenheimfrog.es', business_type: 'bar', description: 'Bar moderno junto al Guggenheim' },
            { name: 'Casino Nervión', country: 'España', city: 'Bilbao', address: 'Gran Vía 300', phone: '+34 94 234 5678', email: 'info@casinonervion.es', business_type: 'casino', description: 'Casino en el centro de Bilbao' }
        ];

        const locationStmt = db.prepare(`INSERT INTO locations (name, country, city, address, phone, email, business_type, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        locations.forEach(loc => {
            locationStmt.run(loc.name, loc.country, loc.city, loc.address, loc.phone, loc.email, loc.business_type, loc.description);
        });
        locationStmt.finalize();

        // Generar máquinas dinámicamente (2-8 por ubicación)
        const machines = [];
        const machinesPerLocation = [4, 5, 8, 6, 7, 3, 5, 2, 4, 5, 8, 6, 4, 3, 3, 4, 6, 5, 3, 6, 4, 3, 5];
        const statuses = ['available', 'occupied', 'offline'];
        
        let machineCounter = 1;
        machinesPerLocation.forEach((count, locationIndex) => {
            const locationId = locationIndex + 1;
            for (let i = 1; i <= count; i++) {
                const machineName = `CYBER-${String(machineCounter).padStart(3, '0')}`;
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                machines.push({
                    name: machineName,
                    location_id: locationId,
                    status: status,
                    total_games: 0,
                    total_revenue: 0,
                    total_playtime: 0
                });
                machineCounter++;
            }
        });
        
        console.log(`🎰 Generando ${machines.length} máquinas...`);

        const machineStmt = db.prepare(`INSERT INTO machines (name, location_id, status, total_games, total_revenue, total_playtime) VALUES (?, ?, ?, ?, ?, ?)`);
        machines.forEach(machine => {
            machineStmt.run(machine.name, machine.location_id, machine.status, machine.total_games, machine.total_revenue, machine.total_playtime);
        });
        machineStmt.finalize();

        // Insertar partidas de ejemplo para los últimos 30 días
        insertSampleGames();

        console.log(`✅ Datos de prueba insertados: ${locations.length} ubicaciones, ${machines.length} máquinas con métricas extensas`);
    });
}

// Función para insertar partidas de ejemplo
function insertSampleGames() {
    const gameTypes = ['individual', 'parejas', 'equipos'];
    const revenues = [2.50, 5.00, 7.50]; // Precios por tipo de juego
    
    // Generar partidas para los últimos 30 días
    const games = [];
    const now = new Date();
    
    // Obtener información de máquinas y ubicaciones para patrones realistas
    db.all(`SELECT m.id as machine_id, m.location_id, l.business_type 
            FROM machines m 
            JOIN locations l ON m.location_id = l.id`, [], (err, machineData) => {
        if (err) {
            console.error('Error obteniendo máquinas:', err);
            return;
        }
        
        // Patrones de actividad por tipo de negocio
        const businessPatterns = {
            'bar': { peakHours: [19, 20, 21, 22], baseGames: 15, weekendMultiplier: 1.3 },
            'pub': { peakHours: [20, 21, 22, 23], baseGames: 18, weekendMultiplier: 1.4 },
            'casino': { peakHours: [21, 22, 23, 0, 1], baseGames: 35, weekendMultiplier: 1.6 },
            'disco': { peakHours: [23, 0, 1, 2], baseGames: 25, weekendMultiplier: 2.0 },
            'restaurant': { peakHours: [13, 14, 20, 21], baseGames: 12, weekendMultiplier: 1.2 },
            'hotel': { peakHours: [19, 20, 21, 22], baseGames: 20, weekendMultiplier: 1.5 },
            'cafe': { peakHours: [11, 12, 17, 18], baseGames: 8, weekendMultiplier: 1.0 }
        };
        
        console.log(`🎮 Generando partidas para ${machineData.length} máquinas (90 días)...`);
        
        const gameStmt = db.prepare(`INSERT INTO games (machine_id, location_id, game_type, players, duration, revenue, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        let totalGames = 0;
        
        // Generar partidas para los últimos 90 días
        for (let day = 0; day < 90; day++) {
            const date = new Date(now);
            date.setDate(date.getDate() - day);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            
            machineData.forEach(machine => {
                const pattern = businessPatterns[machine.business_type] || businessPatterns['bar'];
                const weekendMultiplier = isWeekend ? pattern.weekendMultiplier : 1.0;
                const dailyGames = Math.floor((pattern.baseGames * weekendMultiplier) * (0.7 + Math.random() * 0.6));
                
                for (let game = 0; game < dailyGames; game++) {
                    // Determinar hora del juego con patrones realistas
                    let hour;
                    if (Math.random() < 0.7 && pattern.peakHours.length > 0) {
                        hour = pattern.peakHours[Math.floor(Math.random() * pattern.peakHours.length)];
                    } else {
                        hour = Math.floor(Math.random() * 24);
                    }
                    
                    const minute = Math.floor(Math.random() * 60);
                    const gameDate = new Date(date);
                    gameDate.setHours(hour, minute, 0, 0);
                    
                    const gameTypeIndex = Math.floor(Math.random() * gameTypes.length);
                    const gameType = gameTypes[gameTypeIndex];
                    
                    // Número de jugadores más variado
                    let playersCount;
                    if (gameType === 'individual') {
                        playersCount = Math.floor(Math.random() * 6) + 1;
                    } else if (gameType === 'parejas') {
                        const parejas = Math.floor(Math.random() * 4) + 2;
                        playersCount = parejas * 2;
                    } else {
                        const equipos = Math.floor(Math.random() * 3) + 2;
                        playersCount = equipos * 3;
                    }
                    
                    // Duración más realista (3-20 minutos)
                    const baseDuration = gameType === 'individual' ? 300 : gameType === 'parejas' ? 600 : 900;
                    const duration = Math.floor(Math.random() * baseDuration) + baseDuration * 0.5;
                    
                    // Revenue basado en tipo de negocio
                    let baseRevenue;
                    switch (machine.business_type) {
                        case 'casino': baseRevenue = 12; break;
                        case 'hotel': baseRevenue = 8; break;
                        case 'disco': baseRevenue = 6; break;
                        case 'pub': baseRevenue = 5; break;
                        case 'bar': baseRevenue = 4; break;
                        case 'restaurant': baseRevenue = 4; break;
                        case 'cafe': baseRevenue = 3; break;
                        default: baseRevenue = 4;
                    }
                    
                    const gameMultiplier = gameType === 'equipos' ? 1.5 : gameType === 'parejas' ? 1.2 : 1.0;
                    const revenue = Math.round((baseRevenue * gameMultiplier * (0.8 + Math.random() * 0.4)) * 100) / 100;
                    
                    gameStmt.run(machine.machine_id, machine.location_id, gameType, playersCount, Math.round(duration), revenue, gameDate.toISOString());
                    totalGames++;
                }
            });
            
            // Progreso cada 15 días
            if (day % 15 === 0) {
                console.log(`📊 Progreso: ${day + 1}/90 días procesados...`);
            }
        }
        
        gameStmt.finalize();
        console.log(`🎉 ¡Dataset completo! ${totalGames.toLocaleString()} partidas generadas`);
        
        // Actualizar estadísticas de máquinas
        updateMachineStatistics();
    });
}

// Función para actualizar estadísticas de máquinas
function updateMachineStatistics() {
    console.log('📈 Actualizando estadísticas de máquinas...');
    
    db.run(`UPDATE machines SET 
                total_games = (SELECT COUNT(*) FROM games WHERE machine_id = machines.id),
                total_revenue = (SELECT ROUND(SUM(revenue), 2) FROM games WHERE machine_id = machines.id),
                total_playtime = (SELECT SUM(duration) FROM games WHERE machine_id = machines.id),
                last_game_at = (SELECT MAX(created_at) FROM games WHERE machine_id = machines.id)`, [], (err) => {
        if (err) {
            console.error('Error actualizando máquinas:', err);
        } else {
            console.log('✅ Estadísticas de máquinas actualizadas');
            generateAggregatedStats();
        }
    });
}

// Función para generar estadísticas agregadas
function generateAggregatedStats() {
    console.log('📊 Generando estadísticas agregadas...');
    
    // Generar estadísticas diarias
    db.run(`INSERT OR REPLACE INTO daily_machine_stats (machine_id, location_id, date, games_count, total_revenue, total_playtime, avg_players, avg_duration)
            SELECT 
                machine_id,
                location_id,
                DATE(created_at) as date,
                COUNT(*) as games_count,
                ROUND(SUM(revenue), 2) as total_revenue,
                SUM(duration) as total_playtime,
                ROUND(AVG(players), 1) as avg_players,
                ROUND(AVG(duration), 0) as avg_duration
            FROM games 
            GROUP BY machine_id, location_id, DATE(created_at)`, [], (err) => {
        if (err) {
            console.error('Error generando estadísticas diarias:', err);
        } else {
            console.log('✅ Estadísticas diarias generadas');
        }
    });
    
    // Generar estadísticas horarias
    db.run(`INSERT OR REPLACE INTO hourly_machine_stats (machine_id, location_id, date, hour, games_count, revenue, playtime)
            SELECT 
                machine_id,
                location_id,
                DATE(created_at) as date,
                CAST(strftime('%H', created_at) AS INTEGER) as hour,
                COUNT(*) as games_count,
                ROUND(SUM(revenue), 2) as revenue,
                SUM(duration) as playtime
            FROM games 
            GROUP BY machine_id, location_id, DATE(created_at), CAST(strftime('%H', created_at) AS INTEGER)`, [], (err) => {
        if (err) {
            console.error('Error generando estadísticas horarias:', err);
        } else {
            console.log('✅ Estadísticas horarias generadas');
            showFinalSummary();
        }
    });
}

// Mostrar resumen final del dataset
function showFinalSummary() {
    db.get(`SELECT 
                COUNT(*) as total_games,
                COUNT(DISTINCT machine_id) as total_machines,
                COUNT(DISTINCT location_id) as total_locations,
                ROUND(SUM(revenue), 2) as total_revenue,
                ROUND(AVG(revenue), 2) as avg_revenue,
                MIN(DATE(created_at)) as first_game,
                MAX(DATE(created_at)) as last_game
            FROM games`, [], (err, summary) => {
        if (!err && summary) {
            console.log('\n🎯 ===== RESUMEN DEL DATASET EXTENSO =====');
            console.log(`🎮 Total de partidas: ${summary.total_games.toLocaleString()}`);
            console.log(`🎰 Máquinas activas: ${summary.total_machines}`);
            console.log(`🏢 Ubicaciones: ${summary.total_locations}`);
            console.log(`💰 Recaudación total: €${summary.total_revenue.toLocaleString()}`);
            console.log(`📊 Promedio por partida: €${summary.avg_revenue}`);
            console.log(`📅 Período: ${summary.first_game} a ${summary.last_game}`);
            console.log('==========================================\n');
        }
    });
}

// Función principal de inserción de partidas
function insertSampleGames() {
    const gameTypes = ['individual', 'parejas', 'equipos'];
    const now = new Date();
    
    // Obtener información de máquinas y ubicaciones para patrones realistas
    db.all(`SELECT m.id as machine_id, m.location_id, l.business_type 
            FROM machines m 
            JOIN locations l ON m.location_id = l.id`, [], (err, machineData) => {
        if (err) {
            console.error('Error obteniendo máquinas:', err);
            return;
        }
        
        // Patrones de actividad por tipo de negocio
        const businessPatterns = {
            'bar': { peakHours: [19, 20, 21, 22], baseGames: 15, weekendMultiplier: 1.3 },
            'pub': { peakHours: [20, 21, 22, 23], baseGames: 18, weekendMultiplier: 1.4 },
            'casino': { peakHours: [21, 22, 23, 0, 1], baseGames: 35, weekendMultiplier: 1.6 },
            'disco': { peakHours: [23, 0, 1, 2], baseGames: 25, weekendMultiplier: 2.0 },
            'restaurant': { peakHours: [13, 14, 20, 21], baseGames: 12, weekendMultiplier: 1.2 },
            'hotel': { peakHours: [19, 20, 21, 22], baseGames: 20, weekendMultiplier: 1.5 },
            'cafe': { peakHours: [11, 12, 17, 18], baseGames: 8, weekendMultiplier: 1.0 }
        };
        
        console.log(`🎮 Generando partidas para ${machineData.length} máquinas (90 días - 3 meses completos)...`);
        
        const games = [];
        let totalRevenue = 0;
        
        // Generar partidas para los últimos 90 días (3 meses completos)
        for (let day = 0; day < 90; day++) {
            const date = new Date(now);
            date.setDate(date.getDate() - day);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            
            machineData.forEach(machine => {
                const pattern = businessPatterns[machine.business_type] || businessPatterns['bar'];
                const weekendMultiplier = isWeekend ? pattern.weekendMultiplier : 1.0;
                const dailyGames = Math.floor((pattern.baseGames * weekendMultiplier) * (0.7 + Math.random() * 0.6));
                
                for (let game = 0; game < dailyGames; game++) {
                    // Determinar hora del juego con patrones realistas
                    let hour;
                    if (Math.random() < 0.7 && pattern.peakHours.length > 0) {
                        hour = pattern.peakHours[Math.floor(Math.random() * pattern.peakHours.length)];
                    } else {
                        hour = Math.floor(Math.random() * 24);
                    }
                    
                    const minute = Math.floor(Math.random() * 60);
                    const gameDate = new Date(date);
                    gameDate.setHours(hour, minute, 0, 0);
                    
                    const gameTypeIndex = Math.floor(Math.random() * gameTypes.length);
                    const gameType = gameTypes[gameTypeIndex];
                    
                    // Número de jugadores más variado
                    let playersCount;
                    if (gameType === 'individual') {
                        playersCount = Math.floor(Math.random() * 6) + 1;
                    } else if (gameType === 'parejas') {
                        const parejas = Math.floor(Math.random() * 4) + 2;
                        playersCount = parejas * 2;
                    } else {
                        const equipos = Math.floor(Math.random() * 3) + 2;
                        playersCount = equipos * 3;
                    }
                    
                    // Duración más realista (3-20 minutos)
                    const baseDuration = gameType === 'individual' ? 300 : gameType === 'parejas' ? 600 : 900;
                    const duration = Math.floor(Math.random() * baseDuration) + baseDuration * 0.5;
                    
                    // Revenue basado en tipo de negocio
                    let baseRevenue;
                    switch (machine.business_type) {
                        case 'casino': baseRevenue = 12; break;
                        case 'hotel': baseRevenue = 8; break;
                        case 'disco': baseRevenue = 6; break;
                        case 'pub': baseRevenue = 5; break;
                        case 'bar': baseRevenue = 4; break;
                        case 'restaurant': baseRevenue = 4; break;
                        case 'cafe': baseRevenue = 3; break;
                        default: baseRevenue = 4;
                    }
                    
                    const gameMultiplier = gameType === 'equipos' ? 1.5 : gameType === 'parejas' ? 1.2 : 1.0;
                    const revenue = Math.round((baseRevenue * gameMultiplier * (0.8 + Math.random() * 0.4)) * 100) / 100;
                    
                    const winnerScore = Math.floor(Math.random() * 5000) + 1000;
                    const totalScore = winnerScore + Math.floor(Math.random() * 2000);
                    
                    const endDate = new Date(gameDate);
                    endDate.setSeconds(endDate.getSeconds() + duration);
                    
                    games.push({
                        machine_id: machine.machine_id,
                        location_id: machine.location_id,
                        players_count: playersCount,
                        game_type: gameType,
                        duration_seconds: Math.round(duration),
                        revenue: revenue,
                        credits_used: gameTypeIndex + 1,
                        winner_score: winnerScore,
                        total_score: totalScore,
                        started_at: gameDate.toISOString(),
                        ended_at: endDate.toISOString()
                    });
                }
            });
            
            // Progreso cada 15 días
            if (day % 15 === 0) {
                console.log(`📊 Progreso: ${day + 1}/90 días procesados...`);
            }
        }
        
        // Insertar todas las partidas
        const gameStmt = db.prepare(`
            INSERT INTO games (machine_id, location_id, players_count, game_type, duration_seconds, 
                              revenue, credits_used, winner_score, total_score, started_at, ended_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        games.forEach(game => {
            gameStmt.run(
                game.machine_id, game.location_id, game.players_count, game.game_type,
                game.duration_seconds, game.revenue, game.credits_used, game.winner_score,
                game.total_score, game.started_at, game.ended_at
            );
        });
        gameStmt.finalize();
        
        console.log(`🎉 ¡Dataset completo! ${games.length.toLocaleString()} partidas generadas`);
        
        // Actualizar estadísticas de máquinas
        updateMachineStatistics();
    });
}

// Función para generar estadísticas diarias
function generateDailyStats() {
    const query = `
        INSERT OR REPLACE INTO daily_machine_stats 
        (machine_id, location_id, date, games_count, total_revenue, total_playtime, avg_players, avg_duration, peak_hour)
        SELECT 
            machine_id,
            location_id,
            DATE(started_at) as date,
            COUNT(*) as games_count,
            SUM(revenue) as total_revenue,
            SUM(duration_seconds) as total_playtime,
            AVG(CAST(players_count as REAL)) as avg_players,
            AVG(CAST(duration_seconds as REAL)) as avg_duration,
            (
                SELECT CAST(strftime('%H', started_at) as INTEGER)
                FROM games g2 
                WHERE g2.machine_id = g1.machine_id AND DATE(g2.started_at) = DATE(g1.started_at)
                GROUP BY CAST(strftime('%H', started_at) as INTEGER)
                ORDER BY COUNT(*) DESC
                LIMIT 1
            ) as peak_hour
        FROM games g1
        GROUP BY machine_id, location_id, DATE(started_at)
    `;
    
    db.run(query, [], (err) => {
        if (err) {
            console.error('Error generando estadísticas diarias:', err);
        } else {
            console.log('✅ Estadísticas diarias generadas');
        }
    });
}

// Función para actualizar estadísticas de máquinas
function updateMachineStatistics() {
    const query = `
        UPDATE machines 
        SET 
            total_games = (
                SELECT COUNT(*) 
                FROM games 
                WHERE games.machine_id = machines.id
            ),
            total_revenue = (
                SELECT COALESCE(SUM(revenue), 0) 
                FROM games 
                WHERE games.machine_id = machines.id
            ),
            total_playtime = (
                SELECT COALESCE(SUM(duration_seconds), 0) 
                FROM games 
                WHERE games.machine_id = machines.id
            ),
            last_game_at = (
                SELECT MAX(started_at) 
                FROM games 
                WHERE games.machine_id = machines.id
            )
    `;
    
    db.run(query, [], (err) => {
        if (err) {
            console.error('Error actualizando estadísticas de máquinas:', err);
        } else {
            console.log('✅ Estadísticas de máquinas actualizadas');
        }
    });
    
    // Generar estadísticas por hora
    const hourlyQuery = `
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
        GROUP BY machine_id, location_id, DATE(started_at), CAST(strftime('%H', started_at) as INTEGER)
    `;
    
    db.run(hourlyQuery, [], (err) => {
        if (err) {
            console.error('Error generando estadísticas por hora:', err);
        } else {
            console.log('✅ Estadísticas por hora generadas');
        }
    });
}

// ENDPOINTS

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'CYBER SAPO Backend funcionando correctamente' });
});

// Obtener ubicaciones con filtros y paginación
app.get('/api/locations', (req, res) => {
    const { page = 1, limit = 20, search, country, city, business_type } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE l.active = 1';
    let params = [];
    
    if (search) {
        whereClause += ' AND l.name LIKE ?';
        params.push(`%${search}%`);
    }
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
    
    const query = `
        SELECT l.*, bt.icon as business_type_icon, bt.description as business_type_description,
               COUNT(m.id) as machine_count,
               SUM(CASE WHEN m.status = 'available' THEN 1 ELSE 0 END) as available_machines,
               SUM(CASE WHEN m.status = 'occupied' THEN 1 ELSE 0 END) as occupied_machines,
               SUM(CASE WHEN m.status = 'offline' THEN 1 ELSE 0 END) as offline_machines
        FROM locations l
        LEFT JOIN business_types bt ON l.business_type = bt.name
        LEFT JOIN machines m ON l.id = m.location_id
        ${whereClause}
        GROUP BY l.id
        ORDER BY l.name
        LIMIT ? OFFSET ?
    `;
    
    params.push(parseInt(limit), parseInt(offset));
    
    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error obteniendo ubicaciones' });
        }
        
        // Contar total para paginación
        const countQuery = `SELECT COUNT(*) as total FROM locations l ${whereClause}`;
        const countParams = params.slice(0, -2); // Remover limit y offset
        
        db.get(countQuery, countParams, (err, countRow) => {
            if (err) {
                return res.status(500).json({ error: 'Error contando ubicaciones' });
            }
            
            const total = countRow.total;
            const pages = Math.ceil(total / limit);
            
            res.json({
                success: true,
                data: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total,
                    pages: pages
                }
            });
        });
    });
});

// Endpoint para registrar nuevas partidas (simulador)
app.post('/api/games', (req, res) => {
    const { machine_id, location_id, game_type, players, duration, revenue, created_at } = req.body;
    
    // Validar datos requeridos
    if (!machine_id || !location_id || !game_type || !players || !duration || !revenue) {
        return res.status(400).json({ 
            success: false, 
            error: 'Faltan datos requeridos: machine_id, location_id, game_type, players, duration, revenue' 
        });
    }
    
    // Insertar la partida
    const insertQuery = `INSERT INTO games 
        (machine_id, location_id, game_type, players, duration, revenue, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    const gameCreatedAt = created_at || new Date().toISOString();
    
    db.run(insertQuery, [machine_id, location_id, game_type, players, duration, revenue, gameCreatedAt], function(err) {
        if (err) {
            console.error('Error insertando partida:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Error al registrar la partida' 
            });
        }
        
        const gameId = this.lastID;
        console.log(`🎮 Nueva partida registrada: ID ${gameId}, Máquina ${machine_id}, ${players} jugadores, €${revenue}`);
        
        // Actualizar estadísticas de la máquina inmediatamente
        const updateMachineQuery = `UPDATE machines SET 
            total_games = (SELECT COUNT(*) FROM games WHERE machine_id = ?),
            total_revenue = (SELECT ROUND(SUM(revenue), 2) FROM games WHERE machine_id = ?),
            total_playtime = (SELECT SUM(duration) FROM games WHERE machine_id = ?),
            last_game_at = ?
            WHERE id = ?`;
        
        db.run(updateMachineQuery, [machine_id, machine_id, machine_id, gameCreatedAt, machine_id], (updateErr) => {
            if (updateErr) {
                console.error('Error actualizando estadísticas de máquina:', updateErr);
            } else {
                console.log(`📊 Estadísticas actualizadas para máquina ${machine_id}`);
            }
        });
        
        res.json({ 
            success: true, 
            gameId: gameId,
            message: 'Partida registrada exitosamente',
            data: {
                id: gameId,
                machine_id,
                location_id,
                game_type,
                players,
                duration,
                revenue,
                created_at: gameCreatedAt
            }
        });
    });
});

// Obtener máquinas
app.get('/api/machines', (req, res) => {
    const query = `
        SELECT m.*, l.name as location_name, l.city, l.country,
               ROUND(m.total_revenue / NULLIF(m.total_games, 0), 2) as avg_revenue_per_game,
               ROUND(m.total_playtime / NULLIF(m.total_games, 0), 2) as avg_duration_per_game
        FROM machines m 
        LEFT JOIN locations l ON m.location_id = l.id 
        ORDER BY m.name
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error obteniendo máquinas' });
        }
        res.json({ success: true, data: rows });
    });
});

// Obtener detalles completos de una máquina específica
app.get('/api/machines/:id', (req, res) => {
    const machineId = req.params.id;
    
    const machineQuery = `
        SELECT m.*, l.name as location_name, l.city, l.country, l.address,
               ROUND(m.total_revenue / NULLIF(m.total_games, 0), 2) as avg_revenue_per_game,
               ROUND(m.total_playtime / NULLIF(m.total_games, 0), 2) as avg_duration_per_game,
               ROUND(m.total_playtime / 3600.0, 2) as total_hours_played
        FROM machines m 
        LEFT JOIN locations l ON m.location_id = l.id 
        WHERE m.id = ?
    `;
    
    db.get(machineQuery, [machineId], (err, machine) => {
        if (err) {
            return res.status(500).json({ error: 'Error obteniendo máquina' });
        }
        
        if (!machine) {
            return res.status(404).json({ error: 'Máquina no encontrada' });
        }
        
        res.json({ success: true, data: machine });
    });
});

// Obtener estadísticas de una máquina específica
app.get('/api/machines/:id/stats', (req, res) => {
    const machineId = req.params.id;
    const { period = '30d' } = req.query;
    
    let dateFilter = '';
    switch(period) {
        case '7d':
            dateFilter = "AND created_at >= datetime('now', '-7 days')";
            break;
        case '30d':
            dateFilter = "AND created_at >= datetime('now', '-30 days')";
            break;
        case '90d':
            dateFilter = "AND created_at >= datetime('now', '-90 days')";
            break;
        case '1y':
            dateFilter = "AND created_at >= datetime('now', '-1 year')";
            break;
        case '2y':
            dateFilter = "AND created_at >= datetime('now', '-2 years')";
            break;
        case 'all':
            dateFilter = '';
            break;
        default:
            dateFilter = "AND created_at >= datetime('now', '-30 days')";
    }
    
    const queries = {
        // Estadísticas generales
        general: `
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
        `,
        
        // Tendencia diaria de ingresos
        daily_revenue: `
            SELECT 
                DATE(started_at) as date,
                COUNT(*) as games,
                COALESCE(SUM(revenue), 0) as revenue,
                COALESCE(SUM(duration_seconds), 0) as playtime
            FROM games 
            WHERE machine_id = ? ${dateFilter}
            GROUP BY DATE(started_at)
            ORDER BY date
        `,
        
        // Distribución por horas del día
        hourly_distribution: `
            SELECT 
                CAST(strftime('%H', started_at) as INTEGER) as hour,
                COUNT(*) as games,
                COALESCE(SUM(revenue), 0) as revenue
            FROM games 
            WHERE machine_id = ? ${dateFilter}
            GROUP BY CAST(strftime('%H', started_at) as INTEGER)
            ORDER BY hour
        `,
        
        // Distribución por días de la semana
        weekly_distribution: `
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
        `,
        
        // Distribución por tipo de juego
        game_type_distribution: `
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
        `,
        
        // Top 10 partidas más largas
        longest_games: `
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
        `,
        
        // Partidas recientes
        recent_games: `
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
        `
    };
    
    const results = {};
    let completed = 0;
    const total = Object.keys(queries).length;
    
    Object.entries(queries).forEach(([key, query]) => {
        db.all(query, [machineId], (err, rows) => {
            if (!err) {
                results[key] = rows;
            }
            completed++;
            
            if (completed === total) {
                res.json({ success: true, data: results });
            }
        });
    });
});

// Obtener tipos de negocio
app.get('/api/business-types', (req, res) => {
    db.all("SELECT * FROM business_types WHERE active = 1 ORDER BY name", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error obteniendo tipos de negocio' });
        }
        res.json({ success: true, data: rows });
    });
});

// Obtener países
app.get('/api/countries', (req, res) => {
    db.all("SELECT DISTINCT country FROM locations WHERE active = 1 AND country IS NOT NULL ORDER BY country", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error obteniendo países' });
        }
        res.json({ success: true, data: rows.map(row => row.country) });
    });
});

// Obtener ciudades
app.get('/api/cities', (req, res) => {
    const { country } = req.query;
    let query = "SELECT DISTINCT city FROM locations WHERE active = 1 AND city IS NOT NULL";
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
        res.json({ success: true, data: rows.map(row => row.city) });
    });
});

// Estadísticas de ubicaciones
app.get('/api/locations/stats', (req, res) => {
    const queries = {
        total: "SELECT COUNT(*) as count FROM locations WHERE active = 1",
        by_country: "SELECT country, COUNT(*) as count FROM locations WHERE active = 1 AND country IS NOT NULL GROUP BY country ORDER BY count DESC",
        by_type: "SELECT l.business_type, bt.icon, COUNT(*) as count FROM locations l LEFT JOIN business_types bt ON l.business_type = bt.name WHERE l.active = 1 GROUP BY l.business_type ORDER BY count DESC"
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
                res.json({ success: true, data: results });
            }
        });
    });
});

// Función para generar datos históricos automáticamente
function generateHistoricalDataOnce() {
    // Verificar si ya hay datos históricos
    db.get('SELECT COUNT(*) as count FROM games', [], (err, row) => {
        if (err || !row) {
            console.log('❌ Error verificando datos históricos');
            return;
        }
        
        if (row.count > 100) {
            console.log(`✅ Ya existen ${row.count} partidas históricas`);
            return;
        }
        
        console.log('🎮 Generando datos históricos únicos por máquina...');
        
        // Obtener máquinas
        db.all('SELECT id, location_id FROM machines', [], (err, machines) => {
            if (err || !machines.length) {
                console.log('❌ No se pudieron obtener máquinas');
                return;
            }
            
            const gameTypes = ['individual', 'parejas', 'equipos'];
            const now = new Date();
            let totalGames = 0;
            
            machines.forEach((machine, index) => {
                // Histórico variable: 3 meses a 2 años
                const minDays = 90;  // 3 meses
                const maxDays = 730; // 2 años
                const days = minDays + Math.floor(Math.random() * (maxDays - minDays));
                
                console.log(`   Máquina ${machine.id}: ${days} días de histórico`);
                
                // Generar partidas para este período
                for (let day = 0; day < days; day++) {
                    const date = new Date(now);
                    date.setDate(date.getDate() - day);
                    
                    // 5-25 partidas por día
                    const dailyGames = 5 + Math.floor(Math.random() * 20);
                    
                    for (let i = 0; i < dailyGames; i++) {
                        const gameType = gameTypes[Math.floor(Math.random() * 3)];
                        const players = 1 + Math.floor(Math.random() * 12); // 1-12 jugadores
                        const duration = 300 + Math.floor(Math.random() * 600); // 5-15 min
                        const revenue = Math.round((3 + Math.random() * 15) * 100) / 100; // €3-18
                        
                        const gameDate = new Date(date);
                        gameDate.setHours(
                            Math.floor(Math.random() * 24),
                            Math.floor(Math.random() * 60)
                        );
                        
                        // Insertar directamente sin preparar statement
                        db.run(
                            'INSERT INTO games (machine_id, location_id, game_type, players, duration, revenue, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            [machine.id, machine.location_id, gameType, players, duration, revenue, gameDate.toISOString()],
                            (err) => {
                                if (!err) totalGames++;
                            }
                        );
                    }
                }
            });
            
            // Actualizar estadísticas después de un tiempo
            setTimeout(() => {
                db.run(`UPDATE machines SET 
                        total_games = (SELECT COUNT(*) FROM games WHERE machine_id = machines.id),
                        total_revenue = (SELECT ROUND(SUM(revenue), 2) FROM games WHERE machine_id = machines.id)`, 
                [], (err) => {
                    if (!err) {
                        console.log(`✅ Datos históricos generados: ~${totalGames} partidas`);
                        console.log('📊 Estadísticas de máquinas actualizadas');
                    }
                });
            }, 5000);
        });
    });
}

// Inicializar y arrancar servidor
initDB();

app.listen(PORT, () => {
    console.log(`🚀 CYBER SAPO Backend con Analytics ejecutándose en puerto ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🏢 Ubicaciones: http://localhost:${PORT}/api/locations`);
    console.log(`🎮 Máquinas: http://localhost:${PORT}/api/machines`);
    console.log(`📈 Analytics: http://localhost:${PORT}/api/machines/:id/stats`);
    console.log(`🎯 Panel Admin: http://localhost:8080/admin.html`);
    
    // Generar datos históricos después de que el servidor esté listo
    setTimeout(() => {
        generateHistoricalDataOnce();
    }, 2000);
});

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
