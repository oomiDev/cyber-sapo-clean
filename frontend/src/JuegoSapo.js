/**
 * CYBER SAPO - Archivo Principal del Juego
 * 
 * EXPLICACIÓN PARA NIÑOS:
 * Este es el archivo MÁS IMPORTANTE. Es como el "director de orquesta" que coordina
 * todo el juego. Aquí juntamos todas las piezas:
 * - El motor del juego (que guarda la información)
 * - El controlador de teclado (que escucha las teclas)
 * - La pantalla (que muestra todo)
 * 
 * Es como armar un rompecabezas: cada pieza tiene su lugar y función.
 */

// PASO 1: Importar todas las piezas que necesitamos
import { GameEngine } from './core/GameEngine.js';
import { ControladorTeclado } from './controladores/ControladorTeclado.js';

export class JuegoSapo {
    constructor() {
        console.log('🐸 Iniciando CYBER SAPO...');
        
        // PASO 2: Crear las piezas principales del juego
        this.motorDelJuego = null;           // El "cerebro" del juego
        this.controladorTeclado = null;      // El "oído" que escucha teclas
        this.juegoIniciado = false;          // ¿Ya está todo listo?
        
        // PASO 3: Empezar a armar todo
        this.inicializar();
    }
    
    // MÉTODO PRINCIPAL: Inicializar todo el juego
    inicializar() {
        console.log('🔧 Configurando el juego...');
        
        // PASO 1: Esperar a que la página web esté completamente cargada
        if (document.readyState === 'loading') {
            // Si aún está cargando, esperar
            document.addEventListener('DOMContentLoaded', () => {
                this.configurarJuego();
            });
        } else {
            // Si ya está cargada, configurar inmediatamente
            this.configurarJuego();
        }
    }
    
    // MÉTODO: Configurar todas las piezas del juego
    configurarJuego() {
        try {
            console.log('⚙️ Creando las piezas del juego...');
            
            // PASO 1: Crear el "cerebro" del juego
            this.motorDelJuego = new GameEngine();
            console.log('✅ Motor del juego creado');
            
            // PASO 2: Crear el controlador de teclado y conectarlo al motor
            this.controladorTeclado = new ControladorTeclado(this.motorDelJuego);
            console.log('✅ Controlador de teclado creado');
            
            // PASO 3: Configurar la pantalla inicial
            this.configurarPantallaInicial();
            console.log('✅ Pantalla inicial configurada');
            
            // PASO 4: Configurar eventos de botones (si los hay)
            this.configurarBotones();
            console.log('✅ Botones configurados');
            
            // PASO 5: Todo listo
            this.juegoIniciado = true;
            console.log('🎮 ¡CYBER SAPO listo para jugar!');
            
        } catch (error) {
            console.error('❌ Error al configurar el juego:', error);
            this.mostrarErrorInicial(error);
        }
    }
    
    // MÉTODO: Configurar la pantalla de inicio
    configurarPantallaInicial() {
        // PASO 1: Asegurarse de que solo la pantalla de inicio esté visible
        this.ocultarTodasLasPantallas();
        
        // PASO 2: Mostrar la pantalla de inicio
        const pantallaInicio = document.getElementById('start-screen');
        if (pantallaInicio) {
            pantallaInicio.classList.add('active');
            console.log('✅ Pantalla de inicio mostrada');
        } else {
            console.warn('⚠️ No se encontró la pantalla de inicio');
        }
        
        // PASO 3: Configurar el foco para capturar teclas
        this.configurarFocoDelTeclado();
    }
    
    // MÉTODO: Configurar botones de la interfaz
    configurarBotones() {
        // Botón "Nuevo Juego"
        const botonNuevoJuego = document.getElementById('new-game');
        if (botonNuevoJuego) {
            botonNuevoJuego.addEventListener('click', () => {
                console.log('🎮 Botón "Nuevo Juego" presionado');
                this.controladorTeclado.irAPantallaConfiguracion();
            });
        }
        
        // Botón "Jugar de Nuevo"
        const botonJugarDeNuevo = document.getElementById('play-again');
        if (botonJugarDeNuevo) {
            botonJugarDeNuevo.addEventListener('click', () => {
                console.log('🔄 Botón "Jugar de Nuevo" presionado');
                this.reiniciarJuego();
            });
        }
        
        // Botones de los orificios del tablero
        this.configurarBotonesTablero();
    }
    
