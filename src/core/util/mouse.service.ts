

export class MouseService {
  public static isClickListening: boolean=true;
  public static mouseX: number;
  public static mouseY: number;
  public static osl: number=0; // offsetleft X
  public static ost: number=0; // offsettop Y

  // NO DEPS, shared service
  constructor() {}

  public static createMouseInteraction(e:MouseEvent):MouseInteraction{
    return new MouseInteraction(e,this.getMouseCords());
  }

  public static getMouseCords():MouseCords{
    return new MouseCords(this.mouseX,this.mouseY,this.osl,this.ost)
  }

  public static resizeUpdateOffsets(element:any) {
    MouseService.osl = element.offsetLeft;
    MouseService.ost = element.offsetTop;
  }

  public static setupMouseListeners(element:any) {
    element.addEventListener("mousemove", MouseService.updateMousePosition.bind(MouseService), false);
    element.addEventListener("dblclick", MouseService.doubleClick.bind(MouseService), false);
    element.addEventListener("mousedown", MouseService.mouseClick.bind(MouseService), false);
    element.addEventListener("mouseup", MouseService.mouseClickRelease.bind(MouseService), false);
    element.addEventListener("wheel", MouseService.mouseWheel.bind(MouseService), false);
    element.addEventListener("contextmenu", MouseService.rightClickContext.bind(MouseService), false);
    MouseService.resizeUpdateOffsets(element);
  }

  public static updateMousePosition(e:any){
		this.mouseX =  Math.floor(e.pageX - this.osl);
		this.mouseY =  Math.floor(e.pageY - this.ost);
	}

	public static mouseClick(e:MouseEvent ){
    console.log("mouseClick",e);
    if(this.isClickListening === true){
			if(e.button == 0){
        MouseService.leftClickSubject.next(this.createMouseInteraction(e));
			}
			else if(e.button == 2){
        MouseService.rightClickSubject.next(this.createMouseInteraction(e));
			}
    }
  }

	public static mouseClickRelease(e:any){
    console.log("mouseClickRelease",e);
    if(this.isClickListening === true){
      if(e.button == 0){ // left
        MouseService.leftClickReleaseSubject.next(this.createMouseInteraction(e));
      }
      else if(e.button == 2){ // right
        MouseService.rightClickReleaseSubject.next(this.createMouseInteraction(e));
      }
    }
  }

  public static mouseWheel(e:any){
    if(this.isClickListening === true){
      // scale += event.deltaY * -0.01;
      if(ConfigService.isDebug)console.log("mouseWheel",e);
			MouseService.mouseWheelSubject.next(this.createMouseInteraction(e));
    }
  }

	public static rightClickContext(e:any){ // this is just a catch for the context menu, to prevent it from appearing.
    console.log("rightClickContext",e);
		e.preventDefault();
	}

	public static doubleClick(e:any) {
    if(this.isClickListening === true){
      MouseService.doubleClickSubject.next(this.createMouseInteraction(e));
    }
  }

}

export class MouseCords {

  constructor(
    public mouseX: number,
    public mouseY: number,
    /** offsetleft X */
    public osl: number,
    /** offsettop Y */
    public ost: number,
  ) {

  }

  // /**
  //  * The x and y already factor in the screen offsets.
  //  * @returns
  //  */
  // target():Target {
  //   return new Target(this.mouseX, this.mouseY);
  // }
}

export class MouseInteraction {
  constructor(
    public mouseEvent:MouseEvent,
    public mouseCords:MouseCords
  ) {

  }
}
