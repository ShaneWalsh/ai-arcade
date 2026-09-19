import type { DrawingContext } from "./common/display/DrawingContext";

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

export interface IBot2d {
	id: string;
  team: string;
	radius?: number;
}

export interface IGridMap {
	isValidPosition(x: number, y: number): boolean;
	isWalkable(x: number, y: number, bot?: IBot2d): boolean;
	getTileCost(x: number, y: number): number;
	getWidth(): number;
	getHeight(): number;
}
