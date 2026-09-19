// TypeScript does not have a declaration for CSS side-effect imports.
import './style.css';
import { GameRunner } from '@/core/GameRunner';
import { SpaceInvadersGame } from '@/games/space-invaders';
import { KeyboardEventService } from './core/util/keyboard-event.service';
import { MouseService } from './core/util/mouse.service';
import TestPathingGame from './games/testpathing';

export * from './core/types';

let isLoaded = false;
// Main app entry point
async function bootstrap() {
  const runner = new GameRunner();

  // Default game loaded on startup (Easy to swap later via UI/dropdown)
  const defaultGame = new TestPathingGame();
  isLoaded = true;
  
  await runner.loadGame(defaultGame);
}

function handleKeyUp(event: KeyboardEvent): void {
  if (isLoaded) {
    KeyboardEventService.publishKeyboardUpEvent(event);
  }
}

function handleKeyDown(event: KeyboardEvent): void {
  if (isLoaded) {
    KeyboardEventService.publishKeyboardDownEvent(event);
  }
}

// Register global window listeners
window.addEventListener('keyup', handleKeyUp);
window.addEventListener('keydown', handleKeyDown);

// Mouse
MouseService.setupMouseListeners(document.getElementById("gameContainer"));

// Start app when DOM is ready
window.addEventListener('DOMContentLoaded', bootstrap);