    // MÉTODO: Configurar los botones del tablero de juego
    configurarBotonesTablero() {
        const orificios = document.querySelectorAll('.hole');
        orificios.forEach(orificio => {
            orificio.addEventListener('click', () => {
                // Solo funciona si el juego está activo
                if (this.motorDelJuego.obtenerEstadoDelJuego().juegoEmpezado) {
                    const puntos = parseInt(orificio.dataset.value);
                    console.log(`🎯 Orificio clickeado: ${puntos} puntos`);
                    
                    const resultado = this.motorDelJuego.agregarPuntos(puntos);
                    if (resultado.exito) {
                        this.controladorTeclado.mostrarAnimacionPuntos(puntos);
                        this.controladorTeclado.actualizarPantallaJuego();
                        
                        if (resultado.juegoTerminado) {
                            this.controladorTeclado.mostrarPantallaGanador(resultado.ganador);
                        }
                    }
                }
            });
        });
    }
    
    // MÉTODO: Configurar el foco del teclado
    configurarFocoDelTeclado() {
        // PASO 1: Hacer que el body pueda recibir el foco
        document.body.setAttribute('tabindex', '0');
        document.body.focus();
        
        // PASO 2: Quitar el foco de otros elementos para evitar conflictos
        document.querySelectorAll('button, input, select, textarea, a').forEach(elemento => {
            elemento.setAttribute('tabindex', '-1');
        });
        
        console.log('🎯 Foco del teclado configurado');
    }
    
    // MÉTODO: Ocultar todas las pantallas
    ocultarTodasLasPantallas() {
        const pantallas = document.querySelectorAll('.screen');
        pantallas.forEach(pantalla => {
            pantalla.classList.remove('active');
        });
    }
    
    // MÉTODO: Reiniciar el juego completamente
    reiniciarJuego() {
        console.log('🔄 Reiniciando el juego...');
        
        // PASO 1: Crear un nuevo motor de juego (borra todo lo anterior)
        this.motorDelJuego = new GameEngine();
        
        // PASO 2: Volver a la pantalla inicial
        this.controladorTeclado.pantallaActual = 'inicio';
        this.configurarPantallaInicial();
        
        console.log('✅ Juego reiniciado');
    }
    
    // MÉTODO: Mostrar error si algo sale mal
    mostrarErrorInicial(error) {
        const mensajeError = `
            <div style="color: red; text-align: center; padding: 20px;">
                <h2>❌ Error al cargar el juego</h2>
                <p>Ha ocurrido un problema: ${error.message}</p>
                <p>Por favor, recarga la página.</p>
            </div>
        `;
        
        document.body.innerHTML = mensajeError;
    }
    
    // MÉTODOS PÚBLICOS PARA CONTROLAR EL JUEGO DESDE FUERA
    
    // Obtener información del estado actual
    obtenerEstado() {
        if (!this.motorDelJuego) return null;
        return {
            juegoIniciado: this.juegoIniciado,
            pantallaActual: this.controladorTeclado?.pantallaActual,
            estadoDelJuego: this.motorDelJuego.obtenerEstadoDelJuego(),
            configuracion: this.motorDelJuego.obtenerConfiguracion()
        };
    }
    
    // Forzar reinicio desde fuera
    forzarReinicio() {
        this.reiniciarJuego();
    }
}

// FUNCIÓN PRINCIPAL: Crear e iniciar el juego cuando se carga la página
window.addEventListener('DOMContentLoaded', () => {
    console.log('🌐 Página cargada, iniciando CYBER SAPO...');
    
    // Crear la instancia principal del juego
    window.cyberSapo = new JuegoSapo();
    
    console.log('🎮 CYBER SAPO disponible globalmente como window.cyberSapo');
});

// También exportar para uso como módulo
export default JuegoSapo;
