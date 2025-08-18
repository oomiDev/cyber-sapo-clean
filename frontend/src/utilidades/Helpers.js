/**
 * CYBER SAPO - Utilidades y Funciones de Ayuda
 * 
 * EXPLICACIÓN PARA NIÑOS:
 * Este archivo tiene "herramientas" pequeñas que usamos en diferentes partes del juego.
 * Es como una caja de herramientas: tienes un martillo, un destornillador, etc.
 * Cada herramienta hace una cosa específica y la puedes usar cuando la necesites.
 */

// HERRAMIENTA 1: Formatear tiempo de manera bonita
export function formatearTiempo(milisegundos) {
    // Convertir milisegundos a minutos y segundos
    const segundosTotales = Math.floor(milisegundos / 1000);
    const minutos = Math.floor(segundosTotales / 60);
    const segundos = segundosTotales % 60;
    
    // Agregar ceros si es necesario (ejemplo: 05 en lugar de 5)
    const minutosFormateados = minutos.toString().padStart(2, '0');
    const segundosFormateados = segundos.toString().padStart(2, '0');
    
    return `${minutosFormateados}:${segundosFormateados}`;
}

// HERRAMIENTA 2: Generar nombres aleatorios para jugadores
export function generarNombreAleatorio() {
    const nombres = [
        'Rana Saltarina', 'Sapo Veloz', 'Campeón Verde', 'Tiro Certero',
        'Rana Dorada', 'Sapo Mágico', 'Puntería Letal', 'Rana Ninja',
        'Sapo Maestro', 'Lanzador Pro', 'Rana Real', 'Sapo Genio'
    ];
    
    // Elegir un nombre al azar
    const indiceAleatorio = Math.floor(Math.random() * nombres.length);
    return nombres[indiceAleatorio];
}

// HERRAMIENTA 3: Crear efectos de sonido (simulados)
export function reproducirSonido(tipoSonido) {
    // En un juego real, aquí reproduciríamos sonidos
    // Por ahora, solo mostramos en la consola
    const sonidos = {
        'acierto': '🎯 ¡Plink!',
        'rana': '🐸 ¡CROAC! ¡100 puntos!',
        'ranita': '🐸 ¡Croak! ¡50 puntos!',
        'cambio_jugador': '👥 ¡Siguiente!',
        'victoria': '🏆 ¡GANASTE!',
        'moneda': '💰 ¡Clink!'
    };
    
    console.log(`🔊 ${sonidos[tipoSonido] || '🎵 Sonido desconocido'}`);
}

// HERRAMIENTA 4: Validar si un elemento HTML existe
export function elementoExiste(idDelElemento) {
    const elemento = document.getElementById(idDelElemento);
    return elemento !== null;
}

// HERRAMIENTA 5: Mostrar/ocultar elementos de forma segura
export function mostrarElemento(idDelElemento) {
    const elemento = document.getElementById(idDelElemento);
    if (elemento) {
        elemento.style.display = 'block';
        elemento.classList.add('visible');
        return true;
    }
    console.warn(`⚠️ No se encontró el elemento: ${idDelElemento}`);
    return false;
}

export function ocultarElemento(idDelElemento) {
    const elemento = document.getElementById(idDelElemento);
    if (elemento) {
        elemento.style.display = 'none';
        elemento.classList.remove('visible');
        return true;
    }
    console.warn(`⚠️ No se encontró el elemento: ${idDelElemento}`);
    return false;
}

// HERRAMIENTA 6: Cambiar texto de forma segura
export function cambiarTexto(idDelElemento, nuevoTexto) {
    const elemento = document.getElementById(idDelElemento);
    if (elemento) {
        elemento.textContent = nuevoTexto;
        return true;
    }
    console.warn(`⚠️ No se encontró el elemento: ${idDelElemento}`);
    return false;
}

// HERRAMIENTA 7: Crear animaciones simples
export function animarElemento(idDelElemento, tipoAnimacion, duracion = 1000) {
    const elemento = document.getElementById(idDelElemento);
    if (!elemento) return false;
    
    // Agregar clase de animación
    elemento.classList.add(tipoAnimacion);
    
    // Quitar la clase después de la duración especificada
    setTimeout(() => {
        elemento.classList.remove(tipoAnimacion);
    }, duracion);
    
    return true;
}

// HERRAMIENTA 8: Guardar y cargar datos del navegador
export function guardarDato(clave, valor) {
    try {
        localStorage.setItem(`cyberSapo_${clave}`, JSON.stringify(valor));
        return true;
    } catch (error) {
        console.error('❌ Error al guardar dato:', error);
        return false;
    }
}

export function cargarDato(clave, valorPorDefecto = null) {
    try {
        const dato = localStorage.getItem(`cyberSapo_${clave}`);
        return dato ? JSON.parse(dato) : valorPorDefecto;
    } catch (error) {
        console.error('❌ Error al cargar dato:', error);
        return valorPorDefecto;
    }
}

// HERRAMIENTA 9: Generar colores para los equipos
export function obtenerColorEquipo(numeroEquipo) {
    const colores = [
        '#00ff88',  // Verde neón
        '#00ffff',  // Cian
        '#ff00ff',  // Magenta
        '#ffff00',  // Amarillo
        '#ff8800',  // Naranja
        '#8800ff',  // Violeta
        '#ff0088',  // Rosa
        '#88ff00'   // Lima
    ];
    
    return colores[numeroEquipo % colores.length];
}

// HERRAMIENTA 10: Calcular estadísticas simples
export function calcularEstadisticas(listaDeNumeros) {
    if (!listaDeNumeros || listaDeNumeros.length === 0) {
        return { promedio: 0, maximo: 0, minimo: 0, total: 0 };
    }
    
    const total = listaDeNumeros.reduce((suma, numero) => suma + numero, 0);
    const promedio = total / listaDeNumeros.length;
    const maximo = Math.max(...listaDeNumeros);
    const minimo = Math.min(...listaDeNumeros);
    
    return {
        promedio: Math.round(promedio * 100) / 100,  // Redondear a 2 decimales
        maximo,
        minimo,
        total
    };
}

// HERRAMIENTA 11: Crear elementos HTML de forma fácil
export function crearElemento(tipo, clases = '', texto = '') {
    const elemento = document.createElement(tipo);
    
    if (clases) {
        elemento.className = clases;
    }
    
    if (texto) {
        elemento.textContent = texto;
    }
    
    return elemento;
}

// HERRAMIENTA 12: Esperar un tiempo determinado
export function esperar(milisegundos) {
    return new Promise(resolve => setTimeout(resolve, milisegundos));
}

// HERRAMIENTA 13: Generar ID único
export function generarIdUnico() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
