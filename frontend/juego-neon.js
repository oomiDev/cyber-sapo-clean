// Configuración de la máquina (se puede configurar por máquina)
const MACHINE_CONFIG = {
    machine_id: 1, // ID de esta máquina específica
    location_id: 1, // ID del local donde está la máquina
    backend_url: 'http://localhost:3001' // URL del backend
};

// Estado del juego
let gameState = {
    players: [],
    currentPlayerIndex: 0,
    maxPoints: 1000,
    gameStarted: false,
    maxThrows: 6,
    gameStartTime: null,
    totalRevenue: 0,
    mobileConnected: false,
    mobileControlled: false
};

// Estado de configuración
let configState = {
    gameType: 0, // 0 = Individual, 1 = Parejas, 2 = Equipos de 3
    numPlayers: 2,
    maxPoints: 1000,
    creditsInserted: 0, // Créditos ingresados
    currentSelector: 0, // 0 = tipo de juego, 1 = jugadores, 2 = puntos, 3 = créditos, 4 = iniciar
    inSetupMode: false // Inicialmente false porque empezamos en la pantalla de inicio
};

// Tipos de juego
const gameTypes = [
    { name: 'Individual', playersPerTeam: 1, maxThrows: 6, label: 'jugadores', playerLabel: 'Número de Jugadores' },
    { name: 'Parejas', playersPerTeam: 2, maxThrows: 12, label: 'parejas', playerLabel: 'Número de Parejas' },
    { name: 'Equipos de 3', playersPerTeam: 3, maxThrows: 18, label: 'equipos', playerLabel: 'Número de Equipos' }
];

// Estado de la pantalla de inicio
let startScreenState = {
    inStartScreen: true
};

// Mapeo de teclas a orificios
const keyToHole = {
    'q': 5, 'w': 8, 'e': 12, 'r': 15,
    'a': 3, 's': 10, 'd': 100, 'f': 20,
    'z': 7, 'x': 18, 'c': 50, 'v': 25,
    't': 6, 'g': 14, ' ': 0
};

// Función para configurar la máquina dinámicamente
function configureMachine() {
    // Intentar obtener configuración desde parámetros URL
    const urlParams = new URLSearchParams(window.location.search);
    const machineId = urlParams.get('machine_id');
    const locationId = urlParams.get('location_id');
    const backendUrl = urlParams.get('backend_url');
    
    // Intentar obtener configuración desde localStorage
    const storedMachineId = localStorage.getItem('machine_id');
    const storedLocationId = localStorage.getItem('location_id');
    const storedBackendUrl = localStorage.getItem('backend_url');
    
    // Actualizar configuración si se encuentran valores
    if (machineId) {
        MACHINE_CONFIG.machine_id = parseInt(machineId);
        localStorage.setItem('machine_id', machineId);
    } else if (storedMachineId) {
        MACHINE_CONFIG.machine_id = parseInt(storedMachineId);
    }
    
    if (locationId) {
        MACHINE_CONFIG.location_id = parseInt(locationId);
        localStorage.setItem('location_id', locationId);
    } else if (storedLocationId) {
        MACHINE_CONFIG.location_id = parseInt(storedLocationId);
    }
    
    if (backendUrl) {
        MACHINE_CONFIG.backend_url = backendUrl;
        localStorage.setItem('backend_url', backendUrl);
    } else if (storedBackendUrl) {
        MACHINE_CONFIG.backend_url = storedBackendUrl;
    }
    
    console.log('🎰 Configuración de máquina:', MACHINE_CONFIG);
    
    // Actualizar display de máquina en panel móvil
    const machineDisplay = document.getElementById('machine-display');
    if (machineDisplay) {
        machineDisplay.textContent = MACHINE_CONFIG.machine_id;
    }
}

// Función para verificar estado del backend
async function checkBackendStatus() {
    const statusElement = document.getElementById('connection-status');
    const statusIcon = statusElement.querySelector('.status-icon');
    const statusText = statusElement.querySelector('.status-text');
    
    try {
        const response = await fetch(`${MACHINE_CONFIG.backend_url}/api/health`, {
            method: 'GET',
            timeout: 5000
        });
        
        if (response.ok) {
            statusElement.className = 'connection-status online';
            
            // Simular conexión móvil después de 3 segundos
            setTimeout(() => {
                simulateMobileConnection();
            }, 3000);
            statusIcon.textContent = '🟢';
            statusText.textContent = `Backend Online (M${MACHINE_CONFIG.machine_id})`;
            return true;
        } else {
            throw new Error('Backend response not OK');
        }
    } catch (error) {
        statusElement.className = 'connection-status offline';
        statusIcon.textContent = '🔴';
        statusText.textContent = 'Backend Offline';
        console.warn('⚠️ Backend no disponible:', error.message);
        return false;
    }
}

// Función para verificar periódicamente el estado del backend
function startBackendStatusCheck() {
    // Verificar inmediatamente
    checkBackendStatus();
    
    // Verificar cada 30 segundos
    setInterval(checkBackendStatus, 30000);
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Configurar máquina dinámicamente
    configureMachine();
    
    // Iniciar verificación de estado del backend
    startBackendStatusCheck();
    
    console.log('CYBER SAPO cargado correctamente');
    console.log(`🎮 Estado inicial: inStartScreen=${startScreenState.inStartScreen}`);
    
    // Verificar que la pantalla de inicio esté activa
    const startScreen = document.getElementById('start-screen');
    if (startScreen && startScreen.classList.contains('active')) {
        console.log('✅ Pantalla de inicio está activa');
        startScreenState.inStartScreen = true;
    } else {
        console.log('❌ Pantalla de inicio NO está activa');
    }
    
    // Event Listeners (sin botón físico, solo teclado)
    document.getElementById('new-game').addEventListener('click', showSetupScreen);
    document.getElementById('play-again').addEventListener('click', showSetupScreen);
    
    // Event listener para teclado con captura agresiva
    document.addEventListener('keydown', handleKeyPress, true); // Usar captura
    window.addEventListener('keydown', handleKeyPress, true); // También en window
    
    // Prevenir comportamiento por defecto de Tab globalmente Y capturar teclas de juego
    document.addEventListener('keydown', function(e) {
        console.log(`🔥 KEYDOWN GLOBAL: "${e.key}", gameStarted: ${gameState.gameStarted}`);
        
        if (e.key === 'Tab' && (configState.inSetupMode || startScreenState.inStartScreen)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            console.log('🚫 Tab bloqueado globalmente');
            return;
        }
        
        // CAPTURAR TECLAS DE JUEGO AQUÍ DIRECTAMENTE
        if (gameState.gameStarted) {
            const key = e.key.toLowerCase();
            console.log(`🎮 JUEGO ACTIVO - Tecla: ${key}`);
            
            // Teclas de puntuación
            const keyToHole = {
                'q': 5, 'w': 8, 'e': 12, 'r': 15,
                'a': 3, 's': 10, 'd': 100, 'f': 20,
                'z': 7, 'x': 18, 'c': 50, 'v': 25,
                't': 30, 'g': 40
            };
            
            if (keyToHole.hasOwnProperty(key)) {
                console.log(`🎯 PUNTUACIÓN: ${key} = ${keyToHole[key]} puntos`);
                e.preventDefault();
                e.stopImmediatePropagation();
                addScore(keyToHole[key]);
                return false;
            }
            
            // Cambiar jugador
            if (e.key === 'Enter' || e.key === ' ') {
                console.log('👥 CAMBIAR JUGADOR');
                e.preventDefault();
                e.stopImmediatePropagation();
                changeToNextPlayer();
                return false;
            }
        }
    }, true);
    
    // Forzar focus para asegurar captura de eventos
    setTimeout(() => {
        document.body.focus();
        document.body.setAttribute('tabindex', '0');
        
        // Remover tabindex de otros elementos
        document.querySelectorAll('button, input, select, textarea, a').forEach(el => {
            el.setAttribute('tabindex', '-1');
        });
        
        console.log('🎯 Focus agresivo configurado globalmente');
        
        // Verificar estado inicial después del focus
        console.log(`🔍 Estado después del focus: inStartScreen=${startScreenState.inStartScreen}`);
    }, 200);

    // Botones de orificios del tablero
    document.querySelectorAll('.hole').forEach(hole => {
        hole.addEventListener('click', () => {
            if (!hole.classList.contains('disabled')) {
                const score = parseInt(hole.dataset.value);
                addScore(score);
            }
        });
    });
});

