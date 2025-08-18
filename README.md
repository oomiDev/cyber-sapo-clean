# CYBER SAPO - Proyecto Limpio

## 🎯 Estructura del Proyecto

```
cyber-sapo-clean/
├── backend/                 # Servidor Node.js + SQLite
│   ├── server.js           # Servidor principal
│   ├── config/             # Configuración DB
│   ├── routes/             # Rutas API
│   └── package.json        # Dependencias
├── frontend/               # Interfaz web
│   ├── index.html          # Página principal
│   ├── machines.html       # Selección de máquinas
│   ├── game.html           # Juego principal
│   ├── css/                # Estilos
│   └── js/                 # JavaScript
└── docs/                   # Documentación

```

## 🚀 Inicio Rápido

### 1. Backend
```bash
cd backend
npm install
node server.js
```

### 2. Frontend
```bash
cd frontend
npx http-server -p 8080
```

### 3. Acceder
- **Selección de máquinas:** http://localhost:8080/machines.html
- **Juego principal:** http://localhost:8080/game.html

## ✅ Funcionalidades Principales

1. **Selección de Máquinas** - Ver máquinas disponibles por ubicación
2. **Juego SAPO** - Juego principal con efectos neón
3. **Historial** - Puntuaciones y estadísticas
4. **API REST** - Backend para datos y estado

## 🔧 Sin Autenticación

**Acceso directo a todas las funcionalidades sin login.**
La autenticación se implementará al final del desarrollo.

## 📝 Próximos Pasos

1. Completar lógica de juego
2. Implementar historial de partidas
3. Mejorar interfaz móvil
4. Agregar autenticación (opcional)
