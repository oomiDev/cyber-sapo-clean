/**
 * CYBER SAPO - Motor del Juego
 * 
 * EXPLICACIÓN PARA NIÑOS:
 * Este archivo es como el "cerebro" del juego. Aquí guardamos toda la información
 * importante del juego, como quién está jugando, cuántos puntos tienen, y las reglas.
 * 
 * Es como cuando juegas con fichas: necesitas saber de quién es el turno,
 * cuántas fichas tiene cada uno, y cuándo alguien gana.
 */

export class GameEngine {
    constructor() {
        // PASO 1: Crear las "cajas" donde guardaremos la información del juego
        
        // Esta "caja" guarda todo lo que pasa DURANTE el juego
        this.estadoDelJuego = {
            jugadores: [],              // Lista de todos los jugadores (como una fila de niños)
            jugadorActual: 0,           // Quién está jugando ahora (el primero, segundo, etc.)
            puntosParaGanar: 1000,      // Cuántos puntos necesitas para ganar
            juegoEmpezado: false,       // ¿Ya empezó el juego? (sí o no)
            tirosPorJugador: 6,         // Cuántos tiros puede hacer cada jugador
            horaDeInicio: null          // A qué hora empezó el juego
        };
        
        // Esta "caja" guarda la configuración ANTES de empezar el juego
        this.configuracion = {
            tipoDeJuego: 0,             // 0=Individual, 1=Parejas, 2=Equipos
            numeroJugadores: 2,         // Cuántos van a jugar
            puntosParaGanar: 1000,      // Meta de puntos
            monedasIngresadas: 0,       // Cuántas monedas metieron
            opcionSeleccionada: 0,      // Qué opción está seleccionada en el menú
            enModoConfiguracion: false  // ¿Estamos configurando el juego?
        };
        
        // Esta lista tiene los diferentes tipos de juego disponibles
        this.tiposDeJuego = [
            { 
                nombre: 'Individual', 
                jugadoresPorEquipo: 1, 
                tirosTotales: 6, 
                etiqueta: 'jugadores'
            },
            { 
                nombre: 'Parejas', 
                jugadoresPorEquipo: 2, 
                tirosTotales: 12, 
                etiqueta: 'parejas'
            },
            { 
                nombre: 'Equipos de 3', 
                jugadoresPorEquipo: 3, 
                tirosTotales: 18, 
                etiqueta: 'equipos'
            }
        ];
    }
    
    // MÉTODO PRINCIPAL: Empezar el juego
    empezarJuego() {
        // PASO 1: Obtener la información que configuramos
        const tipoDeJuegoElegido = this.tiposDeJuego[this.configuracion.tipoDeJuego];
        const cuantosEquipos = this.configuracion.numeroJugadores;
        const puntosNecesarios = this.configuracion.puntosParaGanar;
        
        // PASO 2: Verificar si tenemos suficientes monedas
        const monedasNecesarias = this.calcularMonedasNecesarias();
        if (this.configuracion.monedasIngresadas < monedasNecesarias) {
            // Si no hay suficientes monedas, no podemos empezar
            return { exito: false, error: 'No hay suficientes monedas' };
        }
        
        // PASO 3: "Gastar" las monedas necesarias
        this.configuracion.monedasIngresadas -= monedasNecesarias;
        this.configuracion.enModoConfiguracion = false;
        
        // PASO 4: Crear la lista de jugadores
        this.estadoDelJuego.jugadores = this.crearJugadores(cuantosEquipos, tipoDeJuegoElegido);
        this.estadoDelJuego.puntosParaGanar = puntosNecesarios;
        this.estadoDelJuego.jugadorActual = 0;  // Empezamos con el primer jugador
        this.estadoDelJuego.juegoEmpezado = true;
        this.estadoDelJuego.tirosPorJugador = tipoDeJuegoElegido.tirosTotales;
        this.estadoDelJuego.horaDeInicio = new Date();  // Guardamos cuándo empezó
        
        // PASO 5: Decir que todo salió bien
        return { exito: true, estadoDelJuego: this.estadoDelJuego };
    }
    