function updateConfigDisplay() {
    console.log(`🔄 Actualizando display - selector: ${configState.currentSelector}`);
    
    // Actualizar valores mostrados
    const currentGameType = gameTypes[configState.gameType];
    const gameTypeElement = document.getElementById('game-type-value');
    const playersElement = document.getElementById('players-value');
    const playersUnitElement = document.getElementById('players-unit');
    const pointsElement = document.getElementById('points-value');
    
    if (gameTypeElement) gameTypeElement.textContent = currentGameType.name;
    if (playersElement) playersElement.textContent = configState.numPlayers;
    if (playersUnitElement) playersUnitElement.textContent = currentGameType.label;
    if (pointsElement) pointsElement.textContent = configState.maxPoints;
    
    // Calcular créditos requeridos según el tipo de juego
    const creditsRequired = calculateCreditsRequired();
    const creditsRequiredElement = document.getElementById('credits-required-value');
    if (creditsRequiredElement) creditsRequiredElement.textContent = creditsRequired;
    
    // Actualizar créditos ingresados
    const creditsInsertedElement = document.getElementById('credits-inserted-value');
    if (creditsInsertedElement) creditsInsertedElement.textContent = configState.creditsInserted;
    
    // Actualizar botón de inicio según créditos
    updateStartButton();
    
    // Actualizar indicadores visuales
    const gameTypeSelector = document.getElementById('game-type-selector');
    const playersSelector = document.getElementById('players-selector');
    const pointsSelector = document.getElementById('points-selector');
    const creditsSelector = document.getElementById('credits-selector');
    const startSelector = document.getElementById('start-selector');
    
    // Remover clase active de todos
    [gameTypeSelector, playersSelector, pointsSelector, creditsSelector, startSelector].forEach(selector => {
        if (selector) selector.classList.remove('active');
    });
    
    // Agregar clase active al selector actual
    const selectors = [gameTypeSelector, playersSelector, pointsSelector, creditsSelector, startSelector];
    if (selectors[configState.currentSelector]) {
        selectors[configState.currentSelector].classList.add('active');
        console.log(`✅ Selector ${configState.currentSelector} activado`);
    }
}

function handleStartScreenKeyPress(event) {
    console.log(`🎯 Start screen - Tecla: ${event.key}, inStartScreen: ${startScreenState.inStartScreen}`);
    
    if (!startScreenState.inStartScreen) return;
    
    if (event.key === ' ') {
        console.log('✅ Espacio detectado en pantalla de inicio - yendo a configuración');
        event.preventDefault();
        event.stopPropagation();
        goToSetupScreen();
    }
}

function goToSetupScreen() {
    console.log('🎮 Navegando a pantalla de configuración');
    
    // Ocultar pantalla de inicio
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.classList.remove('active');
    }
    
    // Mostrar pantalla de configuración
    const setupScreen = document.getElementById('setup-screen');
    if (setupScreen) {
        setupScreen.classList.add('active');
    }
    
    // Actualizar estados
    startScreenState.inStartScreen = false;
    configState.inSetupMode = true;
    configState.currentSelector = 0; // Empezar en el primer selector
    
    // Forzar focus agresivo después de cambiar pantalla
    setTimeout(() => {
        // Remover tabindex de todos los elementos que puedan capturar focus
        document.querySelectorAll('[tabindex]').forEach(el => {
            if (el !== document.body) {
                el.setAttribute('tabindex', '-1');
            }
        });
        
        // Configurar body para capturar todas las teclas
        document.body.setAttribute('tabindex', '0');
        document.body.focus();
        
        // Prevenir comportamiento por defecto del Tab
        document.body.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        }, true);
        
        console.log('🎯 Focus agresivo configurado para configuración');
    }, 100);
    
    // Actualizar display inmediatamente
    updateConfigDisplay();
    
    console.log('✅ Pantalla de configuración mostrada');
    console.log(`🔧 Estado: inSetupMode=${configState.inSetupMode}, currentSelector=${configState.currentSelector}`);
}

// Función para ir a la pantalla de unirse
function goToJoinScreen() {
    console.log('🔗 Navegando a pantalla de unirse');
    
    // Ocultar pantalla de inicio
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.classList.remove('active');
    }
    
    // Mostrar pantalla de unirse
    const joinScreen = document.getElementById('join-screen');
    if (joinScreen) {
        joinScreen.classList.add('active');
    }
    
    // Actualizar estados
    startScreenState.inStartScreen = false;
    
    console.log('✅ Pantalla de unirse mostrada');
}

// Función para volver a la pantalla de inicio
function goToStartScreen() {
    console.log('🏠 Volviendo a pantalla de inicio');
    
    // Ocultar todas las pantallas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Mostrar pantalla de inicio
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.classList.add('active');
    }
    
    // Actualizar estados
    startScreenState.inStartScreen = true;
    configState.inSetupMode = false;
    
    console.log('✅ Pantalla de inicio mostrada');
}

// Función para unirse al juego
function joinGame() {
    console.log('🚀 Intentando unirse al juego');
    
    // Simular proceso de conexión
    const btn = event.target;
    const originalText = btn.textContent;
    
    btn.textContent = '🔄 CONECTANDO...';
    btn.disabled = true;
    
    setTimeout(() => {
        alert('¡Conectado exitosamente!\n\nTe has unido a la partida.\nEsperando que el host inicie el juego...');
        btn.textContent = '✅ CONECTADO - ESPERANDO';
        btn.style.background = 'linear-gradient(135deg, #4CAF50, #66BB6A)';
    }, 2000);
}

