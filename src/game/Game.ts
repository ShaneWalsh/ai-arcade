import { Canvas } from './Canvas';

export class Game {
  private canvas: Canvas;
  private lastTime: number = 0;
  private isRunning: boolean = false;

  // Example entity state
  private x: number = 50;
  private speed: number = 100; // pixels per second

  constructor(canvasId: string) {
    this.canvas = new Canvas(canvasId, 800, 600);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  public stop(): void {
    this.isRunning = false;
  }

  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    // Delta time in seconds
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    // Game logic goes here
    this.x += this.speed * dt;
    if (this.x > this.canvas.element.width) {
      this.x = 0;
    }
  }

  private render(): void {
    this.canvas.clear();

    // Render logic goes here
    const ctx = this.canvas.ctx;
    ctx.fillStyle = '#00ffcc';
    ctx.fillRect(this.x, 275, 50, 50);
  }
}