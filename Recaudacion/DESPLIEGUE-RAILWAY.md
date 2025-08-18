# 🚀 DESPLIEGUE EN RAILWAY - GUÍA PASO A PASO

## 📋 PASOS PARA DESPLEGAR TU SISTEMA EN LA NUBE

### **PASO 1: Crear cuenta en Railway**
1. Ve a: https://railway.app
2. Haz clic en "Start a New Project"
3. Conecta con GitHub (recomendado) o crea cuenta

### **PASO 2: Subir código a GitHub** 
```bash
# En la carpeta Recaudacion/
git init
git add .
git commit -m "Sistema de recaudación completo"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/sistema-recaudacion.git
git push -u origin main
```

### **PASO 3: Conectar Railway con GitHub**
1. En Railway: "Deploy from GitHub repo"
2. Selecciona tu repositorio `sistema-recaudacion`
3. Railway detectará automáticamente que es Node.js
4. Haz clic en "Deploy Now"

### **PASO 4: Configurar variables de entorno**
En Railway → Settings → Environment:
```
MONGODB_URI=mongodb+srv://omivi:TuPassword@cluster0.mongodb.net/recaudacion
PORT=3000
NODE_ENV=production
```

### **PASO 5: Obtener URL del backend**
- Railway te dará una URL como: `https://sistema-recaudacion-production.up.railway.app`
- Copia esta URL para el siguiente paso

### **PASO 6: Actualizar frontend en Netlify**
Actualizar las URLs en los archivos HTML para que apunten a Railway:
- `dashboard-nube.html`
- `simulador-maquina.html` 
- `admin.html`

## 💰 COSTOS
- **Railway**: $5/mes por proyecto
- **MongoDB Atlas**: Gratis (512MB)
- **Netlify**: Gratis para frontend

## ✅ RESULTADO FINAL
- **Frontend**: https://sistema-recaudacion-maquinas.windsurf.build
- **Backend**: https://tu-app.up.railway.app
- **Sistema 100% en la nube**

## 🔧 COMANDOS ÚTILES
```bash
# Ver logs en Railway
railway logs

# Conectar Railway CLI (opcional)
npm install -g @railway/cli
railway login
railway link
```

## 📞 SOPORTE
Si tienes problemas:
1. Revisa logs en Railway Dashboard
2. Verifica variables de entorno
3. Confirma que MongoDB Atlas permite conexiones desde cualquier IP (0.0.0.0/0)