function handleSetupKeyPress(event) {
    console.log(`🔧 handleSetupKeyPress: "${event.key}", inSetupMode=${configState.inSetupMode}, currentSelector=${configState.currentSelector}`);
    
    if (!configState.inSetupMode) {
        console.log('❌ No estamos en modo setup, ignorando tecla');
        return;
    }
    
    if (event.key === 'Tab') {
        console.log('📋 Tab presionado - cambiando selector');
        event.preventDefault();
        event.stopPropagation();
        // Cambiar entre tipo de juego, jugadores, puntos, créditos e iniciar (0, 1, 2, 3, 4)
        configState.currentSelector = (configState.currentSelector + 1) % 5;
        console.log(`🎯 Nuevo selector: ${configState.currentSelector}`);
        updateConfigDisplay();
    } else if (event.key === ' ') {
        console.log(`🚀 Espacio presionado - selector actual: ${configState.currentSelector}`);
        event.preventDefault();
        event.stopPropagation();
        
        if (configState.currentSelector === 0) {
            // Cambiar tipo de juego
            configState.gameType = (configState.gameType + 1) % gameTypes.length;
            console.log(`🎮 Tipo de juego cambiado a: ${gameTypes[configState.gameType].name}`);
            updateConfigDisplay();
        } else if (configState.currentSelector === 1) {
            // Incrementar jugadores/parejas/equipos (2-20)
            configState.numPlayers++;
            if (configState.numPlayers > 20) {
                configState.numPlayers = 2;
            }
            console.log(`👥 Jugadores cambiado a: ${configState.numPlayers}`);
            updateConfigDisplay();
        } else if (configState.currentSelector === 2) {
            // Incrementar puntos (1000-5000 en incrementos de 500)
            configState.maxPoints += 500;
            if (configState.maxPoints > 5000) {
                configState.maxPoints = 1000;
            }
            console.log(`🎯 Puntos cambiado a: ${configState.maxPoints}`);
            updateConfigDisplay();
        } else if (configState.currentSelector === 3) {
            // Agregar crédito (no hacer nada aquí, se maneja con tecla M)
            console.log('💰 Espacio en créditos - usar tecla M para agregar');
        } else if (configState.currentSelector === 4) {
            // Iniciar juego
            console.log('🚀 Intentando iniciar juego...');
            if (canStartGame()) {
                console.log('✅ Iniciando juego!');
                startGame();
            } else {
                console.log('❌ No se puede iniciar - créditos insuficientes');
                alert('¡Créditos insuficientes! Presiona M para agregar créditos.');
            }
        }
    } else if (event.key.toLowerCase() === 'm') {
        console.log('💰 M presionado - agregando crédito');
        event.preventDefault();
        event.stopPropagation();
        // Agregar crédito
        configState.creditsInserted++;
        console.log(`💰 Créditos: ${configState.creditsInserted}`);
        updateConfigDisplay();
    }
}

function calculateCreditsRequired() {
    const currentGameType = gameTypes[configState.gameType];
    // Individual: número de jugadores
    // Parejas: número de parejas * 2
    // Equipos de 3: número de equipos * 3
    return configState.numPlayers * currentGameType.playersPerTeam;
}

function canStartGame() {
    const creditsRequired = calculateCreditsRequired();
    return configState.creditsInserted >= creditsRequired;
}

function updateStartButton() {
    const creditsRequired = calculateCreditsRequired();
    const startButtonText = document.getElementById('start-button-text');
    
    if (startButtonText) {
        if (canStartGame()) {
            startButtonText.textContent = '🚀 INICIAR PARTIDA';
            startButtonText.style.color = '#00ff00';
        } else {
            const missing = creditsRequired - configState.creditsInserted;
            startButtonText.textContent = `❌ FALTAN ${missing} CRÉDITOS`;
            startButtonText.style.color = '#ff00ff';
        }
    }
}

function startGame() {
    const currentGameType = gameTypes[configState.gameType];
    const numTeams = configState.numPlayers;
    const maxPoints = configState.maxPoints;
    
    // Verificar y descontar créditos
    const creditsRequired = calculateCreditsRequired();
    if (configState.creditsInserted < creditsRequired) {
        // No debería llegar aquí, pero por seguridad
        return;
    }
    
    // Descontar créditos usados, mantener los sobrantes para la siguiente partida
    configState.creditsInserted -= creditsRequired;
    
    // Desactivar modo configuración
    configState.inSetupMode = false;
    
    // Crear equipos/jugadores según el tipo de juego
    gameState.players = [];
    
    for (let i = 0; i < numTeams; i++) {
        if (currentGameType.playersPerTeam === 1) {
            // Juego individual
            gameState.players.push({
                name: `Jugador ${i + 1}`,
                score: 0,
                throws: [],
                throwsRemaining: currentGameType.maxThrows,
                teamMembers: [`Jugador ${i + 1}`],
                currentMember: 0,
                isTeam: false
            });
        } else {
            // Parejas o equipos
            const teamName = currentGameType.playersPerTeam === 2 ? `Pareja ${i + 1}` : `Equipo ${i + 1}`;
            const members = [];
            
            for (let j = 0; j < currentGameType.playersPerTeam; j++) {
                members.push(`${teamName.split(' ')[0]} ${i + 1} - Jugador ${j + 1}`);
            }
            
            gameState.players.push({
                name: teamName,
                score: 0,
                throws: [],
                throwsRemaining: currentGameType.maxThrows,
                teamMembers: members,
                currentMember: 0,
                isTeam: true,
                throwsPerMember: 6
            });
        }
    }
    
    gameState.maxPoints = maxPoints;
    gameState.currentPlayerIndex = 0;
    gameState.gameStarted = true;
    gameState.maxThrows = currentGameType.maxThrows; // Tiros según el tipo de juego
    gameState.gameStartTime = new Date(); // Registrar hora de inicio
    gameState.totalRevenue = creditsRequired * 0.50; // Calcular ingresos totales
    
    // Mostrar pantalla de juego
    document.getElementById('setup-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    
    // Inicializar interfaz
    updateGameDisplay();
}

function updateGameDisplay() {
    updatePlayersList();
    updateCurrentPlayerInfo();
    updateGoalDisplay();
    updateThrowsDisplay();
}

// Función para actualizar la visualización de tiros
function updateThrowsDisplay() {
    const throwsDisplay = document.getElementById('throws-display');
    if (!throwsDisplay) return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer) return;
    
    let playerToShow = currentPlayer;
    if (currentPlayer.isTeam) {
        playerToShow = currentPlayer.teamMembers[currentPlayer.currentMember];
    }
    
    // Limpiar display actual
    throwsDisplay.innerHTML = '';
    
    // Mostrar tiros realizados
    playerToShow.throws.forEach((points, index) => {
        const throwElement = document.createElement('div');
        throwElement.className = 'throw-result';
        throwElement.textContent = points;
        
        // Asignar clase según puntuación
        if (points === 100) {
            throwElement.classList.add('rana');
        } else if (points === 50) {
            throwElement.classList.add('ranita');
        } else if (points >= 40) {
            throwElement.classList.add('high');
        } else if (points >= 20) {
            throwElement.classList.add('medium');
        } else if (points >= 10) {
            throwElement.classList.add('low');
        } else {
            throwElement.classList.add('minimal');
        }
        
        throwsDisplay.appendChild(throwElement);
    });
    
    // Mostrar espacios vacíos para tiros restantes
    const throwsUsed = playerToShow.throws.length;
    const maxThrows = gameState.maxThrows;
    
    for (let i = throwsUsed; i < maxThrows; i++) {
        const emptyThrow = document.createElement('div');
        emptyThrow.className = 'throw-empty';
        throwsDisplay.appendChild(emptyThrow);
    }
}

