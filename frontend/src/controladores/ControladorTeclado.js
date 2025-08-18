/**
 * CYBER SAPO - Controlador de Teclado
 * 
 * EXPLICACIÓN PARA NIÑOS:
 * Este archivo es como un "traductor" que entiende qué teclas presionas
 * y le dice al juego qué hacer con cada tecla.
 * 
 * Es como cuando juegas con un control remoto: cada botón hace algo diferente.
 * Aquí cada tecla del teclado hace algo diferente en el juego.
 */

export class ControladorTeclado {
    constructor(motorDelJuego) {
        // PASO 1: Guardar una referencia al "cerebro" del juego
        this.motorDelJuego = motorDelJuego;
        
        // PASO 2: Crear un "diccionario" que dice qué puntos da cada tecla
        // Es como una tabla: tecla = puntos
        this.teclasYPuntos = {
            'q': 5,     // La tecla Q da 5 puntos
            'w': 8,     // La tecla W da 8 puntos
            'e': 12,    // La tecla E da 12 puntos
            'r': 15,    // Y así sucesivamente...
            'a': 3,
            's': 10,
            'd': 100,   // ¡La D da 100 puntos! (la rana grande)
            'f': 20,
            'z': 7,
            'x': 18,
            'c': 50,    // La C da 50 puntos (la rana pequeña)
            'v': 25,
            't': 30,
            'g': 40
        };
        
        // PASO 3: Saber en qué pantalla estamos
        this.pantallaActual = 'inicio';  // Empezamos en la pantalla de inicio
        
        // PASO 4: Configurar el "oído" del programa para escuchar teclas
        this.configurarEscuchadorDeTeclas();
    }
    
    // MÉTODO: Configurar el escuchador de teclas
    configurarEscuchadorDeTeclas() {
        // Le decimos al navegador: "Cuando alguien presione una tecla, llama a este método"
        document.addEventListener('keydown', (evento) => {
            this.manejarTeclaPresionada(evento);
        });
        
        console.log('🎮 Controlador de teclado listo para escuchar');
    }
    
    // MÉTODO PRINCIPAL: Qué hacer cuando presionan una tecla
    manejarTeclaPresionada(evento) {
        // PASO 1: Obtener qué tecla presionaron (en minúsculas)
        const teclaPresionada = evento.key.toLowerCase();
        
        console.log(`🔥 Tecla presionada: "${teclaPresionada}" en pantalla: ${this.pantallaActual}`);
        
        // PASO 2: Decidir qué hacer según en qué pantalla estamos
        switch (this.pantallaActual) {
            case 'inicio':
                this.manejarTeclasEnInicio(evento, teclaPresionada);
                break;
            case 'configuracion':
                this.manejarTeclasEnConfiguracion(evento, teclaPresionada);
                break;
            case 'juego':
                this.manejarTeclasEnJuego(evento, teclaPresionada);
                break;
        }
    }
    
    // MÉTODO: Qué hacer con las teclas en la pantalla de inicio
    manejarTeclasEnInicio(evento, tecla) {
        if (tecla === ' ') {
            // Si presionan ESPACIO, ir a la pantalla de configuración
            console.log('✅ Espacio presionado - yendo a configuración');
            evento.preventDefault();  // No hacer lo que normalmente hace el espacio
            this.irAPantallaConfiguracion();
        }
    }
    
    // MÉTODO: Qué hacer con las teclas en la pantalla de configuración
    manejarTeclasEnConfiguracion(evento, tecla) {
        // Obtener el estado actual de la configuración
        const configuracion = this.motorDelJuego.obtenerConfiguracion();
        
        if (tecla === 'Tab') {
            // TAB = cambiar entre opciones del menú
            console.log('📋 Tab presionado - cambiando opción del menú');
            evento.preventDefault();
            this.cambiarOpcionDelMenu();
            
        } else if (tecla === ' ') {
            // ESPACIO = seleccionar/cambiar la opción actual
            console.log('🚀 Espacio presionado - cambiando configuración');
            evento.preventDefault();
            this.cambiarConfiguracionActual(configuracion.opcionSeleccionada);
            
        } else if (tecla === 'm') {
            // M = agregar moneda
            console.log('💰 M presionado - agregando moneda');
            evento.preventDefault();
            this.motorDelJuego.agregarMoneda();
            this.actualizarPantallaConfiguracion();
        }
    }
    
