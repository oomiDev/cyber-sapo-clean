/**
 * CYBER SAPO - Game UI Controller
 * Handles all UI updates and interactions
 */

export class GameUI {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.elements = {};
        this.initializeElements();
    }
    
    initializeElements() {
        // Game screen elements
        this.elements = {
            // Screens
            startScreen: document.getElementById('start-screen'),
            setupScreen: document.getElementById('setup-screen'),
            gameScreen: document.getElementById('game-screen'),
            
            // Setup elements
            gameTypeValue: document.getElementById('game-type-value'),
            playersValue: document.getElementById('players-value'),
            playersUnit: document.getElementById('players-unit'),
            pointsValue: document.getElementById('points-value'),
            creditsRequiredValue: document.getElementById('credits-required-value'),
            creditsInsertedValue: document.getElementById('credits-inserted-value'),
            startButtonText: document.getElementById('start-button-text'),
            
            // Game elements
            currentPlayerName: document.getElementById('current-player-name'),
            currentThrow: document.getElementById('current-throw'),
            currentScore: document.getElementById('current-score'),
            goalPoints: document.getElementById('goal-points'),
            playersList: document.getElementById('players-list'),
            throwsDisplay: document.getElementById('throws-display'),
            
            // Selectors
            gameTypeSelector: document.getElementById('game-type-selector'),
            playersSelector: document.getElementById('players-selector'),
            pointsSelector: document.getElementById('points-selector'),
            creditsSelector: document.getElementById('credits-selector'),
            startSelector: document.getElementById('start-selector')
        };
    }
    
    // Screen Management
    showStartScreen() {
        this.hideAllScreens();
        if (this.elements.startScreen) {
            this.elements.startScreen.classList.add('active');
        }
    }
    
    showSetupScreen() {
        this.hideAllScreens();
        if (this.elements.setupScreen) {
            this.elements.setupScreen.classList.add('active');
        }
        this.updateConfigDisplay();
    }
    
    showGameScreen() {
        this.hideAllScreens();
        if (this.elements.gameScreen) {
            this.elements.gameScreen.classList.add('active');
        }
        this.updateGameDisplay();
    }
    
    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }
    
    // Configuration Display Updates
    updateConfigDisplay() {
        const configState = this.gameEngine.getConfigState();
        const gameTypes = this.gameEngine.getGameTypes();
        const currentGameType = gameTypes[configState.gameType];
        
        // Update values
        if (this.elements.gameTypeValue) {
            this.elements.gameTypeValue.textContent = currentGameType.name;
        }
        if (this.elements.playersValue) {
            this.elements.playersValue.textContent = configState.numPlayers;
        }
        if (this.elements.playersUnit) {
            this.elements.playersUnit.textContent = currentGameType.label;
        }
        if (this.elements.pointsValue) {
            this.elements.pointsValue.textContent = configState.maxPoints;
        }
        
        // Update credits
        const creditsRequired = this.gameEngine.calculateCreditsRequired();
        if (this.elements.creditsRequiredValue) {
            this.elements.creditsRequiredValue.textContent = creditsRequired;
        }
        if (this.elements.creditsInsertedValue) {
            this.elements.creditsInsertedValue.textContent = configState.creditsInserted;
        }
        
        // Update start button
        this.updateStartButton();
        
        // Update selector highlights
        this.updateSelectorHighlights(configState.currentSelector);
    }
    
    updateStartButton() {
        const configState = this.gameEngine.getConfigState();
        const creditsRequired = this.gameEngine.calculateCreditsRequired();
        
        if (this.elements.startButtonText) {
            if (this.gameEngine.canStartGame()) {
                this.elements.startButtonText.textContent = '🚀 INICIAR PARTIDA';
                this.elements.startButtonText.style.color = '#00ff00';
            } else {
                const missing = creditsRequired - configState.creditsInserted;
                this.elements.startButtonText.textContent = `❌ FALTAN ${missing} CRÉDITOS`;
                this.elements.startButtonText.style.color = '#ff00ff';
            }
        }
    }
    
    updateSelectorHighlights(currentSelector) {
        const selectors = [
            this.elements.gameTypeSelector,
            this.elements.playersSelector,
            this.elements.pointsSelector,
            this.elements.creditsSelector,
            this.elements.startSelector
        ];
        
        // Remove active class from all
        selectors.forEach(selector => {
            if (selector) selector.classList.remove('active');
        });
        
        // Add active class to current
        if (selectors[currentSelector]) {
            selectors[currentSelector].classList.add('active');
        }
    }
    
    // Game Display Updates
    updateGameDisplay() {
        this.updatePlayersList();
        this.updateCurrentPlayerInfo();
        this.updateGoalDisplay();
        this.updateThrowsDisplay();
    }
    
    updateCurrentPlayerInfo() {
        const currentPlayer = this.gameEngine.getCurrentPlayer();
        if (!currentPlayer) return;
        
        let playerToShow = currentPlayer;
        if (currentPlayer.isTeam) {
            playerToShow = currentPlayer.teamMembers[currentPlayer.currentMember];
        }
        
        // Update name
        if (this.elements.currentPlayerName) {
            this.elements.currentPlayerName.textContent = playerToShow.name || currentPlayer.name;
        }
        
        // Update throw counter
        if (this.elements.currentThrow) {
            const throwsUsed = playerToShow.throws ? playerToShow.throws.length : 0;
            const maxThrows = this.gameEngine.getGameState().maxThrows;
            const currentThrowNumber = throwsUsed >= maxThrows ? maxThrows : throwsUsed + 1;
            this.elements.currentThrow.textContent = `${currentThrowNumber}/${maxThrows}`;
        }
        
        // Update score
        if (this.elements.currentScore) {
            this.elements.currentScore.textContent = playerToShow.score || 0;
        }
    }
    
    updateGoalDisplay() {
        const gameState = this.gameEngine.getGameState();
        if (this.elements.goalPoints) {
            this.elements.goalPoints.textContent = `${gameState.maxPoints} PUNTOS`;
        }
    }
    
    updatePlayersList() {
        if (!this.elements.playersList) return;
        
        const gameState = this.gameEngine.getGameState();
        const container = this.elements.playersList;
        container.innerHTML = '';
        
        // Calculate visible players
        const maxVisiblePlayers = this.calculateMaxVisiblePlayers();
        const playersToShow = this.getPlayersToShow(maxVisiblePlayers, gameState);
        
        playersToShow.forEach(({ player, index, isPlaceholder }) => {
            const playerCard = this.createPlayerCard(player, index, isPlaceholder, gameState);
            container.appendChild(playerCard);
        });
    }
    
    createPlayerCard(player, index, isPlaceholder, gameState) {
        const playerCard = document.createElement('div');
        
        if (isPlaceholder) {
            playerCard.className = 'player-card placeholder';
            playerCard.innerHTML = `
                <div class="player-name">... y ${gameState.players.length - this.calculateMaxVisiblePlayers() + 1} más</div>
                <div class="player-score">Ver todos</div>
            `;
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
            
            // Create throws visualization
            const throwsHTML = this.createThrowsVisualization(playerThrows);
            
            playerCard.innerHTML = `
                <div class="player-name">${displayName}</div>
                <div class="player-score">${displayScore} pts</div>
                <div class="player-throws">${displayThrows} tiros</div>
                <div class="player-throws-display">${throwsHTML}</div>
            `;
        }
        
        return playerCard;
    }
    
    createThrowsVisualization(throws) {
        return throws.map(points => {
            let throwClass = '';
            if (points === 100) throwClass = 'rana';
            else if (points === 50) throwClass = 'ranita';
            else if (points >= 40) throwClass = 'high';
            else if (points >= 20) throwClass = 'medium';
            else if (points >= 10) throwClass = 'low';
            else throwClass = 'minimal';
            
            return `<div class="throw-result-small ${throwClass}">${points}</div>`;
        }).join('');
    }
    
    updateThrowsDisplay() {
        if (!this.elements.throwsDisplay) return;
        
        const currentPlayer = this.gameEngine.getCurrentPlayer();
        if (!currentPlayer) return;
        
        let playerToShow = currentPlayer;
        if (currentPlayer.isTeam) {
            playerToShow = currentPlayer.teamMembers[currentPlayer.currentMember];
        }
        
        const container = this.elements.throwsDisplay;
        container.innerHTML = '';
        
        // Show completed throws
        if (playerToShow.throws) {
            playerToShow.throws.forEach(points => {
                const throwElement = document.createElement('div');
                throwElement.className = 'throw-result';
                throwElement.textContent = points;
                
                // Add styling based on score
                if (points === 100) throwElement.classList.add('rana');
                else if (points === 50) throwElement.classList.add('ranita');
                else if (points >= 40) throwElement.classList.add('high');
                else if (points >= 20) throwElement.classList.add('medium');
                else if (points >= 10) throwElement.classList.add('low');
                else throwElement.classList.add('minimal');
                
                container.appendChild(throwElement);
            });
        }
        
        // Show empty slots for remaining throws
        const throwsUsed = playerToShow.throws ? playerToShow.throws.length : 0;
        const maxThrows = this.gameEngine.getGameState().maxThrows;
        
        for (let i = throwsUsed; i < maxThrows; i++) {
            const emptyThrow = document.createElement('div');
            emptyThrow.className = 'throw-empty';
            container.appendChild(emptyThrow);
        }
    }
    
    calculateMaxVisiblePlayers() {
        const viewportHeight = window.innerHeight;
        const headerHeight = 100;
        const playerCardHeight = 120;
        const availableHeight = viewportHeight - headerHeight - 50;
        const maxPlayers = Math.floor(availableHeight / playerCardHeight);
        return Math.max(2, maxPlayers);
    }
    
    getPlayersToShow(maxVisible, gameState) {
        const totalPlayers = gameState.players.length;
        
        if (totalPlayers <= maxVisible) {
            return gameState.players.map((player, index) => ({ player, index, isPlaceholder: false }));
        }
        
        const currentIndex = gameState.currentPlayerIndex;
        const playersToShow = [];
        
        // Always include current player
        playersToShow.push({ 
            player: gameState.players[currentIndex], 
            index: currentIndex, 
            isPlaceholder: false 
        });
        
        const remainingSlots = maxVisible - 2;
        const playersAdded = new Set([currentIndex]);
        let slotsUsed = 0;
        
        // Add nearby players
        for (let offset = 1; offset <= totalPlayers && slotsUsed < remainingSlots; offset++) {
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
        
        // Add placeholder if needed
        if (playersAdded.size < totalPlayers) {
            playersToShow.push({ player: null, index: -1, isPlaceholder: true });
        }
        
        return playersToShow.filter(p => !p.isPlaceholder).sort((a, b) => a.index - b.index)
            .concat(playersToShow.filter(p => p.isPlaceholder));
    }
    
    // Feedback Methods
    showScoreAnimation(points) {
        // Create floating score animation
        const scoreElement = document.createElement('div');
        scoreElement.className = 'score-animation';
        scoreElement.textContent = `+${points}`;
        
        if (points === 100) scoreElement.classList.add('rana');
        else if (points === 50) scoreElement.classList.add('ranita');
        else if (points >= 40) scoreElement.classList.add('high');
        
        document.body.appendChild(scoreElement);
        
        setTimeout(() => {
            scoreElement.remove();
        }, 2000);
    }
    
    showGameEndModal(winner) {
        const modal = document.createElement('div');
        modal.className = 'game-end-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>🏆 ¡JUEGO TERMINADO!</h2>
                <p>Ganador: <strong>${winner.name}</strong></p>
                <p>Puntuación: <strong>${winner.score}</strong></p>
                <button onclick="location.reload()">🔄 Nueva Partida</button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}
