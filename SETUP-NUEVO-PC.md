# 🖥️ CYBER SAPO - Configuración en Nuevo PC

## ✅ **Checklist de Instalación**

### 1. **Instalar Node.js**
- [ ] Ir a https://nodejs.org/
- [ ] Descargar versión LTS (18.x o superior)
- [ ] Instalar siguiendo el asistente
- [ ] Reiniciar terminal/PowerShell

### 2. **Verificar Instalación**
```bash
node --version
npm --version
```
Deberías ver las versiones instaladas.

### 3. **Instalar Dependencias**
```bash
cd backend
npm install
```

### 4. **Iniciar Servidor**
```bash
npm start
```

### 5. **Probar la Aplicación**
- Abrir navegador en: `http://localhost:3001`
- Ir a: `http://localhost:3001/juego-neon.html`

## 🎯 **URLs Principales**
- **Menú Principal**: http://localhost:3001/
- **Juego con Control Móvil**: http://localhost:3001/juego-neon.html
- **App Móvil**: http://localhost:3001/mobile-app.html
- **Panel Admin**: http://localhost:3001/admin.html

## 🔧 **Solución de Problemas**

### Error: "node no se reconoce como comando"
- Node.js no está instalado o no está en el PATH
- Reinstalar Node.js y reiniciar terminal

### Error: "Cannot find module"
- Ejecutar `npm install` en la carpeta backend
- Verificar que package.json existe

### Error: "Port 3001 already in use"
- Cambiar puerto en server.js línea 6: `const PORT = 3002;`
- O cerrar otras aplicaciones que usen el puerto

### Backend no conecta
- Verificar que el servidor esté corriendo
- Comprobar que no hay firewall bloqueando
- Revisar console del navegador (F12)

## 📁 **Estructura de Archivos Necesaria**
```
cyber-sapo-clean/
├── backend/
│   ├── package.json ✅
│   ├── server.js ✅
│   └── node_modules/ (se crea con npm install)
├── frontend/
│   ├── juego-neon.html ✅
│   ├── mobile-app.html ✅
│   ├── index.html ✅
│   └── css/, js/ ✅
└── netlify.toml ✅
```

## 🎮 **Primeros Pasos**
1. Instalar Node.js
2. Abrir terminal en la carpeta del proyecto
3. `cd backend`
4. `npm install`
5. `npm start`
6. Abrir http://localhost:3001/juego-neon.html
7. ¡Jugar!

## 📞 **Si Necesitas Ayuda**
- Verificar que todos los archivos se copiaron correctamente
- Comprobar versión de Node.js (mínimo 16.x)
- Revisar logs en la terminal del servidor
- Abrir DevTools del navegador (F12) para ver errores