    // MÉTODO: Qué hacer con las teclas durante el juego
    manejarTeclasEnJuego(evento, tecla) {
        // CASO A: Teclas de puntuación
        if (this.teclasYPuntos.hasOwnProperty(tecla)) {
            const puntos = this.teclasYPuntos[tecla];
            console.log(`🎯 Puntuación: ${tecla} = ${puntos} puntos`);
            
            evento.preventDefault();
            
            // Decirle al motor del juego que agregue estos puntos
            const resultado = this.motorDelJuego.agregarPuntos(puntos);
            
            if (resultado.exito) {
                this.mostrarAnimacionPuntos(puntos);
                this.actualizarPantallaJuego();
                
                // ¿Alguien ganó?
                if (resultado.juegoTerminado) {
                    this.mostrarPantallaGanador(resultado.ganador);
                }
            }
        }
        // CASO B: Cambiar de jugador
        else if (tecla === 'Enter' || tecla === ' ') {
            console.log('👥 Cambiar jugador');
            evento.preventDefault();
            
            const resultado = this.motorDelJuego.cambiarAlSiguienteJugador();
            if (resultado.exito) {
                this.actualizarPantallaJuego();
            }
        }
    }
    
    // MÉTODO: Cambiar entre las opciones del menú de configuración
    cambiarOpcionDelMenu() {
        const configuracion = this.motorDelJuego.obtenerConfiguracion();
        
        // Cambiar a la siguiente opción (0→1→2→3→4→0...)
        this.motorDelJuego.configuracion.opcionSeleccionada = 
            (configuracion.opcionSeleccionada + 1) % 5;
        
        this.actualizarPantallaConfiguracion();
    }
    
    // MÉTODO: Cambiar la configuración según qué opción está seleccionada
    cambiarConfiguracionActual(opcionSeleccionada) {
        switch (opcionSeleccionada) {
            case 0: // Tipo de juego
                this.motorDelJuego.cambiarTipoDeJuego();
                break;
            case 1: // Número de jugadores
                this.motorDelJuego.aumentarNumeroJugadores();
                break;
            case 2: // Puntos para ganar
                this.motorDelJuego.cambiarPuntosParaGanar();
                break;
            case 3: // Créditos (usar tecla M)
                console.log('💰 Usa la tecla M para agregar monedas');
                break;
            case 4: // Iniciar juego
                this.intentarEmpezarJuego();
                break;
        }
        this.actualizarPantallaConfiguracion();
    }
    
    // MÉTODO: Intentar empezar el juego
    intentarEmpezarJuego() {
        console.log('🚀 Intentando empezar el juego...');
        
        if (this.motorDelJuego.podemosEmpezar()) {
            const resultado = this.motorDelJuego.empezarJuego();
            if (resultado.exito) {
                console.log('✅ ¡Juego empezado!');
                this.irAPantallaJuego();
            } else {
                console.log('❌ Error al empezar:', resultado.error);
                alert('Error: ' + resultado.error);
            }
        } else {
            console.log('❌ No se puede empezar - faltan monedas');
            alert('¡Faltan monedas! Presiona M para agregar monedas.');
        }
    }
    
    // MÉTODOS PARA CAMBIAR DE PANTALLA
    
    irAPantallaConfiguracion() {
        this.pantallaActual = 'configuracion';
        this.motorDelJuego.configuracion.enModoConfiguracion = true;
        this.ocultarTodasLasPantallas();
        this.mostrarPantalla('setup-screen');
        this.actualizarPantallaConfiguracion();
    }
    
    irAPantallaJuego() {
        this.pantallaActual = 'juego';
        this.ocultarTodasLasPantallas();
        this.mostrarPantalla('game-screen');
        this.actualizarPantallaJuego();
    }
    
    // MÉTODOS AUXILIARES PARA LA INTERFAZ
    
    ocultarTodasLasPantallas() {
        document.querySelectorAll('.screen').forEach(pantalla => {
            pantalla.classList.remove('active');
        });
    }
    
    mostrarPantalla(idDePantalla) {
        const pantalla = document.getElementById(idDePantalla);
        if (pantalla) {
            pantalla.classList.add('active');
        }
    }
    
    // Estos métodos actualizan lo que se ve en pantalla
    // (Los detalles se implementarán después)
    actualizarPantallaConfiguracion() {
        console.log('🔄 Actualizando pantalla de configuración');
        // TODO: Implementar actualización de la interfaz
    }
    
    actualizarPantallaJuego() {
        console.log('🔄 Actualizando pantalla de juego');
        // TODO: Implementar actualización de la interfaz
    }
    
    mostrarAnimacionPuntos(puntos) {
        console.log(`✨ Mostrando animación de ${puntos} puntos`);
        // TODO: Implementar animación
    }
    
    mostrarPantallaGanador(ganador) {
        console.log(`🏆 ¡${ganador.nombre} ganó!`);
        alert(`🏆 ¡${ganador.nombre} ganó con ${ganador.puntos} puntos!`);
        // TODO: Implementar pantalla de ganador
    }
}
