# 🚀 GUÍA DE INICIO RÁPIDO - SISTEMA DE RECAUDACIÓN

## 📋 REQUISITOS PREVIOS

1. **Node.js** (versión 16 o superior)
   - Descargar de: https://nodejs.org/
   - Verificar: `node --version`

2. **MongoDB** (opción más fácil: MongoDB Atlas - GRATIS)
   - Crear cuenta en: https://www.mongodb.com/atlas
   - Crear cluster gratuito
   - Obtener string de conexión

## ⚡ INICIO EN 5 MINUTOS

### PASO 1: Preparar el Proyecto
```bash
# Navegar a la carpeta del proyecto
cd C:\Users\omivi\Desktop\Jueo\win64\cyber-sapo-clean\Recaudacion

# Instalar dependencias
npm install
```

### PASO 2: Configurar Base de Datos
```bash
# Copiar archivo de configuración
copy .env.example .env

# Editar .env con tus datos:
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/recaudacion
JWT_SECRET=tu_clave_secreta_aqui
```

### PASO 3: Iniciar el Sistema
```bash
# Iniciar servidor
npm start

# O para desarrollo con auto-reinicio:
npm run dev
```

### PASO 4: Acceder al Sistema
- **Dashboard:** http://localhost:3000
- **Panel Admin:** http://localhost:3000/admin.html

## 🎯 PRIMEROS PASOS

1. **Crear Regiones:**
   - Ve a Panel Admin → Gestión de Regiones
   - Agrega tus regiones (ej: MADRID, BARCELONA)

2. **Registrar Locales:**
   - Ve a Gestión de Locales
   - Agrega establecimientos donde tienes máquinas

3. **Agregar Máquinas:**
   - Ve a Gestión de Máquinas
   - Vincula máquinas a locales existentes

4. **Recibir Pulsos:**
   - Las máquinas envían datos a: `POST /api/pulsos`
   - Ver estadísticas en tiempo real en el Dashboard

## 🔧 COMANDOS ÚTILES

```bash
# Verificar estado
npm run status

# Ver logs
npm run logs

# Reiniciar servidor
npm restart

# Parar servidor
npm stop
```

## 📱 ACCESO DESDE MÓVIL

Para acceder desde tu móvil en la misma red:

1. Obtener IP de tu PC: `ipconfig`
2. Acceder desde móvil: `http://TU_IP:3000`

## ⚠️ SOLUCIÓN DE PROBLEMAS

**Error de conexión a MongoDB:**
- Verificar string de conexión en `.env`
- Asegurar que IP esté en whitelist de MongoDB Atlas

**Puerto ocupado:**
- Cambiar `PORT=3001` en archivo `.env`
- Reiniciar servidor

**Dependencias faltantes:**
```bash
npm install --save express mongoose cors helmet dotenv
```
