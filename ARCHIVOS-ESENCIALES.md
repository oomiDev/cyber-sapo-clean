# 📁 Archivos Esenciales - CYBER SAPO

## 🎮 **Frontend (Juego Principal)**
```
frontend/
├── index.html              # Menú principal
├── juego-neon.html         # Juego principal CYBER SAPO
├── juego-neon.js           # Lógica del juego
├── neon-style.css          # Estilos principales
├── mobile-app.html         # App móvil integrada
├── admin.html              # Panel de administración
├── app.html                # Interfaz web principal
├── logo boliranas.png      # Logo del proyecto
├── css/                    # Estilos adicionales
│   ├── admin.css
│   ├── analytics.css
│   ├── analytics-admin.css
│   └── style.css
└── js/                     # Scripts adicionales
    ├── admin.js
    ├── analytics.js
    ├── machines.js
    └── main.js
```

## 🖥️ **Backend (Servidor)**
```
backend/
├── server.js               # Servidor principal con APIs
├── server-simple.js        # Servidor simplificado
├── package.json            # Dependencias Node.js
└── package-lock.json       # Lockfile de dependencias
```

## 📋 **Documentación**
```
├── README.md               # Descripción del proyecto
├── DEPLOYMENT.md           # Guía de deployment
├── METODOLOGIA-DESARROLLO.md # Metodología de desarrollo
└── SETUP-NUEVO-PC.md       # Setup en PC nuevo
```

## ⚙️ **Configuración**
```
├── .gitignore              # Archivos ignorados por Git
├── netlify.toml            # Configuración de Netlify
├── restart-clean.bat       # Script para reiniciar limpio
└── start-clean.bat         # Script para iniciar limpio
```

## 🗑️ **Archivos Eliminados (Innecesarios)**
- `add-history-minimal.js` - Script de datos históricos
- `fix-data.bat` - Script de corrección de datos
- `force-generate-games.bat` - Generador forzado
- `generate-*.js` - Scripts de generación de datos
- `improve-revenue*.js` - Scripts de mejora de ingresos
- `juego-neon-test.html` - Archivo de pruebas
- `juego-neon-working.html` - Copia de trabajo
- `game-integration.html` - Integración duplicada
- `machine-*.html` - Páginas de máquinas no usadas
- `player-profile.html` - Perfil duplicado
- Scripts .bat innecesarios

## 🎯 **Archivos Principales para Desarrollo**

### **Para el Juego:**
- `frontend/juego-neon.html` + `juego-neon.js`
- `frontend/neon-style.css`

### **Para la App Móvil:**
- `frontend/mobile-app.html`

### **Para el Backend:**
- `backend/server.js`

### **Para Administración:**
- `frontend/admin.html`

## 🚀 **Comandos de Inicio**
```bash
# Iniciar solo backend
cd backend && npm start

# Iniciar proyecto completo
./start-clean.bat

# Reiniciar limpio
./restart-clean.bat
```

El proyecto ahora está limpio y organizado con solo los archivos esenciales.