function updatePlayersList() {
    const container = document.getElementById('players-list');
    container.innerHTML = '';
    
    // Calcular cuántos jugadores mostrar según el espacio disponible
    const maxVisiblePlayers = calculateMaxVisiblePlayers();
    const playersToShow = getPlayersToShow(maxVisiblePlayers);
    
    playersToShow.forEach(({ player, index, isPlaceholder }) => {
        const playerCard = document.createElement('div');
        
        if (isPlaceholder) {
            playerCard.className = 'player-card placeholder';
            playerCard.innerHTML = `
                <div class="player-name">... y ${gameState.players.length - maxVisiblePlayers + 1} más</div>
                <div class="player-score">Ver todos</div>
            `;
            playerCard.onclick = () => showAllPlayers();
        } else {
            playerCard.className = `player-card ${index === gameState.currentPlayerIndex ? 'active' : ''}`;
            
            let displayName = player.name;
            let displayScore = player.score;
            let displayThrows = player.throwsRemaining;
            let playerThrows = player.throws || [];
            
            if (player.isTeam) {
                const currentMember = player.teamMembers[player.currentMember];
                displayName = `${player.name} (${currentMember.name})`;
                displayScore = currentMember.score;
                displayThrows = currentMember.throwsRemaining;
                playerThrows = currentMember.throws || [];
            }
            
            // Crear visualización de tiros
            let throwsHTML = '';
            playerThrows.forEach(points => {
                let throwClass = '';
                if (points === 100) throwClass = 'rana';
                else if (points === 50) throwClass = 'ranita';
                else if (points >= 40) throwClass = 'high';
                else if (points >= 20) throwClass = 'medium';
                else if (points >= 10) throwClass = 'low';
                else throwClass = 'minimal';
                
                throwsHTML += `<div class="throw-result-small ${throwClass}">${points}</div>`;
            });
            
            playerCard.innerHTML = `
                <div class="player-name">${displayName}</div>
                <div class="player-score">${displayScore} pts</div>
                <div class="player-throws">${displayThrows} tiros</div>
                <div class="player-throws-display">
                    ${throwsHTML}
                </div>
            `;
            
            playerCard.onclick = () => changeCurrentPlayer(index);
        }
        
        container.appendChild(playerCard);
    });
}

function calculateMaxVisiblePlayers() {
    // Calcular el espacio disponible para jugadores
    const viewportHeight = window.innerHeight;
    const headerHeight = 100; // Espacio para título "JUGADORES"
    const playerCardHeight = 120; // Altura aproximada de cada tarjeta
    const availableHeight = viewportHeight - headerHeight - 50; // Margen de seguridad
    
    const maxPlayers = Math.floor(availableHeight / playerCardHeight);
    return Math.max(2, maxPlayers); // Mínimo 2 jugadores visibles
}

function getPlayersToShow(maxVisible) {
    const totalPlayers = gameState.players.length;
    
    // Si todos los jugadores caben, mostrarlos todos
    if (totalPlayers <= maxVisible) {
        return gameState.players.map((player, index) => ({ player, index, isPlaceholder: false }));
    }
    
    // Si hay demasiados jugadores, priorizar el jugador activo
    const currentIndex = gameState.currentPlayerIndex;
    const playersToShow = [];
    
    // Siempre incluir el jugador activo
    playersToShow.push({ 
        player: gameState.players[currentIndex], 
        index: currentIndex, 
        isPlaceholder: false 
    });
    
    // Calcular cuántos jugadores adicionales podemos mostrar
    const remainingSlots = maxVisible - 2; // -1 para el activo, -1 para el placeholder
    
    // Agregar jugadores cercanos al actual
    const playersAdded = new Set([currentIndex]);
    let slotsUsed = 0;
    
    // Agregar jugadores antes y después del actual
    for (let offset = 1; offset <= totalPlayers && slotsUsed < remainingSlots; offset++) {
        // Intentar agregar el siguiente
        const nextIndex = (currentIndex + offset) % totalPlayers;
        if (!playersAdded.has(nextIndex)) {
            playersToShow.push({ 
                player: gameState.players[nextIndex], 
                index: nextIndex, 
                isPlaceholder: false 
            });
            playersAdded.add(nextIndex);
            slotsUsed++;
        }
        
        // Intentar agregar el anterior
        if (slotsUsed < remainingSlots) {
            const prevIndex = (currentIndex - offset + totalPlayers) % totalPlayers;
            if (!playersAdded.has(prevIndex)) {
                playersToShow.push({ 
                    player: gameState.players[prevIndex], 
                    index: prevIndex, 
                    isPlaceholder: false 
                });
                playersAdded.add(prevIndex);
                slotsUsed++;
            }
        }
    }
    
    // Agregar placeholder si hay jugadores ocultos
    if (playersAdded.size < totalPlayers) {
        playersToShow.push({ player: null, index: -1, isPlaceholder: true });
    }
    
    // Ordenar por índice para mantener orden lógico
    return playersToShow.filter(p => !p.isPlaceholder).sort((a, b) => a.index - b.index)
        .concat(playersToShow.filter(p => p.isPlaceholder));
}

