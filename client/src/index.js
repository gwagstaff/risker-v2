import { NetworkManager } from './network/NetworkManager';
import { Game } from './game/Game';
import { Renderer } from './rendering/Renderer';
import { UI } from './ui/UI';

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the game
  const game = new Game();
  
  // Initialize networking
  const networkManager = new NetworkManager(game);
  
  // Initialize renderer
  const canvas = document.getElementById('gameCanvas');
  const renderer = new Renderer(canvas, game);
  
  // Initialize UI
  const ui = new UI(game, networkManager);
  
  // Start game loop
  function gameLoop() {
    game.update();
    renderer.render();
    requestAnimationFrame(gameLoop);
  }
  
  // Start the game loop
  gameLoop();
  
  // Connect to server
  networkManager.connect();
});