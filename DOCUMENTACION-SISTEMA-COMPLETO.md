# 🎯 DOCUMENTACIÓN COMPLETA DEL SISTEMA CYBER SAPO

## 📋 ÍNDICE
1. [Visión General del Sistema](#visión-general-del-sistema)
2. [Arquitectura Completa](#arquitectura-completa)
3. [Base de Datos - Esquema y Relaciones](#base-de-datos)
4. [Backend - API REST](#backend-api-rest)
5. [Frontend - Interfaz de Usuario](#frontend-interfaz-de-usuario)
6. [Flujo de Datos Completo](#flujo-de-datos-completo)
7. [Cómo Funciona Cada Componente](#cómo-funciona-cada-componente)
8. [Interacciones Entre Componentes](#interacciones-entre-componentes)
9. [Guía de Desarrollo](#guía-de-desarrollo)

---

## 🎯 VISIÓN GENERAL DEL SISTEMA

CYBER SAPO es un sistema completo para gestionar máquinas de juego que incluye:

### 🎮 **COMPONENTES PRINCIPALES**
- **Frontend del Juego**: Interfaz donde los jugadores juegan
- **Panel de Administración**: Interfaz para gestionar máquinas y ubicaciones
- **Backend API**: Servidor que maneja toda la lógica de negocio
- **Base de Datos**: Almacena toda la información del sistema

### 🔄 **FLUJO BÁSICO**
1. **Jugador** usa el frontend para jugar una partida
2. **Frontend** envía datos de la partida al backend
3. **Backend** procesa y guarda en la base de datos
4. **Administrador** ve estadísticas en el panel de administración

---

## 🏗️ ARQUITECTURA COMPLETA

```
┌─────────────────────────────────────────────────────────────┐
│                    CYBER SAPO SYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   FRONTEND  │    │   BACKEND   │    │  DATABASE   │     │
│  │             │    │             │    │             │     │
│  │ 🎮 Juego    │◄──►│ 🚀 API REST │◄──►│ 🗄️ SQLite   │     │
│  │ 📊 Admin    │    │             │    │             │     │
│  │             │    │             │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 📁 **ESTRUCTURA DE CARPETAS**
```
cyber-sapo-clean/
├── frontend/                    # 🎮 INTERFAZ DE USUARIO
│   ├── src/                     # Código fuente organizado
│   │   ├── core/               # Motor del juego
│   │   ├── controladores/      # Manejo de entrada
│   │   ├── utilidades/         # Funciones auxiliares
│   │   └── estilos/           # CSS modular
│   ├── juego-simple.html       # Página del juego
│   └── admin.html             # Panel de administración
│
├── backend/                     # 🚀 SERVIDOR API
│   ├── src/                    # Código fuente organizado
│   │   ├── config/            # Configuración (base de datos)
│   │   ├── models/            # Lógica de negocio
│   │   ├── controllers/       # Manejo de peticiones HTTP
│   │   ├── routes/           # Definición de endpoints
│   │   └── server.js         # Servidor principal
│   └── cyber_sapo_simple.db   # 🗄️ Base de datos SQLite
│
└── DOCUMENTACION-SISTEMA-COMPLETO.md  # 📚 Esta documentación
```

---

## 🗄️ BASE DE DATOS - ESQUEMA Y RELACIONES

### 📊 **TABLAS Y SUS PROPÓSITOS**

#### 1. **business_types** - Tipos de Negocio
```sql
-- 🏢 Define los tipos de lugares donde pueden estar las máquinas
CREATE TABLE business_types (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE,           -- 'bar', 'casino', 'hotel', etc.
    icon TEXT,                  -- '🍺', '🎰', '🏨', etc.
    description TEXT,           -- Descripción del tipo
    active INTEGER DEFAULT 1   -- Si está activo o no
);
```

#### 2. **locations** - Ubicaciones
```sql
-- 🏢 Lugares donde están instaladas las máquinas
CREATE TABLE locations (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,         -- Nombre del lugar
    country TEXT NOT NULL,      -- País
    city TEXT NOT NULL,         -- Ciudad
    address TEXT,               -- Dirección completa
    phone TEXT,                 -- Teléfono de contacto
    email TEXT,                 -- Email de contacto
    business_type TEXT,         -- Conecta con business_types.name
    description TEXT,           -- Descripción del lugar
    latitude REAL,              -- Coordenada GPS
    longitude REAL,             -- Coordenada GPS
    active INTEGER DEFAULT 1,   -- Si está activo
    created_at DATETIME,        -- Cuándo se registró
    updated_at DATETIME         -- Última actualización
);
```

#### 3. **machines** - Máquinas
```sql
-- 🎰 Máquinas CYBER SAPO instaladas
CREATE TABLE machines (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,         -- Nombre único (ej: CYBER-001)
    location_id INTEGER,        -- En qué ubicación está
    status TEXT DEFAULT 'available',  -- 'available', 'occupied', 'offline'
    total_games INTEGER DEFAULT 0,    -- Total de partidas jugadas
    total_revenue REAL DEFAULT 0,     -- Total de dinero generado
    total_playtime INTEGER DEFAULT 0, -- Total de tiempo jugado (segundos)
    last_game_at DATETIME,            -- Cuándo fue la última partida
    created_at DATETIME,              -- Cuándo se instaló
    FOREIGN KEY (location_id) REFERENCES locations(id)
);
```

#### 4. **games** - Partidas
```sql
-- 🎮 Registro de cada partida jugada
CREATE TABLE games (
    id INTEGER PRIMARY KEY,
    machine_id INTEGER NOT NULL,      -- En qué máquina se jugó
    location_id INTEGER NOT NULL,     -- En qué ubicación
    players_count INTEGER NOT NULL,   -- Cuántos jugadores
    game_type TEXT DEFAULT 'individual', -- 'individual', 'parejas', 'equipos'
    duration_seconds INTEGER NOT NULL,   -- Duración en segundos
    revenue REAL NOT NULL,               -- Dinero generado
    credits_used INTEGER DEFAULT 1,      -- Créditos utilizados
    winner_score INTEGER,                -- Puntuación del ganador
    total_score INTEGER,                 -- Puntuación total
    started_at DATETIME NOT NULL,        -- Cuándo empezó
    ended_at DATETIME NOT NULL,          -- Cuándo terminó
    created_at DATETIME,                 -- Cuándo se registró
    FOREIGN KEY (machine_id) REFERENCES machines(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
);
```

#### 5. **daily_machine_stats** - Estadísticas Diarias
```sql
-- 📊 Resumen diario por máquina (para reportes rápidos)
CREATE TABLE daily_machine_stats (
    id INTEGER PRIMARY KEY,
    machine_id INTEGER NOT NULL,
    location_id INTEGER NOT NULL,
    date DATE NOT NULL,              -- Día (YYYY-MM-DD)
    games_count INTEGER DEFAULT 0,   -- Partidas jugadas ese día
    total_revenue REAL DEFAULT 0,    -- Ingresos del día
    total_playtime INTEGER DEFAULT 0, -- Tiempo jugado del día
    avg_players REAL DEFAULT 0,      -- Promedio de jugadores
    avg_duration REAL DEFAULT 0,     -- Duración promedio
    peak_hour INTEGER,               -- Hora de mayor actividad
    created_at DATETIME,
    UNIQUE(machine_id, date)         -- Un registro por máquina por día
);
```

### 🔗 **RELACIONES ENTRE TABLAS**

```
business_types ──┐
                 │
                 ▼
locations ──────────► machines ──────────► games
    │                    │                   │
    │                    ▼                   ▼
    └──────────► daily_machine_stats ◄──────┘
```

**Explicación de las relaciones:**
- Una **ubicación** puede tener muchas **máquinas**
- Una **máquina** puede tener muchas **partidas**
- Cada **partida** pertenece a una **máquina** y una **ubicación**
- Las **estadísticas** se calculan automáticamente desde las **partidas**

---

## 🚀 BACKEND - API REST

### 🏗️ **ARQUITECTURA LIMPIA DEL BACKEND**

```
┌─────────────────────────────────────────────────────────┐
│                    BACKEND LAYERS                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  HTTP Request                                           │
│       ↓                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │   ROUTES    │───►│ CONTROLLERS │───►│   MODELS    │ │
│  │             │    │             │    │             │ │
│  │ 🛤️ Endpoints │    │ 🎯 Validation│    │ 💾 Database │ │
│  │             │    │ 🔄 Logic     │    │ 🧮 Business │ │
│  └─────────────┘    └─────────────┘    └─────────────┘ │
│                                               ↓         │
│                                        ┌─────────────┐ │
│                                        │  DATABASE   │ │
│                                        │ 🗄️ SQLite   │ │
│                                        └─────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 📡 **ENDPOINTS DISPONIBLES**

#### 🎮 **PARTIDAS** (`/api/games`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/games` | Registrar nueva partida |
| `GET` | `/api/games` | Obtener lista de partidas |
| `GET` | `/api/games/:id` | Obtener partida específica |
| `GET` | `/api/games/stats` | Obtener estadísticas |
| `POST` | `/api/games/start` | Iniciar partida (ocupar máquina) |
| `POST` | `/api/games/end` | Finalizar partida (liberar máquina) |

#### 🎰 **MÁQUINAS** (`/api/machines`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/machines` | Registrar nueva máquina |
| `GET` | `/api/machines` | Obtener lista de máquinas |
| `GET` | `/api/machines/:id` | Obtener máquina específica |
| `GET` | `/api/machines/:id/status` | Obtener estado de máquina |
| `PUT` | `/api/machines/:id/status` | Cambiar estado de máquina |
| `GET` | `/api/machines/:id/stats` | Estadísticas de máquina |
| `GET` | `/api/machines/summary` | Resumen de todas las máquinas |

#### 🏢 **UBICACIONES** (`/api/locations`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/locations` | Registrar nueva ubicación |
| `GET` | `/api/locations` | Obtener lista de ubicaciones |
| `GET` | `/api/locations/:id` | Obtener ubicación específica |
| `PUT` | `/api/locations/:id` | Actualizar ubicación |
| `DELETE` | `/api/locations/:id` | Desactivar ubicación |
| `GET` | `/api/locations/:id/stats` | Estadísticas de ubicación |
| `GET` | `/api/locations/summary` | Resumen de ubicaciones |
| `GET` | `/api/locations/countries` | Lista de países |
| `GET` | `/api/locations/cities` | Lista de ciudades |

---

## 🎮 FRONTEND - INTERFAZ DE USUARIO

### 🏗️ **ARQUITECTURA LIMPIA DEL FRONTEND**

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND LAYERS                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  User Interaction                                       │
│       ↓                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │    HTML     │───►│ CONTROLLERS │───►│    CORE     │ │
│  │             │    │             │    │             │ │
│  │ 🖼️ Interface │    │ 🎮 Keyboard  │    │ 🧠 Game     │ │
│  │ 🎨 Styles    │    │ 🔄 Events    │    │ 💾 Logic    │ │
│  └─────────────┘    └─────────────┘    └─────────────┘ │
│                                               ↓         │
│                                        ┌─────────────┐ │
│                                        │ UTILITIES   │ │
│                                        │ 🔧 Helpers  │ │
│                                        └─────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 📁 **COMPONENTES DEL FRONTEND**

#### 1. **core/GameEngine.js** - Motor del Juego
```javascript
// 🧠 RESPONSABILIDADES:
// - Manejar toda la lógica del juego
// - Controlar turnos de jugadores
// - Calcular puntuaciones
// - Gestionar estados del juego

class GameEngine {
    constructor()           // Inicializar el juego
    iniciarJuego()         // Empezar nueva partida
    agregarPuntos()        // Sumar puntos a jugador actual
    cambiarJugador()       // Pasar al siguiente jugador
    terminarJuego()        // Finalizar partida
    obtenerEstadisticas()  // Calcular estadísticas finales
}
```

#### 2. **controladores/ControladorTeclado.js** - Manejo de Entrada
```javascript
// 🎮 RESPONSABILIDADES:
// - Escuchar eventos de teclado
// - Traducir teclas a acciones del juego
// - Actualizar la interfaz visual
// - Comunicarse con el motor del juego

class ControladorTeclado {
    constructor()          // Configurar eventos de teclado
    manejarTecla()        // Procesar tecla presionada
    actualizarPantalla()  // Actualizar interfaz visual
    enviarPartidaAlServidor()  // Enviar datos al backend
}
```

---

## 🔄 FLUJO DE DATOS COMPLETO

### 🎮 **FLUJO DE UNA PARTIDA COMPLETA**

```
1. 👤 JUGADOR INICIA PARTIDA
   │
   ▼
2. 🎮 FRONTEND (ControladorTeclado)
   │ - Detecta teclas presionadas
   │ - Envía acciones al GameEngine
   │
   ▼
3. 🧠 FRONTEND (GameEngine)
   │ - Procesa lógica del juego
   │ - Calcula puntuaciones
   │ - Determina ganador
   │
   ▼
4. 📡 COMUNICACIÓN FRONTEND → BACKEND
   │ POST /api/games/start
   │ {
   │   "machine_id": 1,
   │   "location_id": 1,
   │   "players_count": 2,
   │   "game_type": "parejas"
   │ }
   │
   ▼
5. 🚀 BACKEND (GameController.startGame)
   │ - Valida datos recibidos
   │ - Cambia estado de máquina a 'occupied'
   │ - Devuelve confirmación
   │
   ▼
6. 🎮 JUGADOR JUEGA LA PARTIDA
   │ (Frontend maneja toda la interacción)
   │
   ▼
7. 🏁 PARTIDA TERMINA
   │
   ▼
8. 📡 COMUNICACIÓN FRONTEND → BACKEND
   │ POST /api/games/end
   │ {
   │   "machine_id": 1,
   │   "location_id": 1,
   │   "players_count": 2,
   │   "game_type": "parejas",
   │   "duration_seconds": 450,
   │   "revenue": 5.00,
   │   "winner_score": 3500,
   │   "total_score": 6800
   │ }
   │
   ▼
9. 🚀 BACKEND (GameController.endGame)
   │ - Valida datos de la partida
   │ - Llama a GameModel.create()
   │
   ▼
10. 💾 BACKEND (GameModel.create)
    │ - Guarda partida en tabla 'games'
    │ - Actualiza estadísticas de máquina
    │ - Actualiza estadísticas diarias/horarias
    │ - Cambia estado de máquina a 'available'
    │
    ▼
11. 🗄️ BASE DE DATOS
    │ - INSERT en tabla games
    │ - UPDATE en tabla machines
    │ - INSERT/UPDATE en daily_machine_stats
    │
    ▼
12. ✅ CONFIRMACIÓN AL FRONTEND
    │ {
    │   "success": true,
    │   "message": "Partida registrada exitosamente",
    │   "game_id": 123
    │ }
```

---

## 🧩 CÓMO FUNCIONA CADA COMPONENTE

### 🗄️ **BASE DE DATOS - SQLite**

**¿Qué es?**
SQLite es como un "archivador digital" que guarda toda la información del sistema en un solo archivo.

**¿Cómo funciona?**
```sql
-- Ejemplo: Cuando se guarda una partida
INSERT INTO games (
    machine_id, location_id, players_count, 
    game_type, duration_seconds, revenue
) VALUES (1, 1, 2, 'parejas', 450, 5.00);

-- Automáticamente actualiza estadísticas de la máquina
UPDATE machines 
SET total_games = total_games + 1,
    total_revenue = total_revenue + 5.00
WHERE id = 1;
```

### 🚀 **BACKEND - Node.js + Express**

**¿Qué es?**
El backend es como un "recepcionista inteligente" que:
- Recibe peticiones del frontend
- Procesa la información
- Consulta la base de datos
- Devuelve respuestas

**¿Cómo funciona?**
```javascript
// 1. Frontend envía petición
fetch('/api/games', {
    method: 'POST',
    body: JSON.stringify(gameData)
});

// 2. Backend la recibe en GameController
static async create(req, res) {
    const gameData = req.body;
    const newGame = await GameModel.create(gameData);
    res.json({ success: true, data: newGame });
}
```

### 🎮 **FRONTEND - HTML + CSS + JavaScript**

**¿Qué es?**
El frontend es la "cara visible" del sistema donde los usuarios interactúan.

**¿Cómo funciona?**
```javascript
// Usuario presiona una tecla
document.addEventListener('keydown', (event) => {
    controladorTeclado.manejarTecla(event.key);
});

// ControladorTeclado procesa la tecla
manejarTecla(tecla) {
    if (tecla === 'q') {
        gameEngine.agregarPuntos(1, 100);
    }
}
```

---

## 🔗 INTERACCIONES ENTRE COMPONENTES

### 🎮 **FRONTEND ↔ BACKEND**

**Comunicación HTTP/JSON:**
```javascript
// Frontend envía datos al backend
const response = await fetch('/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        machine_id: 1,
        players_count: 2,
        duration_seconds: 450,
        revenue: 5.00
    })
});

// Backend responde con JSON
const result = await response.json();
// { "success": true, "data": { "game_id": 123 } }
```

### 🚀 **BACKEND ↔ BASE DE DATOS**

**Flujo de Consultas:**
```javascript
// 1. Controlador recibe petición HTTP
static async create(req, res) {
    const gameData = req.body;
    const newGame = await GameModel.create(gameData);
    res.json({ success: true, data: newGame });
}

// 2. Modelo ejecuta consultas SQL
static async create(gameData) {
    const result = await databaseManager.run(
        'INSERT INTO games (...) VALUES (...)',
        [gameData.machine_id, gameData.revenue]
    );
    return result;
}
```

---

## 🛠️ GUÍA DE DESARROLLO

### 🚀 **CÓMO ARRANCAR EL SISTEMA**

#### 1. **Preparar el Entorno**
```bash
# Navegar al directorio del proyecto
cd cyber-sapo-clean

# Instalar dependencias del backend
cd backend
npm install express cors sqlite3

# Volver al directorio raíz
cd ..
```

#### 2. **Arrancar el Backend**
```bash
# Desde el directorio backend/
node src/server.js

# Deberías ver:
# 🎉 ===== CYBER SAPO BACKEND INICIADO =====
# 🚀 Servidor ejecutándose en puerto 3001
# 🌐 URL base: http://localhost:3001
```

#### 3. **Arrancar el Frontend**
```bash
# Desde el directorio raíz
# Usar cualquier servidor HTTP local, por ejemplo:
python -m http.server 8080
# o
npx serve -p 8080

# Abrir en navegador:
# 🎮 Juego: http://localhost:8080/juego-simple.html
# 📊 Admin: http://localhost:8080/admin.html
```

### 🔧 **CÓMO AGREGAR NUEVAS FUNCIONALIDADES**

#### **Agregar un Nuevo Endpoint:**

1. **Definir en Rutas** (`routes/gameRoutes.js`):
```javascript
// GET /api/games/leaderboard - Top jugadores
router.get('/leaderboard', GameController.getLeaderboard);
```

2. **Crear Controlador** (`controllers/GameController.js`):
```javascript
static async getLeaderboard(req, res) {
    try {
        const limit = req.query.limit || 10;
        const leaderboard = await GameModel.getTopPlayers(limit);
        
        res.json({
            success: true,
            message: `Top ${limit} jugadores obtenidos`,
            data: leaderboard
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error obteniendo leaderboard',
            message: error.message
        });
    }
}
```

3. **Implementar en Modelo** (`models/GameModel.js`):
```javascript
static async getTopPlayers(limit = 10) {
    const query = `
        SELECT 
            winner_name,
            MAX(winner_score) as best_score,
            COUNT(*) as total_games,
            AVG(winner_score) as avg_score
        FROM games 
        WHERE winner_name IS NOT NULL
        GROUP BY winner_name
        ORDER BY best_score DESC
        LIMIT ?
    `;
    
    return await databaseManager.query(query, [limit]);
}
```

### 🧪 **TESTING Y DEBUGGING**

#### **Probar Endpoints con curl:**
```bash
# Probar health check
curl http://localhost:3001/api/health

# Crear nueva partida
curl -X POST http://localhost:3001/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "machine_id": 1,
    "location_id": 1,
    "players_count": 2,
    "duration_seconds": 300,
    "revenue": 5.00
  }'

# Obtener estadísticas
curl "http://localhost:3001/api/machines/1/stats?period=7d"
```

#### **Debugging en Desarrollo:**
```javascript
// Activar logs detallados
process.env.NODE_ENV = 'development';

// El servidor mostrará:
// 📡 2024-01-15T18:59:24.000Z - POST /api/games
// 📝 Body: { "machine_id": 1, "revenue": 5.00 }
```

---

## 🎯 RESUMEN FINAL

### ✅ **LO QUE HEMOS LOGRADO**

1. **🏗️ Arquitectura Limpia Completa**
   - Backend modular con separación clara de responsabilidades
   - Frontend organizado con componentes reutilizables
   - Base de datos normalizada con relaciones optimizadas

2. **📚 Documentación Exhaustiva**
   - Comentarios detallados en español para principiantes
   - Explicaciones paso a paso de cada componente
   - Diagramas de flujo y arquitectura

3. **🔧 Sistema Funcional Completo**
   - 20+ endpoints REST documentados
   - 6 tablas de base de datos relacionadas
   - Frontend interactivo con efectos visuales
   - Panel de administración para gestión

4. **🚀 Preparado para Producción**
   - Manejo robusto de errores
   - Validaciones estrictas de entrada
   - Logging y monitoreo integrado
   - Estructura escalable

### 🎮 **CÓMO USAR EL SISTEMA**

1. **Para Jugadores:**
   - Abrir `juego-simple.html`
   - Usar teclado para jugar (Q,W,E,R,T para hoyos)
   - Enter/Espacio para cambiar jugador
   - El sistema guarda automáticamente las partidas

2. **Para Administradores:**
   - Abrir `admin.html`
   - Ver estadísticas en tiempo real
   - Gestionar máquinas y ubicaciones
   - Generar reportes detallados

3. **Para Desarrolladores:**
   - Código completamente comentado y explicado
   - Arquitectura modular fácil de extender
   - API REST bien documentada
   - Base de datos optimizada

### 🔮 **PRÓXIMOS PASOS RECOMENDADOS**

1. **Funcionalidades Adicionales:**
   - Sistema de torneos
   - Notificaciones en tiempo real
   - App móvil para administradores
   - Integración con sistemas de pago

2. **Mejoras Técnicas:**
   - Tests unitarios y de integración
   - CI/CD pipeline
   - Monitoreo avanzado
   - Optimización de performance

3. **Experiencia de Usuario:**
   - Efectos de sonido
   - Animaciones más elaboradas
   - Temas personalizables
   - Multidioma

---

**🎉 ¡CYBER SAPO está listo para conquistar el mundo de los juegos arcade!**

Este sistema combina la nostalgia de los juegos clásicos con tecnología moderna, proporcionando una experiencia completa tanto para jugadores como para administradores. La arquitectura limpia y la documentación exhaustiva garantizan que el proyecto sea mantenible y escalable a largo plazo.

**¡Que comience la diversión! 🐸🎯**