function updateCurrentPlayerInfo() {
    // Esperar a que el DOM esté listo
    setTimeout(() => {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        if (!currentPlayer) {
            console.log('❌ No hay jugador actual para actualizar');
            return;
        }
        
        let playerToShow = currentPlayer;
        if (currentPlayer.isTeam) {
            playerToShow = currentPlayer.teamMembers[currentPlayer.currentMember];
        }
        
        console.log(`🔄 Actualizando info del jugador: ${playerToShow.name}`);
        console.log(`📊 Puntos: ${playerToShow.score}, Tiros: ${playerToShow.throws ? playerToShow.throws.length : 0}`);
        
        // Actualizar nombre
        const nameElement = document.getElementById('current-player-name');
        if (nameElement) {
            nameElement.textContent = playerToShow.name;
            console.log(`✅ Nombre actualizado: ${playerToShow.name}`);
        } else {
            console.log('❌ Elemento current-player-name no encontrado');
        }
        
        // Actualizar contador de tiros
        const throwElement = document.getElementById('current-throw');
        if (throwElement) {
            const throwsUsed = playerToShow.throws ? playerToShow.throws.length : 0;
            const maxThrows = gameState.maxThrows;
            const currentThrowNumber = throwsUsed >= maxThrows ? maxThrows : throwsUsed + 1;
            const displayText = `${currentThrowNumber}/${maxThrows}`;
            throwElement.textContent = displayText;
            console.log(`✅ Tiros actualizado: ${displayText} (usado: ${throwsUsed}, max: ${maxThrows})`);
        } else {
            console.log('❌ Elemento current-throw no encontrado');
            console.log('🔍 Elementos disponibles:', document.querySelectorAll('[id*="throw"]'));
        }
        
        // Actualizar puntuación
        const scoreElement = document.getElementById('current-score');
        if (scoreElement) {
            scoreElement.textContent = playerToShow.score;
            console.log(`✅ Puntuación actualizada: ${playerToShow.score}`);
        } else {
            console.log('❌ Elemento current-score no encontrado');
            console.log('🔍 Elementos disponibles:', document.querySelectorAll('[id*="score"]'));
        }
    }, 100);
}

function updateThrowCircles(throwsUsed) {
    const circles = document.querySelectorAll('.throw-circle');
    const maxThrows = gameState.maxThrows || 6;
    
    circles.forEach((circle, index) => {
        if (index < maxThrows) {
            circle.style.display = 'block';
            if (index < throwsUsed) {
                circle.classList.add('filled');
            } else {
                circle.classList.remove('filled');
            }
        } else {
            circle.style.display = 'none';
        }
    });
}

function updateGoalDisplay() {
    document.getElementById('goal-points').textContent = `${gameState.maxPoints} PUNTOS`;
}

function changeCurrentPlayer(playerIndex) {
    if (playerIndex !== gameState.currentPlayerIndex && gameState.players[playerIndex].throwsRemaining > 0) {
        gameState.currentPlayerIndex = playerIndex;
        updateGameInterface();
    }
}

// Función para añadir puntuación
function addScore(points) {
    console.log(`🎯 addScore llamado con ${points} puntos`);
    
    if (!gameState.gameStarted) {
        console.log('❌ Juego no iniciado');
        return;
    }
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer) {
        console.log('❌ No hay jugador actual');
        return;
    }
    
    console.log(`🎮 Jugador actual: ${currentPlayer.name}`);
    
    // Si es un equipo, obtener el miembro actual
    let playerToUpdate = currentPlayer;
    if (currentPlayer.isTeam) {
        playerToUpdate = currentPlayer.teamMembers[currentPlayer.currentMember];
        console.log(`👥 Equipo - Miembro actual: ${playerToUpdate.name}`);
    }
    
    // Verificar si el jugador tiene tiros restantes
    if (playerToUpdate.throwsRemaining <= 0) {
        console.log('❌ No quedan tiros para este jugador');
        return;
    }
    
    // Añadir puntuación
    playerToUpdate.score += points;
    playerToUpdate.throwsRemaining--;
    playerToUpdate.throws.push(points);
    
    console.log(`✅ ${playerToUpdate.name} anota ${points} puntos. Total: ${playerToUpdate.score}`);
    console.log(`🎯 Tiros restantes: ${playerToUpdate.throwsRemaining}`);
    console.log(`📊 Meta actual: ${gameState.maxPoints}`);
    
    // Mostrar animación de puntuación
    showScoreAnimation(points);
    
    // Verificar logros
    checkAchievements(playerToUpdate, points);
    
    // Actualizar display INMEDIATAMENTE
    updateGameDisplay();
    
    console.log(`🔄 Display actualizado - Puntos: ${playerToUpdate.score}, Tiros: ${playerToUpdate.throws.length}/${gameState.maxThrows}`);
    
    // Verificar condiciones de victoria - CAMBIAR META A 100 PARA PRUEBAS
    const metaActual = 100; // Cambiar temporalmente para pruebas
    console.log(`🏆 Verificando victoria: ${playerToUpdate.score} >= ${metaActual}?`);
    if (playerToUpdate.score >= metaActual) {
        console.log(`🎉 ¡VICTORIA DETECTADA! ${playerToUpdate.name} ha ganado con ${playerToUpdate.score} puntos`);
        setTimeout(() => {
            console.log(`🏁 Ejecutando endGame para ${playerToUpdate.name}`);
            endGame(playerToUpdate);
        }, 2500); // Esperar a que termine la animación
        return;
    }
    
    // Si no quedan tiros (6 tiros máximo), cambiar automáticamente al siguiente jugador
    if (playerToUpdate.throwsRemaining <= 0) {
        setTimeout(() => {
            changeToNextPlayer();
        }, 2500); // Esperar a que termine la animación
    }
}

// Función para mostrar animación de puntuación
function showScoreAnimation(points) {
    // Determinar tipo de tiro y mensaje
    let message = '';
    let emoji = '';
    let color = '';
    
    if (points === 100) {
        message = '¡RANA!';
        emoji = '🐸';
        color = '#00ff00';
    } else if (points === 50) {
        message = '¡RANITA!';
        emoji = '🐸';
        color = '#ffff00';
    } else if (points >= 40) {
        message = '¡EXCELENTE!';
        emoji = '🎯';
        color = '#ff6b35';
    } else if (points >= 20) {
        message = '¡BUENO!';
        emoji = '👍';
        color = '#00ffff';
    } else if (points >= 10) {
        message = '¡BIEN!';
        emoji = '✨';
        color = '#ff00ff';
    } else {
        message = '¡PUNTO!';
        emoji = '⭐';
        color = '#ffffff';
    }
    
    // Crear elemento de animación
    const animation = document.createElement('div');
    animation.className = 'score-animation';
    animation.innerHTML = `
        <div class="score-content">
            <div class="score-emoji">${emoji}</div>
            <div class="score-message">${message}</div>
            <div class="score-points">+${points} PUNTOS</div>
        </div>
    `;
    
    // Estilos dinámicos
    animation.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: scorePopIn 0.3s ease-out;
    `;
    
    const scoreContent = animation.querySelector('.score-content');
    scoreContent.style.cssText = `
        text-align: center;
        color: ${color};
        text-shadow: 0 0 20px ${color};
        animation: scorePulse 2s ease-in-out;
    `;
    
    const scoreEmoji = animation.querySelector('.score-emoji');
    scoreEmoji.style.cssText = `
        font-size: 8rem;
        margin-bottom: 1rem;
        animation: emojiSpin 2s ease-in-out;
    `;
    
    const scoreMessage = animation.querySelector('.score-message');
    scoreMessage.style.cssText = `
        font-size: 4rem;
        font-weight: bold;
        margin-bottom: 1rem;
        text-transform: uppercase;
        letter-spacing: 0.2em;
    `;
    
    const scorePoints = animation.querySelector('.score-points');
    scorePoints.style.cssText = `
        font-size: 2.5rem;
        font-weight: bold;
        opacity: 0.9;
    `;
    
    // Añadir CSS de animaciones
    if (!document.getElementById('score-animations-css')) {
        const style = document.createElement('style');
        style.id = 'score-animations-css';
        style.textContent = `
            @keyframes scorePopIn {
                from { opacity: 0; transform: scale(0.5); }
                to { opacity: 1; transform: scale(1); }
            }
            @keyframes scorePulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            @keyframes emojiSpin {
                0% { transform: rotate(0deg) scale(1); }
                25% { transform: rotate(90deg) scale(1.2); }
                50% { transform: rotate(180deg) scale(1); }
                75% { transform: rotate(270deg) scale(1.2); }
                100% { transform: rotate(360deg) scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Mostrar animación
    document.body.appendChild(animation);
    
    // Remover después de 2 segundos
    setTimeout(() => {
        animation.style.animation = 'scorePopIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (animation.parentNode) {
                animation.parentNode.removeChild(animation);
            }
        }, 300);
    }, 2000);
}

