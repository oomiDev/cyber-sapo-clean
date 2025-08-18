# 🐸 CYBER SAPO - Arquitectura Limpia y Organizada

## 📋 EXPLICACIÓN PARA PRINCIPIANTES

Este documento explica cómo está organizado el código del juego CYBER SAPO de una manera muy simple, como si fueras un niño aprendiendo a programar.

## 🏗️ ESTRUCTURA DEL PROYECTO

```
frontend/
├── src/                          # 📁 Carpeta principal del código fuente
│   ├── core/                     # 🧠 El "cerebro" del juego
│   │   └── GameEngine.js         # Motor principal que maneja toda la lógica
│   ├── controladores/            # 🎮 Los "controles" del juego
│   │   └── ControladorTeclado.js # Escucha las teclas que presionas
│   ├── utilidades/               # 🔧 Herramientas útiles
│   │   └── Helpers.js            # Funciones de ayuda
│   ├── estilos/                  # 🎨 Cómo se ve el juego
│   │   ├── base.css              # Estilos básicos (colores, fuentes)
│   │   └── botones.css           # Estilos para botones
│   └── JuegoSapo.js             # 🎯 Archivo principal que conecta todo
├── juego-simple.html            # 🌐 Página web simplificada del juego
└── (archivos antiguos...)       # 📦 Código anterior (se puede borrar)
```

## 🧩 CÓMO FUNCIONA CADA PIEZA

### 1. 🧠 GameEngine.js (El Cerebro)
**¿Qué hace?** Es como el "cerebro" del juego que recuerda todo:
- Quién está jugando
- Cuántos puntos tiene cada uno
- Qué tipo de juego es (individual, parejas, equipos)
- Si alguien ya ganó

**Métodos principales:**
- `empezarJuego()` - Inicia una nueva partida
- `agregarPuntos(puntos)` - Suma puntos cuando aciertas
- `cambiarAlSiguienteJugador()` - Pasa el turno al siguiente
- `terminarJuego(ganador)` - Termina cuando alguien gana

### 2. 🎮 ControladorTeclado.js (Los Controles)
**¿Qué hace?** Es como un "traductor" que entiende qué teclas presionas:
- Escucha cuando presionas teclas
- Decide qué hacer con cada tecla
- Le dice al cerebro (GameEngine) qué acción tomar

**Teclas importantes:**
- `ESPACIO` - Empezar juego o seleccionar opciones
- `TAB` - Cambiar entre opciones del menú
- `M` - Agregar monedas
- `Q, W, E, R, A, S, D, F, Z, X, C, V, T, G` - Puntuación
- `ENTER` - Cambiar de jugador

### 3. 🔧 Helpers.js (Herramientas)
**¿Qué hace?** Tiene funciones útiles que se usan en todo el juego:
- `formatearTiempo()` - Mostrar tiempo de manera bonita
- `reproducirSonido()` - Hacer sonidos del juego
- `guardarDato()` / `cargarDato()` - Guardar información en el navegador

### 4. 🎯 JuegoSapo.js (El Director)
**¿Qué hace?** Es como el "director de orquesta" que coordina todo:
- Crea el cerebro del juego
- Crea el controlador de teclado
- Los conecta para que trabajen juntos
- Maneja errores si algo sale mal

### 5. 🎨 Archivos CSS (La Apariencia)
**base.css** - Colores, fuentes y estilos básicos
**botones.css** - Cómo se ven y comportan los botones

## 🚀 CÓMO USAR EL CÓDIGO

### Para Desarrolladores Principiantes:

1. **Abrir el juego:**
   - Abre `juego-simple.html` en tu navegador
   - El juego se carga automáticamente

2. **Modificar el juego:**
   - **Cambiar colores:** Edita `src/estilos/base.css`
   - **Cambiar lógica:** Edita `src/core/GameEngine.js`
   - **Cambiar controles:** Edita `src/controladores/ControladorTeclado.js`

3. **Agregar nuevas funciones:**
   - Crea nuevos métodos en `GameEngine.js`
   - Agrega nuevas teclas en `ControladorTeclado.js`
   - Usa las herramientas de `Helpers.js`

## 🔄 FLUJO DEL JUEGO

```
1. Usuario abre juego-simple.html
   ↓
2. Se carga JuegoSapo.js (director)
   ↓
3. Se crea GameEngine.js (cerebro)
   ↓
4. Se crea ControladorTeclado.js (controles)
   ↓
5. Usuario presiona teclas
   ↓
6. ControladorTeclado traduce las teclas
   ↓
7. GameEngine actualiza el estado del juego
   ↓
8. La pantalla se actualiza
   ↓
9. Se repite hasta que alguien gana
```

## 🎯 VENTAJAS DE ESTA ARQUITECTURA

### ✅ **Organización Clara**
- Cada archivo tiene una responsabilidad específica
- Es fácil encontrar dónde está cada cosa
- El código está separado por funciones

### ✅ **Fácil de Mantener**
- Si hay un error, sabes exactamente dónde buscarlo
- Puedes cambiar una parte sin afectar las demás
- Es fácil agregar nuevas funciones

### ✅ **Comentarios Detallados**
- Todo está explicado en español
- Los comentarios explican QUÉ hace cada cosa y POR QUÉ
- Es como tener un profesor explicándote el código

### ✅ **Modular**
- Puedes usar partes del código en otros proyectos
- Es fácil hacer pruebas de cada parte por separado
- Varios programadores pueden trabajar al mismo tiempo

## 🛠️ PRÓXIMOS PASOS SUGERIDOS

1. **Mejorar la Interfaz:**
   - Agregar animaciones más bonitas
   - Mejorar los efectos visuales
   - Hacer que sea responsive (que se vea bien en móviles)

2. **Agregar Funciones:**
   - Sistema de puntuaciones altas
   - Diferentes niveles de dificultad
   - Sonidos reales
   - Efectos de partículas

3. **Optimizar el Código:**
   - Agregar manejo de errores más robusto
   - Implementar pruebas automatizadas
   - Mejorar el rendimiento

## 📚 RECURSOS PARA APRENDER MÁS

- **JavaScript Básico:** Aprende sobre variables, funciones y objetos
- **CSS:** Aprende sobre estilos y animaciones
- **HTML:** Aprende sobre estructura de páginas web
- **Arquitectura de Software:** Aprende sobre patrones de diseño

## 🤝 CÓMO CONTRIBUIR

Si quieres mejorar este código:

1. **Lee todo el código** para entender cómo funciona
2. **Haz cambios pequeños** primero
3. **Prueba todo** antes de hacer cambios grandes
4. **Mantén los comentarios actualizados**
5. **Sigue el mismo estilo** de código

---

**¡Diviértete programando! 🎮✨**