    // MÉTODO: Crear la lista de jugadores
    crearJugadores(cuantosEquipos, tipoDeJuego) {
        // Creamos una lista vacía donde pondremos a todos los jugadores
        const listaDeJugadores = [];
        
        // PASO 1: Crear cada equipo o jugador individual
        for (let i = 0; i < cuantosEquipos; i++) {
            
            if (tipoDeJuego.jugadoresPorEquipo === 1) {
                // CASO A: Juego individual (cada persona juega sola)
                listaDeJugadores.push({
                    nombre: `Jugador ${i + 1}`,           // "Jugador 1", "Jugador 2", etc.
                    puntos: 0,                            // Empiezan con 0 puntos
                    tiros: [],                            // Lista vacía de sus tiros
                    tirosRestantes: tipoDeJuego.tirosTotales,
                    esEquipo: false                       // No es un equipo, es individual
                });
            } else {
                // CASO B: Juego en equipo (varias personas juntas)
                
                // Decidir el nombre del equipo
                const nombreEquipo = tipoDeJuego.jugadoresPorEquipo === 2 
                    ? `Pareja ${i + 1}`      // Si son 2: "Pareja 1", "Pareja 2"
                    : `Equipo ${i + 1}`;     // Si son 3: "Equipo 1", "Equipo 2"
                
                // Crear la lista de miembros del equipo
                const miembrosDelEquipo = [];
                for (let j = 0; j < tipoDeJuego.jugadoresPorEquipo; j++) {
                    miembrosDelEquipo.push(`${nombreEquipo} - Jugador ${j + 1}`);
                }
                
                // Agregar el equipo completo a la lista
                listaDeJugadores.push({
                    nombre: nombreEquipo,
                    puntos: 0,
                    tiros: [],
                    tirosRestantes: tipoDeJuego.tirosTotales,
                    miembrosDelEquipo: miembrosDelEquipo,
                    miembroActual: 0,                     // Quién del equipo está jugando ahora
                    esEquipo: true,                       // Sí es un equipo
                    tirosPorMiembro: 6                    // Cada miembro puede hacer 6 tiros
                });
            }
        }
        
        return listaDeJugadores;
    }
    
    // MÉTODO: Agregar puntos cuando alguien acierta
    agregarPuntos(puntos) {
        // PASO 1: Verificar que el juego haya empezado
        if (!this.estadoDelJuego.juegoEmpezado) {
            return { exito: false, error: 'El juego no ha empezado' };
        }
        
        // PASO 2: Encontrar quién está jugando ahora
        const jugadorActual = this.estadoDelJuego.jugadores[this.estadoDelJuego.jugadorActual];
        if (!jugadorActual) {
            return { exito: false, error: 'No hay jugador actual' };
        }
        
        // PASO 3: Decidir a quién le sumamos los puntos
        let jugadorQueRecibePuntos = jugadorActual;
        
        // Si es un equipo, los puntos van al miembro que está jugando ahora
        if (jugadorActual.esEquipo) {
            // Encontrar qué miembro del equipo está jugando
            const miembroActual = jugadorActual.miembrosDelEquipo[jugadorActual.miembroActual];
            jugadorQueRecibePuntos = miembroActual;
        }
        
        // PASO 4: Agregar el tiro a la lista y sumar los puntos
        if (!jugadorQueRecibePuntos.tiros) {
            jugadorQueRecibePuntos.tiros = [];  // Crear lista si no existe
        }
        jugadorQueRecibePuntos.tiros.push(puntos);      // Agregar este tiro
        jugadorQueRecibePuntos.puntos += puntos;        // Sumar los puntos
        
        // PASO 5: ¿Alguien ya ganó?
        if (jugadorQueRecibePuntos.puntos >= this.estadoDelJuego.puntosParaGanar) {
            return this.terminarJuego(jugadorActual);
        }
        
        // PASO 6: Si nadie ganó, continuar el juego
        return { 
            exito: true, 
            puntosDelTiro: puntos, 
            puntosTotal: jugadorQueRecibePuntos.puntos 
        };
    }
    