// Hacer funciones globales para acceso desde HTML
window.addScore = addScore;
window.gameState = gameState;
window.changeToNextPlayer = changeToNextPlayer;

function updatePlayerProfile(playerName, currentScore, throws) {
    if (!playerName || playerName === 'Jugador Anónimo') return;
    
    // Obtener perfil actual del localStorage
    let playerProfile = JSON.parse(localStorage.getItem('cyber-sapo-player-profile')) || {
        name: playerName,
        totalGames: 0,
        totalScore: 0,
        maxScore: 0,
        totalThrows: 0,
        achievements: [],
        lastUpdated: Date.now()
    };
    
    // Actualizar estadísticas
    if (currentScore > playerProfile.maxScore) {
        playerProfile.maxScore = currentScore;
    }
    
    playerProfile.totalScore += points || 0;
    playerProfile.totalThrows = throws;
    playerProfile.lastUpdated = Date.now();
    
    // Verificar logros
    checkAchievements(playerProfile, currentScore);
    
    // Guardar perfil actualizado
    localStorage.setItem('cyber-sapo-player-profile', JSON.stringify(playerProfile));
    
    console.log(`📊 Perfil actualizado para ${playerName}: ${currentScore} puntos`);
}

function checkAchievements(profile, currentScore) {
    const achievements = [
        { id: 'first_100', name: 'Primer Centenar', description: 'Alcanza 100 puntos', threshold: 100 },
        { id: 'precision_master', name: 'Maestro de Precisión', description: 'Alcanza 500 puntos', threshold: 500 },
        { id: 'sapo_legend', name: 'Leyenda del Sapo', description: 'Alcanza 1000 puntos', threshold: 1000 },
        { id: 'golden_frog', name: 'Rana Dorada', description: 'Alcanza 2000 puntos', threshold: 2000 }
    ];
    
    achievements.forEach(achievement => {
        if (currentScore >= achievement.threshold && !profile.achievements.includes(achievement.id)) {
            profile.achievements.push(achievement.id);
            showAchievementNotification(achievement);
        }
    });
}

