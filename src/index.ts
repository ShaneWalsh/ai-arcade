// TypeScript does not have a declaration for CSS side-effect imports.
import './style.css';
import { Game } from './game/Game';

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game('gameCanvas');
  game.start();
});