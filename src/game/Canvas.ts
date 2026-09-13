export class Canvas {
  public element: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;

  constructor(canvasId: string, width: number, height: number) {
    const el = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!el) {
      throw new Error(`Canvas element with ID '${canvasId}' not found.`);
    }
    this.element = el;
    
    const context = this.element.getContext('2d');
    if (!context) {
      throw new Error('Failed to obtain 2D context.');
    }
    this.ctx = context;

    this.resize(width, height);
  }

  public resize(width: number, height: number): void {
    this.element.width = width;
    this.element.height = height;
  }

  public clear(): void {
    this.ctx.clearRect(0, 0, this.element.width, this.element.height);
  }
}