    // MÉTODO: Cambiar al siguiente jugador
    cambiarAlSiguienteJugador() {
        // PASO 1: Verificar que el juego esté activo
        if (!this.estadoDelJuego.juegoEmpezado) {
            return { exito: false };
        }
        
        // PASO 2: Obtener el jugador que está jugando ahora
        const jugadorActual = this.estadoDelJuego.jugadores[this.estadoDelJuego.jugadorActual];
        
        if (jugadorActual.esEquipo) {
            // CASO A: Es un equipo (varios miembros)
            
            // Contar cuántos tiros ha hecho el miembro actual
            const miembroActual = jugadorActual.miembrosDelEquipo[jugadorActual.miembroActual];
            const tirosDelMiembro = miembroActual.tiros?.length || 0;
            
            if (tirosDelMiembro >= 6) {
                // El miembro actual ya terminó sus 6 tiros
                jugadorActual.miembroActual++;  // Pasar al siguiente miembro
                
                if (jugadorActual.miembroActual >= jugadorActual.miembrosDelEquipo.length) {
                    // Ya jugaron todos los miembros del equipo
                    // Pasar al siguiente equipo
                    this.estadoDelJuego.jugadorActual = 
                        (this.estadoDelJuego.jugadorActual + 1) % this.estadoDelJuego.jugadores.length;
                }
            }
        } else {
            // CASO B: Es un jugador individual
            // Simplemente pasar al siguiente jugador
            this.estadoDelJuego.jugadorActual = 
                (this.estadoDelJuego.jugadorActual + 1) % this.estadoDelJuego.jugadores.length;
        }
        
        return { 
            exito: true, 
            jugadorActual: this.estadoDelJuego.jugadorActual 
        };
    }
    
    // MÉTODO: Terminar el juego cuando alguien gana
    terminarJuego(ganador) {
        // PASO 1: Marcar que el juego ya terminó
        this.estadoDelJuego.juegoEmpezado = false;
        
        // PASO 2: Calcular cuánto tiempo duró el juego
        const horaFinal = new Date();
        const duracionDelJuego = horaFinal - this.estadoDelJuego.horaDeInicio;
        
        // PASO 3: Devolver toda la información del final del juego
        return {
            exito: true,
            juegoTerminado: true,
            ganador: ganador,
            duracion: duracionDelJuego
        };
    }
    
    // MÉTODOS PARA CONFIGURAR EL JUEGO ANTES DE EMPEZAR
    
    // Calcular cuántas monedas necesitamos
    calcularMonedasNecesarias() {
        const tipoActual = this.tiposDeJuego[this.configuracion.tipoDeJuego];
        // Número de equipos × jugadores por equipo = monedas necesarias
        return this.configuracion.numeroJugadores * tipoActual.jugadoresPorEquipo;
    }
    
    // ¿Podemos empezar el juego?
    podemosEmpezar() {
        const monedasNecesarias = this.calcularMonedasNecesarias();
        return this.configuracion.monedasIngresadas >= monedasNecesarias;
    }
    
    // Cambiar el tipo de juego (Individual → Parejas → Equipos → Individual...)
    cambiarTipoDeJuego() {
        this.configuracion.tipoDeJuego = (this.configuracion.tipoDeJuego + 1) % this.tiposDeJuego.length;
        return this.tiposDeJuego[this.configuracion.tipoDeJuego];
    }
    
    // Aumentar el número de jugadores/equipos
    aumentarNumeroJugadores() {
        this.configuracion.numeroJugadores++;
        if (this.configuracion.numeroJugadores > 20) {
            this.configuracion.numeroJugadores = 2;  // Volver al mínimo
        }
        return this.configuracion.numeroJugadores;
    }
    
    // Cambiar los puntos necesarios para ganar
    cambiarPuntosParaGanar() {
        this.configuracion.puntosParaGanar += 500;  // Aumentar de 500 en 500
        if (this.configuracion.puntosParaGanar > 5000) {
            this.configuracion.puntosParaGanar = 1000;  // Volver al mínimo
        }
        return this.configuracion.puntosParaGanar;
    }
    
    // Agregar una moneda
    agregarMoneda() {
        this.configuracion.monedasIngresadas++;
        return this.configuracion.monedasIngresadas;
    }
    
    // MÉTODOS PARA OBTENER INFORMACIÓN (como "preguntar" al juego)
    
    // ¿Cómo está el juego ahora?
    obtenerEstadoDelJuego() {
        return { ...this.estadoDelJuego };  // Hacer una copia para no modificar el original
    }
    
    // ¿Cómo está la configuración?
    obtenerConfiguracion() {
        return { ...this.configuracion };
    }
    
    // ¿Quién está jugando ahora?
    obtenerJugadorActual() {
        if (!this.estadoDelJuego.juegoEmpezado) {
            return null;  // Nadie está jugando si el juego no empezó
        }
        return this.estadoDelJuego.jugadores[this.estadoDelJuego.jugadorActual];
    }
    
    // ¿Qué tipos de juego hay disponibles?
    obtenerTiposDeJuego() {
        return [...this.tiposDeJuego];  // Hacer una copia de la lista
    }
}
