import { DrawingContext } from "./common/display/DrawingContext";

export interface GameModule {
  /** Identifier for the game (e.g. 'space-invaders') */
  id: string;
  
  /** Called once when the game loads. Setup initial entities & event listeners here. */
  init(): void | Promise<void>;
  
  /** Called on every frame inside the main loop. Handle movement, physics, state updates. */
  update(deltaTime: number): void;
  
  /** Called on every frame after update. Perform canvas drawing here. */
  render(dc: DrawingContext): void;
  
  /** Called when switching games. Clean up listeners, timers, and game state. */
  destroy(): void;
}
