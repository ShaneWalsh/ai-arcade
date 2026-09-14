
export class CanvasContainer {

  public canvasBG1Ctx:CanvasRenderingContext2D; // land
  public canvasBG2Ctx:CanvasRenderingContext2D; // infra
  public canvasGame1Ctx:CanvasRenderingContext2D; // land units
  public canvasGame2Ctx:CanvasRenderingContext2D; // Air units/ special effects
  public canvasMiniMapCtx:CanvasRenderingContext2D; // MiniMap, rarely redraws or updates its base FOG of war.
  public canvasHUD1Ctx:CanvasRenderingContext2D; // Gui base
  public canvasHUD2Ctx:CanvasRenderingContext2D; // Gui interact

  constructor(
    public canvasBG1El:any,
    public canvasBG2El:any,
    public canvasGame1El:any,
    public canvasGame2El:any,
    public canvasMiniMapEl:any,
    public canvasHUD1El:any,
    public canvasHUD2El:any,
  ){
    this.canvasBG1Ctx = this.canvasBG1El.getContext('2d');
    this.canvasBG2Ctx = this.canvasBG2El.getContext('2d');
    this.canvasGame1Ctx = this.canvasGame1El.getContext('2d');
    this.canvasGame2Ctx = this.canvasGame2El.getContext('2d');
    this.canvasMiniMapCtx = this.canvasMiniMapEl.getContext('2d');
    this.canvasHUD1Ctx = this.canvasHUD1El.getContext('2d');
    this.canvasHUD2Ctx = this.canvasHUD2El.getContext('2d');
    /// TESTS
    // this.canvasGame1Ctx.filter = 'hue-rotate('+(180)+'deg)'
  }

  public clearCanvas() {
    this.canvasBG1Ctx.clearRect(0, 0, this.canvasBG1El.width, this.canvasBG1El.height);
    this.canvasBG2Ctx.clearRect(0, 0, this.canvasBG2El.width, this.canvasBG2El.height);
    this.canvasGame1Ctx.clearRect(0, 0, this.canvasGame1El.width, this.canvasGame1El.height);
    this.canvasGame2Ctx.clearRect(0, 0, this.canvasGame2El.width, this.canvasGame2El.height);
    this.canvasHUD1Ctx.clearRect(0, 0, this.canvasHUD1El.width, this.canvasHUD1El.height);
    this.canvasHUD2Ctx.clearRect(0, 0, this.canvasHUD2El.width, this.canvasHUD2El.height);
  }

  /**
   * Only called Manually, happens rarely.
   */
  public clearMiniMap() {
    this.canvasMiniMapCtx.clearRect(0, 0, this.canvasMiniMapEl.width, this.canvasMiniMapEl.height);
  }
}
