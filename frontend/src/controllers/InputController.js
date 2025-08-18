/**
 * CYBER SAPO - Input Controller
 * Handles keyboard and UI input events
 */

export class InputController {
    constructor(gameEngine, gameUI) {
        this.gameEngine = gameEngine;
        this.gameUI = gameUI;
        this.keyToHole = {
            'q': 5, 'w': 8, 'e': 12, 'r': 15,
            'a': 3, 's': 10, 'd': 100, 'f': 20,
            'z': 7, 'x': 18, 'c': 50, 'v': 25,
            't': 30, 'g': 40
        };
        this.currentScreen = 'start';
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Global keyboard handler
        document.addEventListener('keydown', (e) => this.handleGlobalKeyPress(e), true);
        
        // Button event listeners
        this.setupButtonListeners();
        
        // Focus management
        this.setupFocusManagement();
    }
    
    handleGlobalKeyPress(event) {
        console.log(`🔥 Key pressed: "${event.key}", Screen: ${this.currentScreen}`);
        
        // Prevent default Tab behavior in setup mode
        if (event.key === 'Tab' && (this.currentScreen === 'setup' || this.currentScreen === 'start')) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
        
        // Route to appropriate handler based on current screen
        switch (this.currentScreen) {
            case 'start':
                this.handleStartScreenInput(event);
                break;
            case 'setup':
                this.handleSetupScreenInput(event);
                break;
            case 'game':
                this.handleGameScreenInput(event);
                break;
        }
    }
    
    handleStartScreenInput(event) {
        if (event.key === ' ') {
            console.log('✅ Space pressed - going to setup');
            event.preventDefault();
            event.stopPropagation();
            this.goToSetupScreen();
        }
    }
    
    handleSetupScreenInput(event) {
        const configState = this.gameEngine.getConfigState();
        
        if (event.key === 'Tab') {
            // Change selector
            this.gameEngine.configState.currentSelector = (configState.currentSelector + 1) % 5;
            this.gameUI.updateConfigDisplay();
        } else if (event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            
            switch (configState.currentSelector) {
                case 0: // Game type
                    this.gameEngine.updateGameType();
                    break;
                case 1: // Players
                    this.gameEngine.updatePlayerCount();
                    break;
                case 2: // Points
                    this.gameEngine.updateMaxPoints();
                    break;
                case 3: // Credits (use M key)
                    console.log('💰 Use M key to add credits');
                    break;
                case 4: // Start game
                    this.attemptStartGame();
                    break;
            }
            this.gameUI.updateConfigDisplay();
        } else if (event.key.toLowerCase() === 'm') {
            // Add credit
            event.preventDefault();
            event.stopPropagation();
            this.gameEngine.addCredit();
            this.gameUI.updateConfigDisplay();
        }
    }
    
    handleGameScreenInput(event) {
        const key = event.key.toLowerCase();
        
        // Score input
        if (this.keyToHole.hasOwnProperty(key)) {
            console.log(`🎯 Score: ${key} = ${this.keyToHole[key]} points`);
            event.preventDefault();
            event.stopImmediatePropagation();
            
            const result = this.gameEngine.addScore(this.keyToHole[key]);
            if (result.success) {
                this.gameUI.showScoreAnimation(this.keyToHole[key]);
                this.gameUI.updateGameDisplay();
                
                if (result.gameEnded) {
                    this.gameUI.showGameEndModal(result.winner);
                }
            }
        }
        // Change player
        else if (event.key === 'Enter' || event.key === ' ') {
            console.log('👥 Change player');
            event.preventDefault();
            event.stopImmediatePropagation();
            
            const result = this.gameEngine.changeToNextPlayer();
            if (result.success) {
                this.gameUI.updateGameDisplay();
            }
        }
    }
    
    setupButtonListeners() {
        // New game button
        const newGameBtn = document.getElementById('new-game');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => this.goToSetupScreen());
        }
        
        // Play again button
        const playAgainBtn = document.getElementById('play-again');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => this.goToSetupScreen());
        }
        
        // Hole buttons
        document.querySelectorAll('.hole').forEach(hole => {
            hole.addEventListener('click', () => {
                if (!hole.classList.contains('disabled')) {
                    const score = parseInt(hole.dataset.value);
                    const result = this.gameEngine.addScore(score);
                    if (result.success) {
                        this.gameUI.showScoreAnimation(score);
                        this.gameUI.updateGameDisplay();
                        
                        if (result.gameEnded) {
                            this.gameUI.showGameEndModal(result.winner);
                        }
                    }
                }
            });
        });
    }
    
    setupFocusManagement() {
        // Aggressive focus management
        setTimeout(() => {
            document.body.focus();
            document.body.setAttribute('tabindex', '0');
            
            // Remove tabindex from other elements
            document.querySelectorAll('button, input, select, textarea, a').forEach(el => {
                el.setAttribute('tabindex', '-1');
            });
            
            console.log('🎯 Focus management configured');
        }, 200);
    }
    
    // Screen Navigation
    goToSetupScreen() {
        console.log('🎮 Navigating to setup screen');
        
        this.currentScreen = 'setup';
        this.gameEngine.configState.inSetupMode = true;
        this.gameEngine.configState.currentSelector = 0;
        
        this.gameUI.showSetupScreen();
        this.setupFocusManagement();
    }
    
    goToGameScreen() {
        console.log('🎯 Navigating to game screen');
        
        this.currentScreen = 'game';
        this.gameUI.showGameScreen();
        this.setupFocusManagement();
    }
    
    goToStartScreen() {
        console.log('🏠 Returning to start screen');
        
        this.currentScreen = 'start';
        this.gameEngine.configState.inSetupMode = false;
        
        this.gameUI.showStartScreen();
        this.setupFocusManagement();
    }
    
    attemptStartGame() {
        console.log('🚀 Attempting to start game...');
        
        if (this.gameEngine.canStartGame()) {
            const result = this.gameEngine.startGame();
            if (result.success) {
                console.log('✅ Game started successfully!');
                this.goToGameScreen();
            } else {
                console.log('❌ Failed to start game:', result.error);
                alert('Error al iniciar el juego: ' + result.error);
            }
        } else {
            console.log('❌ Cannot start - insufficient credits');
            alert('¡Créditos insuficientes! Presiona M para agregar créditos.');
        }
    }
    
    // Utility methods
    setCurrentScreen(screen) {
        this.currentScreen = screen;
    }
    
    getCurrentScreen() {
        return this.currentScreen;
    }
}
