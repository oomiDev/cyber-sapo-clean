# 🎮 EJERCICIO PRÁCTICO: CYBER SAPO SIMPLIFICADO
## Versión de Aprendizaje con Frontend, Backend y App Usuario

---

## 🎯 **OBJETIVO DEL EJERCICIO**

Crear una versión **muy simplificada** de CYBER SAPO que demuestre la comunicación entre:
- 🎮 **Juego Frontend** (donde se juega)
- 🖥️ **Backend Servidor** (procesa datos)
- 📱 **App Usuario** (muestra puntuaciones en tiempo real)

---

## 📁 **ESTRUCTURA DEL EJERCICIO**

```
EJERCICIO-PRACTICO/
├── README-EJERCICIO.md          ← Este archivo (instrucciones)
├── package.json                 ← Dependencias del proyecto
├── servidor.js                  ← Backend servidor principal
├── juego.html                   ← Frontend del juego
├── app-usuario.html             ← App del usuario (móvil simulado)
└── css/
    └── estilos.css              ← Estilos para ambas apps
```

---

## 🚀 **CÓMO EJECUTAR EL EJERCICIO**

### **Paso 1: Instalar Dependencias**
```bash
cd Formacion/EJERCICIO-PRACTICO
npm install
```

### **Paso 2: Iniciar el Servidor**
```bash
node servidor.js
```

### **Paso 3: Abrir las Aplicaciones**
- 🎮 **Juego**: Abrir `juego.html` en el navegador
- 📱 **App Usuario**: Abrir `app-usuario.html` en otra pestaña

---

## 🎮 **CÓMO FUNCIONA EL EJERCICIO**

### **🎯 Funcionalidad Básica:**

1. **En el Juego (juego.html):**
   - Presiona teclas `1`, `2`, `3`, `4`, `5` para anotar puntos
   - Presiona `M` para anotar en la boca del sapo (1000 puntos)
   - Presiona `ENTER` para cambiar de jugador

2. **En la App Usuario (app-usuario.html):**
   - Ve las puntuaciones actualizándose en tiempo real
   - Ve qué jugador está activo
   - Ve el historial de jugadas

3. **El Servidor (servidor.js):**
   - Recibe puntuaciones del juego
   - Procesa y valida los datos
   - Envía actualizaciones a la app usuario

---

## 📊 **FLUJO DE DATOS PASO A PASO**

```
1. JUGADOR presiona tecla en JUEGO
   ↓
2. JUEGO envía datos al SERVIDOR
   ↓
3. SERVIDOR procesa y valida
   ↓
4. SERVIDOR envía actualización a APP USUARIO
   ↓
5. APP USUARIO muestra nueva puntuación
```

---

## 🔧 **TECNOLOGÍAS UTILIZADAS**

- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: HTML5 + CSS3 + JavaScript ES6
- **Comunicación**: WebSockets para tiempo real
- **Base de Datos**: Memoria (array simple)

---

## 📝 **LO QUE VAS A APRENDER**

1. **📡 Comunicación en Tiempo Real**: Cómo enviar datos instantáneamente
2. **🔄 Sincronización**: Mantener múltiples pantallas actualizadas
3. **🎮 Arquitectura de Juegos**: Separar lógica del juego y presentación
4. **📱 Apps Conectadas**: Simular una app móvil conectada al juego
5. **🛡️ Validación**: Verificar datos en el servidor

---

## 🎯 **EJERCICIOS ADICIONALES**

Una vez que funcione, puedes experimentar:

1. **Agregar más jugadores**
2. **Cambiar los valores de puntuación**
3. **Añadir sonidos o animaciones**
4. **Crear un sistema de niveles**
5. **Guardar puntuaciones máximas**

---

## 🚨 **SOLUCIÓN DE PROBLEMAS**

- **Error "Cannot find module"**: Ejecuta `npm install`
- **Puerto ocupado**: Cambia el puerto en `servidor.js`
- **No se conecta**: Verifica que el servidor esté corriendo
- **No actualiza**: Refresca las páginas web

---

**🎮 ¡Comienza el ejercicio y aprende haciendo!**
