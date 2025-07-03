import { Game } from './Game.js';
import { InputController } from './InputController.js';
import { UIManager } from './UIManager.js';

let game;
let inputController;
let uiManager;

async function init() {
    try {
        // Initialize UI Manager
        uiManager = new UIManager();
        
        // Initialize Game
        game = new Game(document.getElementById('game-canvas'));
        await game.init();
        
        // Initialize Input Controller
        inputController = new InputController(game);
        
        // Connect UI to game (after a small delay to ensure initialization)
        setTimeout(() => {
            uiManager.connectToGame(game);
        }, 100);
        
        // Hide loading screen
        document.getElementById('loading-screen').classList.add('hidden');
        
        // Start game loop
        animate();
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
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