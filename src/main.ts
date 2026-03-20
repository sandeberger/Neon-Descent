import { Game } from './Game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

if (!canvas) {
  throw new Error('Canvas element not found');
}

const game = new Game(canvas);
game.start();

// Prevent default touch behaviors globally
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

// Expose for debug
(window as unknown as { game: Game }).game = game;
