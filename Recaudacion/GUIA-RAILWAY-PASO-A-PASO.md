# 🚀 GUÍA RAILWAY PASO A PASO - REGISTRO Y DEPLOY

## 📋 PASO 1: CREAR CUENTA RAILWAY

### **1.1 Ir a Railway**
- **URL:** https://railway.app
- **Clic:** "Start a New Project"

### **1.2 Registrarse**
- **Opción A:** Conectar con GitHub (RECOMENDADO)
- **Opción B:** Crear cuenta con email

### **1.3 Verificar cuenta**
- Revisar email de confirmación
- Hacer clic en el enlace de verificación

## 🔧 PASO 2: INSTALAR RAILWAY CLI

### **2.1 Instalar CLI**
```powershell
npm install -g @railway/cli
```

### **2.2 Verificar instalación**
```powershell
railway --version
```

### **2.3 Login desde terminal**
```powershell
railway login
```
- Se abrirá navegador
- Autorizar acceso
- Volver a terminal

## 📦 PASO 3: PREPARAR PROYECTO

### **3.1 Ir a carpeta Recaudacion**
```powershell
cd "C:\Users\omivi\Desktop\Jueo\win64\cyber-sapo-clean\Recaudacion"
```

### **3.2 Verificar archivos necesarios**
- ✅ `package.json` (ya existe)
- ✅ `server.js` (ya existe)
- ✅ `railway.json` (ya creado)
- ✅ `Procfile` (ya creado)

## 🚀 PASO 4: DEPLOY A RAILWAY

### **4.1 Crear proyecto**
```powershell
railway init
```
- Elegir nombre: "sistema-recaudacion-maquinas"

### **4.2 Deploy**
```powershell
railway up
```
- Railway detectará Node.js automáticamente
- Instalará dependencias
- Iniciará servidor

### **4.3 Obtener URL**
```powershell
railway domain
```
- Te dará URL como: `https://sistema-recaudacion-maquinas-production.up.railway.app`

## ⚙️ PASO 5: CONFIGURAR VARIABLES

### **5.1 Ir a Railway Dashboard**
- URL: https://railway.app/dashboard
- Seleccionar tu proyecto

### **5.2 Ir a Variables**
- Clic en pestaña "Variables"
- Agregar variables:

```
MONGODB_URI=mongodb+srv://omivi:TuPassword@cluster0.mongodb.net/recaudacion
PORT=3000
NODE_ENV=production
JWT_SECRET=tu_clave_secreta_muy_segura_123456
```

### **5.3 Redeploy**
```powershell
railway up
```

## ✅ PASO 6: VERIFICAR FUNCIONAMIENTO

### **6.1 Abrir URL**
- Ir a tu URL de Railway
- Debería mostrar "Sistema de Recaudación API funcionando"

### **6.2 Probar endpoints**
- `GET /api/health` - Estado del servidor
- `GET /api/maquinas` - Lista de máquinas
- `POST /api/pulsos` - Recibir pulsos

## 💰 PASO 7: CONFIGURAR FACTURACIÓN

### **7.1 Agregar método de pago**
- Railway Dashboard → Billing
- Agregar tarjeta de crédito
- Plan: $5/mes por proyecto

### **7.2 Monitorear uso**
- Ver métricas en tiempo real
- Configurar alertas de uso

## 🔧 COMANDOS ÚTILES

```powershell
# Ver logs en tiempo real
railway logs

# Conectar a base de datos
railway connect

# Ver información del proyecto
railway status

# Abrir en navegador
railway open
```

## 🆘 SOLUCIÓN DE PROBLEMAS

### **Error: "Command not found"**
```powershell
npm install -g @railway/cli --force
```

### **Error: "Login failed"**
- Cerrar todas las ventanas del navegador
- `railway logout`
- `railway login`

### **Error: "Deploy failed"**
- Verificar `package.json`
- Verificar que `server.js` existe
- `railway logs` para ver error específico
