# 🚀 GUÍA DE INSTALACIÓN: Node.js + MongoDB en Servidor OVH

## 📋 REQUISITOS PREVIOS
- Servidor OVH con Ubuntu 20.04+ 
- Acceso SSH al servidor
- Dominio configurado (opcional)

## 🔐 PASO 1: CONFIGURACIÓN INICIAL DEL SERVIDOR

### Conectar al Servidor
```bash
ssh root@tu-servidor-ovh.com
```

### Actualizar Sistema
```bash
apt update && apt upgrade -y
```

### Crear Usuario para la Aplicación
```bash
adduser recaudacion
usermod -aG sudo recaudacion
su - recaudacion
```

### Configurar Firewall
```bash
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw allow 3000    # Aplicación Node.js
sudo ufw enable
```

## 📦 PASO 2: INSTALACIÓN DE NODE.JS

### Método Oficial (Recomendado)
```bash
# Descargar e instalar Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version    # Debe mostrar v18.x.x
npm --version     # Debe mostrar 9.x.x
```

### Configurar npm Global
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Instalar PM2 (Gestor de Procesos)
```bash
npm install -g pm2
```

## 🗄️ PASO 3: INSTALACIÓN DE MONGODB

### Importar Clave y Repositorio
```bash
# Importar clave pública
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Agregar repositorio oficial
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
```

### Instalar MongoDB
```bash
sudo apt-get update
sudo apt-get install -y mongodb-org
```

### Configurar e Iniciar MongoDB
```bash
# Iniciar servicio
sudo systemctl start mongod
sudo systemctl enable mongod

# Verificar estado
sudo systemctl status mongod
```

### Configurar Seguridad
```bash
# Editar configuración
sudo nano /etc/mongod.conf
```

**Configuración recomendada:**
```yaml
# /etc/mongod.conf
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

net:
  port: 27017
  bindIp: 127.0.0.1  # Solo localhost

security:
  authorization: enabled  # Habilitar autenticación

processManagement:
  fork: true
  pidFilePath: /var/run/mongodb/mongod.pid
```

### Crear Usuario Administrador
```bash
# Conectar a MongoDB
mongosh

# Crear usuario admin
use admin
db.createUser({
  user: "admin",
  pwd: "tu_password_seguro",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase"]
})

# Crear base de datos para la aplicación
use recaudacion_db
db.createUser({
  user: "recaudacion_user",
  pwd: "password_aplicacion",
  roles: ["readWrite"]
})

exit
```

### Reiniciar MongoDB con Autenticación
```bash
sudo systemctl restart mongod
```

## 🏗️ PASO 4: PREPARAR DIRECTORIO DE LA APLICACIÓN

### Crear Estructura de Proyecto
```bash
# Crear directorio de la aplicación
sudo mkdir -p /var/www/recaudacion
sudo chown recaudacion:recaudacion /var/www/recaudacion
cd /var/www/recaudacion

# Inicializar proyecto Node.js
npm init -y

# Instalar dependencias básicas
npm install express mongoose cors helmet dotenv
npm install -D nodemon
```

### Configurar Variables de Entorno
```bash
# Crear archivo de configuración
nano .env
```

**Contenido del .env:**
```env
# Configuración de la aplicación
NODE_ENV=production
PORT=3000

# Base de datos MongoDB
MONGODB_URI=mongodb://recaudacion_user:password_aplicacion@localhost:27017/recaudacion_db

# Seguridad
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
```

## 🔧 PASO 5: CONFIGURAR NGINX (PROXY REVERSO)

### Instalar Nginx
```bash
sudo apt install nginx -y
```

### Configurar Sitio
```bash
sudo nano /etc/nginx/sites-available/recaudacion
```

**Configuración Nginx:**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Activar Sitio
```bash
sudo ln -s /etc/nginx/sites-available/recaudacion /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🚀 PASO 6: DESPLIEGUE Y GESTIÓN

### Configurar PM2 para Producción
```bash
# Crear archivo de configuración PM2
nano ecosystem.config.js
```

**Configuración PM2:**
```javascript
module.exports = {
  apps: [{
    name: 'recaudacion-app',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

### Comandos de Gestión
```bash
# Iniciar aplicación
pm2 start ecosystem.config.js --env production

# Ver estado
pm2 status

# Ver logs
pm2 logs

# Reiniciar
pm2 restart recaudacion-app

# Configurar inicio automático
pm2 startup
pm2 save
```

## 🔒 PASO 7: SEGURIDAD ADICIONAL

### Configurar SSL con Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tu-dominio.com
```

### Backup Automático de MongoDB
```bash
# Crear script de backup
nano /home/recaudacion/backup-mongo.sh
```

**Script de Backup:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="mongodb://recaudacion_user:password_aplicacion@localhost:27017/recaudacion_db" --out="/home/recaudacion/backups/backup_$DATE"
find /home/recaudacion/backups -type d -mtime +7 -exec rm -rf {} \;
```

### Configurar Cron para Backups
```bash
chmod +x /home/recaudacion/backup-mongo.sh
crontab -e

# Agregar línea para backup diario a las 2 AM
0 2 * * * /home/recaudacion/backup-mongo.sh
```

## 📊 PASO 8: MONITOREO

### Instalar Herramientas de Monitoreo
```bash
# Instalar htop para monitoreo de recursos
sudo apt install htop -y

# Configurar logs de aplicación
pm2 install pm2-logrotate
```

### Comandos Útiles de Monitoreo
```bash
# Ver uso de recursos
htop

# Monitorear MongoDB
mongosh --eval "db.stats()"

# Ver logs de aplicación
pm2 logs recaudacion-app --lines 100

# Ver estado de servicios
sudo systemctl status mongod
sudo systemctl status nginx
```

## ⚠️ CONSIDERACIONES IMPORTANTES

### Seguridad
- ✅ Cambiar passwords por defecto
- ✅ Configurar firewall correctamente
- ✅ Usar SSL/HTTPS en producción
- ✅ Mantener sistema actualizado

### Rendimiento
- ✅ Configurar PM2 en modo cluster
- ✅ Optimizar consultas MongoDB
- ✅ Implementar cache si es necesario
- ✅ Monitorear recursos del servidor

### Backup y Recuperación
- ✅ Backups automáticos diarios
- ✅ Probar restauración periódicamente
- ✅ Mantener backups en ubicación externa

---

**💡 NOTA:** Esta guía te prepara el servidor completo para desarrollar la aplicación de facturación de máquinas expendedoras con Node.js y MongoDB de forma profesional y segura.
