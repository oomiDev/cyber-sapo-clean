# 🌐 CONFIGURACIÓN MONGODB ATLAS (GRATIS)

## 📋 PASOS PARA CONFIGURAR BASE DE DATOS EN LA NUBE

### PASO 1: Crear Cuenta
1. Ve a: https://www.mongodb.com/atlas
2. Clic en "Try Free"
3. Registrarte con email

### PASO 2: Crear Cluster Gratuito
1. Selecciona "M0 Sandbox" (GRATIS)
2. Región: Elige la más cercana (ej: Europe West)
3. Nombre del cluster: "recaudacion-cluster"
4. Clic "Create Cluster"

### PASO 3: Configurar Acceso
1. **Database Access:**
   - Clic "Database Access" en menú lateral
   - "Add New Database User"
   - Username: `admin`
   - Password: Generar automático (copiar y guardar)
   - Database User Privileges: "Atlas admin"
   - "Add User"

2. **Network Access:**
   - Clic "Network Access"
   - "Add IP Address"
   - "Allow Access from Anywhere" (0.0.0.0/0)
   - "Confirm"

### PASO 4: Obtener String de Conexión
1. Volver a "Clusters"
2. Clic "Connect" en tu cluster
3. "Connect your application"
4. Driver: Node.js, Version: 4.1 or later
5. Copiar el connection string:
   ```
   mongodb+srv://admin:<password>@recaudacion-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### PASO 5: Configurar en tu Proyecto
1. Abrir archivo `.env`
2. Reemplazar `<password>` con tu password real
3. Cambiar nombre de base de datos:
   ```
   MONGODB_URI=mongodb+srv://admin:TU_PASSWORD@recaudacion-cluster.xxxxx.mongodb.net/recaudacion?retryWrites=true&w=majority
   ```

## ✅ VENTAJAS DE ATLAS
- ✅ **Gratis hasta 512MB** (suficiente para empezar)
- ✅ **Backups automáticos**
- ✅ **Acceso desde cualquier lugar**
- ✅ **Escalable** (puedes crecer después)
- ✅ **Seguro** (encriptación automática)

## 🔧 CONFIGURACIÓN COMPLETA .ENV
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://admin:TU_PASSWORD@recaudacion-cluster.xxxxx.mongodb.net/recaudacion?retryWrites=true&w=majority
JWT_SECRET=mi_clave_super_secreta_2024
```
