# 🔧 SOLUCIÓN RÁPIDA - SERVIDOR NO INICIA

## ❌ PROBLEMA
El archivo .bat se cierra inmediatamente = Node.js no está instalado

## ✅ SOLUCIÓN EN 3 PASOS

### PASO 1: Instalar Node.js
1. **Ir a:** https://nodejs.org/
2. **Descargar:** Versión LTS (recomendada)
3. **Instalar:** Con configuración por defecto
4. **Reiniciar:** Tu computadora

### PASO 2: Ejecutar Script Manual
- **Doble clic en:** `inicio-manual.bat`
- **Este script:**
  - ✅ Verifica Node.js
  - ✅ Crea archivo .env
  - ✅ Instala dependencias
  - ✅ Inicia servidor
  - ✅ NO se cierra automáticamente

### PASO 3: Acceder al Sistema
- **Dashboard:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin.html

## 🚨 SI SIGUE SIN FUNCIONAR

### Opción A: Comando Manual
```bash
# Abrir PowerShell en la carpeta del proyecto
# Ejecutar uno por uno:
npm install
npm start
```

### Opción B: Verificar Instalación
```bash
# En PowerShell:
node --version
npm --version
```

Debe mostrar números de versión, no errores.

## 💡 NOTAS IMPORTANTES
- **NO cierres** la ventana del servidor
- **Ctrl+C** para detener el servidor
- **El servidor debe estar ejecutándose** para acceder a la web
