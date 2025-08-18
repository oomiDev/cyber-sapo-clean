# 🖥️ DESPLIEGUE EN SERVIDOR VPS

## 🎯 PROVEEDORES RECOMENDADOS (BARATOS)

### 💰 OPCIONES ECONÓMICAS:
- **DigitalOcean:** $5/mes - Muy fácil
- **Vultr:** $3.50/mes - Económico
- **Hetzner:** €3.29/mes - Europeo
- **Contabo:** €3.99/mes - Muy barato

## ⚡ INSTALACIÓN AUTOMÁTICA

### PASO 1: Crear Servidor
1. Elegir Ubuntu 22.04 LTS
2. Mínimo: 1GB RAM, 25GB disco
3. Obtener IP pública

### PASO 2: Conectar por SSH
```bash
ssh root@TU_IP_SERVIDOR
```

### PASO 3: Script de Instalación Automática
```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Instalar PM2 (gestor de procesos)
npm install -g pm2

# Instalar Nginx (servidor web)
apt install -y nginx

# Configurar firewall
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable
```

### PASO 4: Subir Proyecto
```bash
# Clonar proyecto
git clone TU_REPOSITORIO /var/www/recaudacion
cd /var/www/recaudacion

# Instalar dependencias
npm install

# Configurar variables
cp .env.example .env
nano .env
```

### PASO 5: Configurar Nginx
```bash
# Crear configuración
cat > /etc/nginx/sites-available/recaudacion << 'EOF'
server {
    listen 80;
    server_name TU_DOMINIO.com;

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
EOF

# Activar sitio
ln -s /etc/nginx/sites-available/recaudacion /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### PASO 6: Iniciar con PM2
```bash
# Iniciar aplicación
pm2 start server.js --name "recaudacion"

# Configurar auto-inicio
pm2 startup
pm2 save
```

## 🔒 CONFIGURAR HTTPS (GRATIS)

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL
certbot --nginx -d TU_DOMINIO.com

# Auto-renovación
crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 COMANDOS DE GESTIÓN

```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs recaudacion

# Reiniciar
pm2 restart recaudacion

# Actualizar código
cd /var/www/recaudacion
git pull
npm install
pm2 restart recaudacion
```

## 💡 VENTAJAS VPS
- ✅ **Control total**
- ✅ **Dominio personalizado**
- ✅ **HTTPS gratuito**
- ✅ **Escalable**
- ✅ **Backups manuales**