function showAchievementNotification(achievement) {
    console.log(`🏆 ¡Logro desbloqueado: ${achievement.name}!`);
    
    // Crear notificación visual
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ffd700, #ffed4e);
        color: #000;
        padding: 15px 20px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
        animation: slideIn 0.5s ease-out;
    `;
    notification.innerHTML = `🏆 ${achievement.name}<br><small>${achievement.description}</small>`;
    
    // Añadir animación CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { width: 0%; }
            to { width: 100%; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function nextPlayer() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // Si es un equipo/pareja, manejar cambio de miembro o equipo
    if (currentPlayer.isTeam) {
        const throwsUsed = gameState.maxThrows - currentPlayer.throwsRemaining;
        const currentMemberThrows = throwsUsed - (currentPlayer.currentMember * 6);
        
        // Si el miembro actual ha completado sus 6 tiros o se fuerza el cambio
        if (currentMemberThrows >= 6 || currentPlayer.throwsRemaining <= 0) {
            currentPlayer.currentMember++;
            
            // Si ya no hay más miembros en el equipo, pasar al siguiente equipo
            if (currentPlayer.currentMember >= currentPlayer.teamMembers.length || currentPlayer.throwsRemaining <= 0) {
                currentPlayer.currentMember = 0;
                gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
            }
        }
    } else {
        // Juego individual - pasar al siguiente jugador
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    }
    
    // Si volvimos al primer jugador, reiniciar los tiros de todos
    if (gameState.currentPlayerIndex === 0) {
        gameState.players.forEach(player => {
            const currentGameType = gameTypes[configState.gameType];
            player.throwsRemaining = currentGameType.maxThrows;
            if (player.isTeam) {
                player.currentMember = 0;
            }
        });
    }
    
    // Si el jugador actual no tiene tiros, darle tiros nuevos
    const newCurrentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (newCurrentPlayer.throwsRemaining <= 0) {
        const currentGameType = gameTypes[configState.gameType];
        newCurrentPlayer.throwsRemaining = currentGameType.maxThrows;
        if (newCurrentPlayer.isTeam) {
            newCurrentPlayer.currentMember = 0;
        }
    }
    
    updateGameInterface();
}

// Función para enviar datos de partida al backend
async function sendGameDataToBackend(gameData) {
    try {
        const response = await fetch(`${MACHINE_CONFIG.backend_url}/api/games`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gameData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Partida registrada en backend:', result.gameId);
            return result;
        } else {
            console.error('❌ Error registrando partida:', result.error);
            return null;
        }
    } catch (error) {
        console.log('❌ Error verificando backend:', error);
        return false;
    }
}

// Funciones para integración móvil
function simulateMobileConnection() {
    gameState.mobileConnected = true;
    
    // Obtener nombre del jugador desde localStorage
    const playerName = localStorage.getItem('cyber-sapo-current-player') || 'Jugador Móvil';
    gameState.currentPlayerName = playerName;
    
    const mobileStatus = document.getElementById('mobile-connection-status');
    const qrDisplay = document.getElementById('qr-display');
    const mobileControls = document.getElementById('mobile-controls');
    
    if (mobileStatus) {
        mobileStatus.className = 'mobile-connection-status connected';
        mobileStatus.innerHTML = `<span>🟢</span><span>${playerName} conectado</span>`;
    }
    
    if (qrDisplay) {
        qrDisplay.style.display = 'none';
    }
    
    if (mobileControls) {
        mobileControls.style.display = 'block';
    }
    
    // Actualizar nombre en el HUD del juego
    updatePlayerNameInGame(playerName);
    
    console.log(`📱 ${playerName} conectado exitosamente`);
    setupMobileControls();
}

function setupMobileControls() {
    const mobileStartBtn = document.getElementById('mobile-start-btn');
    const mobilePauseBtn = document.getElementById('mobile-pause-btn');
    const mobileEndBtn = document.getElementById('mobile-end-btn');
    
    if (mobileStartBtn) {
        mobileStartBtn.addEventListener('click', startGameFromMobile);
    }
    
    if (mobilePauseBtn) {
        mobilePauseBtn.addEventListener('click', pauseGameFromMobile);
    }
    
    if (mobileEndBtn) {
        mobileEndBtn.addEventListener('click', endGameFromMobile);
    }
}

function startGameFromMobile() {
    gameState.mobileControlled = true;
    
    // Configurar juego para control móvil
    configState.gameType = 0; // Individual
    configState.numPlayers = 1;
    configState.maxPoints = 1000;
    configState.creditsInserted = 2; // Simular créditos insertados
    
    // Crear jugador con nombre personalizado
    const playerName = gameState.currentPlayerName || 'Jugador Móvil';
    
    // Cambiar a pantalla de juego INMEDIATAMENTE
    switchToScreen('game-screen');
    
    // Configurar jugadores
    gameState.players = [{
        name: playerName,
        score: 0,
        throws: 0,
        isActive: true
    }];
    gameState.currentPlayerIndex = 0;
    gameState.gameStarted = true;
    gameState.gameStartTime = new Date();
    
    // Actualizar interfaz del juego INMEDIATAMENTE
    setTimeout(() => {
        updateGameDisplay();
        updatePlayerNameInGame(playerName);
        updateCurrentPlayerDisplay();
        setupGameKeyboardListeners();
    }, 100);
    
    // Actualizar controles móviles
    updateMobileControls();
    
    console.log(`🚀 Juego iniciado desde móvil por ${playerName}`);
}

function pauseGameFromMobile() {
    if (gameState.gameStarted) {
        gameState.gameStarted = false;
        const mobilePauseBtn = document.getElementById('mobile-pause-btn');
        if (mobilePauseBtn) {
            mobilePauseBtn.textContent = '▶️ Reanudar';
            mobilePauseBtn.onclick = resumeGameFromMobile;
        }
        console.log('⏸️ Juego pausado desde móvil');
    }
}

function resumeGameFromMobile() {
    if (!gameState.gameStarted) {
        gameState.gameStarted = true;
        const mobilePauseBtn = document.getElementById('mobile-pause-btn');
        if (mobilePauseBtn) {
            mobilePauseBtn.textContent = '⏸️ Pausar';
            mobilePauseBtn.onclick = pauseGameFromMobile;
        }
        console.log('▶️ Juego reanudado desde móvil');
    }
}

function endGameFromMobile() {
    if (gameState.gameStarted) {
        endGame();
        updateMobileControls();
        console.log('🏁 Juego terminado desde móvil');
    }
}

function updateMobileControls() {
    const mobileStartBtn = document.getElementById('mobile-start-btn');
    const mobilePauseBtn = document.getElementById('mobile-pause-btn');
    const mobileEndBtn = document.getElementById('mobile-end-btn');
    const mobileScoreDisplay = document.getElementById('mobile-score-display');
    const mobileThrowsDisplay = document.getElementById('mobile-throws-display');
    
    if (gameState.gameStarted) {
        if (mobileStartBtn) mobileStartBtn.disabled = true;
        if (mobilePauseBtn) mobilePauseBtn.disabled = false;
        if (mobileEndBtn) mobileEndBtn.disabled = false;
    } else {
        if (mobileStartBtn) mobileStartBtn.disabled = false;
        if (mobilePauseBtn) mobilePauseBtn.disabled = true;
        if (mobileEndBtn) mobileEndBtn.disabled = true;
    }
    
    // Actualizar estadísticas
    if (gameState.players.length > 0) {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        if (mobileScoreDisplay) {
            mobileScoreDisplay.textContent = currentPlayer.score || 0;
        }
        if (mobileThrowsDisplay) {
            mobileThrowsDisplay.textContent = (gameState.maxThrows - (currentPlayer.throws || 0));
        }
    }
}

// Función para actualizar nombre del jugador en el juego
function updatePlayerNameInGame(playerName) {
    const currentPlayerNameElement = document.getElementById('current-player-name');
    if (currentPlayerNameElement) {
        currentPlayerNameElement.textContent = playerName;
    }
    
    // También actualizar en el estado del juego si existe
    if (gameState.players.length > 0) {
        gameState.players[gameState.currentPlayerIndex].name = playerName;
    }
    
    // Actualizar display de jugadores si existe
    updatePlayersDisplay();
}

// Función para actualizar display de jugadores
function updatePlayersDisplay() {
    const playersListElement = document.getElementById('players-list');
    if (playersListElement && gameState.players.length > 0) {
        playersListElement.innerHTML = gameState.players.map((player, index) => `
            <div class="player-item ${index === gameState.currentPlayerIndex ? 'active' : ''}">
                <div class="player-name">${player.name}</div>
                <div class="player-score">${player.score || 0} pts</div>
                <div class="player-throws">${player.throws || 0} tiros</div>
            </div>
        `).join('');
    }
}

// Función para actualizar display general del juego
function updateGameDisplay() {
    if (gameState.players.length > 0) {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        
        // Actualizar nombre del jugador actual
        const currentPlayerNameElement = document.getElementById('current-player-name');
        if (currentPlayerNameElement) {
            currentPlayerNameElement.textContent = currentPlayer.name;
        }
        
        // Actualizar puntuación actual
        const currentScoreElement = document.getElementById('current-score');
        if (currentScoreElement) {
            currentScoreElement.textContent = currentPlayer.score || 0;
        }
        
        // Actualizar tiros
        const currentTurnElement = document.getElementById('current-turn');
        if (currentTurnElement) {
            const throwsUsed = gameState.maxThrows - currentPlayer.throwsRemaining;
            const throwsLeft = gameState.maxThrows - throwsUsed;
            currentTurnElement.textContent = `${throwsUsed + 1}/${gameState.maxThrows}`;
        }
        
        // Actualizar lista de jugadores
        updatePlayersDisplay();
        
        // Sincronizar con móvil
        syncScoreWithMobile(currentPlayer.score || 0, gameState.maxThrows - (currentPlayer.throws || 0));
    }
}

// Función para sincronizar puntuación con móvil
function syncScoreWithMobile(score, throwsLeft) {
    const mobileScoreDisplay = document.getElementById('mobile-score-display');
    const mobileThrowsDisplay = document.getElementById('mobile-throws-display');
    
    if (mobileScoreDisplay) {
        mobileScoreDisplay.textContent = score;
    }
    
    if (mobileThrowsDisplay) {
        mobileThrowsDisplay.textContent = throwsLeft;
    }
}

// Variables para control de salida
let tabPressed = false;
let spacePressed = false;
let exitTimer = null;

// Escuchar mensajes de la app móvil
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'player_connected') {
        const playerName = event.data.playerName;
        gameState.currentPlayerName = playerName;
        updatePlayerNameInGame(playerName);
        
        // Actualizar estado de conexión
        const mobileStatus = document.getElementById('mobile-connection-status');
        if (mobileStatus) {
            mobileStatus.innerHTML = `<span>🟢</span><span>${playerName} conectado</span>`;
        }
        
        console.log(`📱 Jugador ${playerName} conectado vía mensaje`);
    }
});

// Sistema de salida con Tab + Espacio por 5 segundos (solo durante el juego)
// REMOVIDO - Causaba conflictos con la funcionalidad principal

function showExitIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'exit-indicator';
    indicator.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 107, 107, 0.9);
        color: white;
        padding: 20px 40px;
        border-radius: 15px;
        font-size: 1.2em;
        font-weight: bold;
        z-index: 10000;
        text-align: center;
        border: 2px solid #ff6b6b;
        box-shadow: 0 0 30px rgba(255, 107, 107, 0.5);
    `;
    indicator.innerHTML = `
        🚪 Saliendo del juego...<br>
        <small>Mantén Tab + Espacio presionados</small><br>
        <div style="margin-top: 10px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px;">
            <div style="height: 100%; background: white; border-radius: 2px; animation: exitProgress 5s linear;"></div>
        </div>
    `;
    
    // Añadir animación CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes exitProgress {
            from { width: 0%; }
            to { width: 100%; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(indicator);
}

function hideExitIndicator() {
    const indicator = document.getElementById('exit-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// Función para calcular estadísticas de la partida
function calculateGameStats(winner) {
    const gameEndTime = new Date();
    const gameDuration = Math.round((gameEndTime - gameState.gameStartTime) / 1000); // duración en segundos
    
    // Calcular tipo de juego
    const currentGameType = gameTypes[configState.gameType];
    const gameTypeString = `${currentGameType.name} - ${configState.numPlayers} ${currentGameType.label}`;
    
    // Calcular ingresos (créditos usados * precio por crédito, ej: €0.50 por crédito)
    const creditsUsed = calculateCreditsRequired();
    const pricePerCredit = 0.50; // €0.50 por crédito
    const revenue = creditsUsed * pricePerCredit;
    
    return {
        machine_id: MACHINE_CONFIG.machine_id,
        location_id: MACHINE_CONFIG.location_id,
        game_type: gameTypeString,
        players: configState.numPlayers,
        duration: gameDuration,
        revenue: revenue,
        created_at: gameEndTime.toISOString(),
        // Datos adicionales para logging
        winner_name: winner.name,
        winner_score: winner.score,
        max_points: gameState.maxPoints,
        total_throws: winner.throws.length
    };
}

function showWinner(winner) {
    // Calcular y enviar estadísticas al backend
    const gameStats = calculateGameStats(winner);
    
    // Enviar datos al backend de forma asíncrona
    sendGameDataToBackend(gameStats).then(result => {
        if (result) {
            console.log(`🎮 Partida completada y registrada:`);
            console.log(`   - Ganador: ${winner.name}`);
            console.log(`   - Puntuación: ${winner.score} puntos`);
            console.log(`   - Duración: ${gameStats.duration} segundos`);
            console.log(`   - Ingresos: €${gameStats.revenue}`);
            console.log(`   - ID Backend: ${result.gameId}`);
        }
    });
    
    // Mostrar modal de ganador
    document.getElementById('winner-name').textContent = winner.name;
    document.getElementById('winner-score').textContent = `${winner.score} puntos en ${winner.throws.length} tiros`;
    document.getElementById('winner-modal').classList.add('active');
}

function handleKeyPress(event) {
    console.log(`🎹 Tecla presionada: "${event.key}", startScreen: ${startScreenState.inStartScreen}, setupMode: ${configState.inSetupMode}`);
    
    if (startScreenState.inStartScreen) {
        handleStartScreenKeyPress(event);
        return;
    }
    if (configState.inSetupMode) {
        handleSetupKeyPress(event);
        return;
    }
    if (!gameState.gameStarted) return;
    
    const key = event.key.toLowerCase();
    
    // Tecla ENTER para cambiar de jugador (mantener compatibilidad)
    if (event.key === 'Enter') {
        event.preventDefault();
        changeToNextPlayer();
        return;
    }
    
    // Tecla ESPACIO para cambiar de jugador/equipo directamente
    if (event.key === ' ') {
        event.preventDefault();
        changeToNextPlayer();
        return;
    }
    
    if (keyToHole.hasOwnProperty(key)) {
        event.preventDefault();
        addScore(keyToHole[key]);
        
        // Efecto visual
        const hole = document.querySelector(`[data-key="${key}"]`);
        if (hole && !hole.classList.contains('disabled')) {
            hole.style.transform = 'scale(0.9)';
            setTimeout(() => {
                hole.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    hole.style.transform = 'scale(1)';
                }, 100);
            }, 100);
        }
    }
}

function changeToNextPlayer() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // Reiniciar tiros del jugador actual para el siguiente turno
    if (currentPlayer) {
        if (currentPlayer.isTeam) {
            const currentMember = currentPlayer.teamMembers[currentPlayer.currentMember];
            if (currentMember) {
                currentMember.throwsRemaining = gameState.maxThrows;
                currentMember.throws = []; // Limpiar tiros del turno anterior
            }
        } else {
            currentPlayer.throwsRemaining = gameState.maxThrows;
            currentPlayer.throws = []; // Limpiar tiros del turno anterior
        }
    }
    
    // Si es un equipo/pareja, cambiar al siguiente miembro o equipo
    if (currentPlayer.isTeam) {
        currentPlayer.currentMember++;
        
        // Si ya no hay más miembros, pasar al siguiente equipo
        if (currentPlayer.currentMember >= currentPlayer.teamMembers.length) {
            currentPlayer.currentMember = 0;
            gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
        }
    } else {
        // Juego individual - pasar al siguiente jugador
        gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    }
    
    // Reiniciar tiros del nuevo jugador
    const nextPlayer = gameState.players[gameState.currentPlayerIndex];
    if (nextPlayer) {
        if (nextPlayer.isTeam) {
            const nextMember = nextPlayer.teamMembers[nextPlayer.currentMember];
            if (nextMember) {
                nextMember.throwsRemaining = gameState.maxThrows;
                nextMember.throws = [];
            }
        } else {
            nextPlayer.throwsRemaining = gameState.maxThrows;
            nextPlayer.throws = [];
        }
    }
    
    updateGameInterface();
}

function showSetupScreen() {
    document.getElementById('winner-modal').classList.remove('active');
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('setup-screen').classList.add('active');
    
    // Resetear estados
    gameState = {
        players: [],
        currentPlayerIndex: 0,
        maxPoints: 1000,
        gameStarted: false,
        maxThrows: 6
    };
    
    configState = {
        gameType: 0,
        numPlayers: 2,
        maxPoints: 1000,
        creditsInserted: configState.creditsInserted, // Mantener créditos sobrantes
        currentSelector: 0,
        inSetupMode: true
    };
    
    startScreenState = {
        inStartScreen: false
    };
    
    document.querySelectorAll('.hole').forEach(hole => {
        hole.classList.remove('disabled');
    });
    
    // Actualizar display de configuración
    updateConfigDisplay();
}
