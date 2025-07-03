import { Game } from './Game.js';
import { InputController } from './InputController.js';
import { UIManager } from './UIManager.js';
import { DebugLogger } from './DebugLogger.js';

let game;
let inputController;
let uiManager;
let debugLogger;

async function init() {
    try {
        // Initialize Debug Logger first
        debugLogger = new DebugLogger();
        debugLogger.logEvent('GAME_INIT_START', { timestamp: Date.now() });
        
        // Make debugLogger globally available
        window.debugLogger = debugLogger;
        
        // Initialize UI Manager
        uiManager = new UIManager();
        debugLogger.logEvent('UI_MANAGER_CREATED');
        
        // Initialize Game
        game = new Game(document.getElementById('game-canvas'));
        await game.init();
        debugLogger.logEvent('GAME_CREATED');
        
        // Make game globally available for debugging
        window.game = game;
        
        // Initialize Input Controller
        inputController = new InputController(game, debugLogger);
        debugLogger.logEvent('INPUT_CONTROLLER_CREATED');
        
        // Connect UI to game (after a small delay to ensure initialization)
        setTimeout(() => {
            uiManager.connectToGame(game);
            debugLogger.logEvent('UI_CONNECTED_TO_GAME');
        }, 100);
        
        // Hide loading screen
        document.getElementById('loading-screen').classList.add('hidden');
        debugLogger.logEvent('LOADING_SCREEN_HIDDEN');
        
        // Start game loop
        animate();
        debugLogger.logEvent('GAME_LOOP_STARTED');
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        if (debugLogger) {
            debugLogger.logEvent('GAME_INIT_ERROR', { error: error.message, stack: error.stack });
        }
        document.querySelector('#loading-screen p').textContent = 'Fehler beim Laden. Bitte Seite neu laden.';
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    if (game && inputController) {
        inputController.update();
        game.update();
        game.render();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}