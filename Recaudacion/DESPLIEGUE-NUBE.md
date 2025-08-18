# ☁️ DESPLIEGUE EN LA NUBE - GRATIS

## 🎯 RAILWAY (RECOMENDADO - MÁS FÁCIL)

### PASO 1: Preparar Proyecto
1. Subir código a GitHub (si no está ya)
2. Ir a: https://railway.app/
3. "Login with GitHub"

### PASO 2: Desplegar
1. "New Project"
2. "Deploy from GitHub repo"
3. Seleccionar tu repositorio
4. Railway detecta automáticamente Node.js
5. ¡Se despliega solo!

### PASO 3: Configurar Variables
1. En Railway → Settings → Variables
2. Agregar:
   ```
   NODE_ENV=production
   MONGODB_URI=tu_string_de_mongodb_atlas
   JWT_SECRET=clave_secreta_segura
   PORT=3000
   ```

### PASO 4: Obtener URL
- Railway te da una URL automática: `https://tu-app.railway.app`
- Acceso inmediato desde cualquier lugar

## 🔄 RENDER (ALTERNATIVA GRATUITA)

### PASOS SIMILARES:
1. Ir a: https://render.com/
2. "New Web Service"
3. Conectar GitHub
4. Configurar variables de entorno
5. ¡Desplegado!

## ✅ VENTAJAS NUBE GRATUITA
- ✅ **Acceso desde cualquier lugar**
- ✅ **HTTPS automático**
- ✅ **Escalable**
- ✅ **Sin mantenimiento de servidor**
- ✅ **Backups automáticos**
- ✅ **Actualizaciones automáticas** desde GitHub

## 💰 COSTOS
- **Railway:** Gratis hasta $5/mes de uso
- **Render:** Gratis con limitaciones menores
- **MongoDB Atlas:** Gratis hasta 512MB

## 🔧 CONFIGURACIÓN AUTOMÁTICA
El proyecto ya está configurado para desplegarse automáticamente en estas plataformas.
