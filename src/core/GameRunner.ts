import { CanvasContainer } from './common/display/CanvasContainer';
import { DrawingContext } from './common/display/DrawingContext';
import { UiSettings } from './common/display/UiSettings';
import { GameModule } from './types';

export class GameRunner {

  private activeGame: GameModule | null = null;
  private lastTime = 0;
  private isRunning = false;
  private cc: CanvasContainer;
  private dc: DrawingContext;

  constructor() {
    this.cc = new CanvasContainer(
          document.getElementById("canvasBG1") as HTMLCanvasElement,
          document.getElementById("canvasBG2") as HTMLCanvasElement,
          document.getElementById("canvasGame1") as HTMLCanvasElement,
          document.getElementById("canvasGame2") as HTMLCanvasElement,
          document.getElementById("canvasMiniMap") as HTMLCanvasElement,
          document.getElementById("canvasHUD1") as HTMLCanvasElement,
          document.getElementById("canvasHUD2") as HTMLCanvasElement
        )
        this.dc = new DrawingContext(this.cc,new UiSettings());
    
    }   
  /** Mounts and initializes a game module */
  public async loadGame(game: GameModule): Promise<void> {
    // 1. Teardown active game if one exists
    if (this.activeGame) {
      this.activeGame.destroy();
    }

    // 2. Set new game and initialize it
    this.activeGame = game;
    await this.activeGame.init();

    // 3. Start loop if not already running
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      requestAnimationFrame(this.loop);
    }
  }

  /** Central Game Loop */
  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    const deltaTime = (currentTime - this.lastTime) / 1000; // Delta in seconds
    this.lastTime = currentTime;

    if (this.activeGame) {
      // Clear canvas automatically for every frame
      this.cc.clearCanvas();

      // Run active game update & render
      this.activeGame.update(deltaTime);
      this.activeGame.render(this.dc);
    }

    requestAnimationFrame(this.loop);
  };
}