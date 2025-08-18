# 🚀 GUÍA RÁPIDA DE INICIO - CYBER SAPO

## ⚡ ARRANCAR EL SISTEMA EN 3 PASOS

### 1️⃣ **PREPARAR DEPENDENCIAS**
```bash
# Ir al directorio del backend
cd backend

# Instalar dependencias de Node.js
npm install express cors sqlite3

# Volver al directorio raíz
cd ..
```

### 2️⃣ **ARRANCAR EL BACKEND**
```bash
# Desde el directorio backend/
node src/server.js
```

**✅ Verás este mensaje si todo está bien:**
```
🎉 ===== CYBER SAPO BACKEND INICIADO =====
🚀 Servidor ejecutándose en puerto 3001
🌐 URL base: http://localhost:3001

📡 ENDPOINTS PRINCIPALES:
🏥 Health check: http://localhost:3001/api/health
📊 API info: http://localhost:3001/api
🎮 Partidas: http://localhost:3001/api/games
🎰 Máquinas: http://localhost:3001/api/machines
🏢 Ubicaciones: http://localhost:3001/api/locations
```

### 3️⃣ **ARRANCAR EL FRONTEND**
```bash
# Desde el directorio raíz del proyecto
# Opción 1: Python
python -m http.server 8080

# Opción 2: Node.js
npx serve -p 8080

# Opción 3: Live Server (VS Code)
# Clic derecho en juego-simple.html → "Open with Live Server"
```

**🎮 URLs para acceder:**
- **Juego**: http://localhost:8080/juego-simple.html
- **Panel Admin**: http://localhost:8080/admin.html

---

## 🎯 VERIFICAR QUE TODO FUNCIONA

### ✅ **Test 1: Backend funcionando**
Abre en navegador: http://localhost:3001/api/health

Deberías ver:
```json
{
  "success": true,
  "status": "online",
  "message": "CYBER SAPO Backend funcionando correctamente"
}
```

### ✅ **Test 2: Frontend conectado**
1. Abre: http://localhost:8080/juego-simple.html
2. Presiona F12 (Consola del navegador)
3. No deberías ver errores de conexión

### ✅ **Test 3: Base de datos creada**
Verifica que existe el archivo: `backend/cyber_sapo_simple.db`

---

## 🎮 CÓMO JUGAR

### **Controles del Juego:**
- **Q, W, E, R, T**: Anotar en hoyos 1, 2, 3, 4, 5
- **Enter o Espacio**: Cambiar de jugador
- **ESC**: Volver al menú principal

### **Flujo de una Partida:**
1. Abre el juego en el navegador
2. Configura número de jugadores
3. Juega usando las teclas Q-W-E-R-T
4. La partida se guarda automáticamente al terminar
5. Ve estadísticas en el panel de admin

---

## 🛠️ SOLUCIÓN DE PROBLEMAS COMUNES

### ❌ **Error: "Cannot find module 'express'"**
```bash
cd backend
npm install express cors sqlite3
```

### ❌ **Error: "Port 3001 already in use"**
```bash
# Cambiar puerto en backend/src/server.js línea:
this.port = process.env.PORT || 3002;  // Cambiar a 3002
```

### ❌ **Error: "CORS policy"**
- Asegúrate de que el backend esté ejecutándose
- Verifica que el frontend use http://localhost:8080 (no file://)

### ❌ **Frontend no carga**
```bash
# Asegúrate de estar en el directorio correcto
ls -la  # Deberías ver juego-simple.html

# Usa un servidor HTTP, no abras el archivo directamente
python -m http.server 8080
```

---

## 📊 ESTRUCTURA DE ARCHIVOS IMPORTANTE

```
cyber-sapo-clean/
├── backend/
│   ├── src/server.js           ← ARRANCAR ESTE ARCHIVO
│   ├── cyber_sapo_simple.db    ← BASE DE DATOS (se crea automáticamente)
│   └── package.json            ← DEPENDENCIAS
├── frontend/
│   ├── juego-simple.html       ← PÁGINA DEL JUEGO
│   └── admin.html             ← PANEL DE ADMINISTRACIÓN
└── DOCUMENTACION-SISTEMA-COMPLETO.md  ← DOCUMENTACIÓN COMPLETA
```

---

## 🎯 PRÓXIMOS PASOS

Una vez que tengas el sistema funcionando:

1. **🎮 Juega algunas partidas** para generar datos de prueba
2. **📊 Abre el panel de admin** para ver estadísticas
3. **🔧 Explora la API** visitando http://localhost:3001/api
4. **📚 Lee la documentación completa** en `DOCUMENTACION-SISTEMA-COMPLETO.md`

---

**🎉 ¡Listo! Ya tienes CYBER SAPO funcionando completamente.**

Si tienes problemas, revisa la documentación completa o verifica que todos los archivos estén en su lugar.
