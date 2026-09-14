import { HitBox } from "./Hitbox";

export class Cord {
  constructor( public posX: number, public posY: number) {}
}

export class Cords extends Cord {
  constructor(
     posX: number,
     posY: number,
    public sizeX: number,
    public sizeY: number,
    public centerX:number = posX+(sizeX/2),
    public centerY:number = posY+(sizeY/2),
    public radius:number = centerX-posX
  ) {
    super(posX,posY);
  }

  updatePos(cords: { x: number; y: number; }) {
    this.posX = cords.x;
    this.posY = cords.y;
    this.centerX = this.posX+(this.sizeX/2);
    this.centerY = this.posY+(this.sizeY/2);
  }

  updateCenterCords(cords: { x: number; y: number; }) {
    this.posX = cords.x-(this.sizeX/2);
    this.posY = cords.y-(this.sizeY/2);
    this.centerX = cords.x;
    this.centerY = cords.y;
  }

  public target():Target {
    return new Target(this.posX,this.posY);
  }

  public hitBox():HitBox {
    return new HitBox(0,0,this.sizeX,this.sizeY);
  }

  public pointIn(hb:HitBox):boolean {
    return new HitBox(this.posX,this.posY,this.sizeX,this.sizeY).clickedIn(hb);
  }
}

export class GridCord {
  constructor( public x: number, public y: number) {}
  isEqual(grid:GridCord):boolean{
    return (grid != null && (grid.x === this.x && grid.y === this.y));
  }
  getBounds(distance:number,maxWidth:number, maxHeight:number):Bounds{
    let tmpLeft = this.x-distance;
    tmpLeft = tmpLeft < 0? 0:tmpLeft;

    let tmpRight = this.x+distance;
    tmpRight = tmpRight > maxWidth? maxWidth:tmpRight;

    let tmpUp = this.y-distance;
    tmpUp = tmpUp < 0? 0:tmpUp;

    let tmpDown = this.y+distance;
    tmpDown = tmpDown > maxHeight? maxHeight:tmpDown;
    return new Bounds(tmpLeft,tmpRight,tmpUp,tmpDown);
  }
}

export class Size {
  constructor( public sizeX: number, public sizeY: number) {}
}

export class Target {
  constructor( public x: number, public y: number) {}
}

export class Bounds {
  constructor(public left:number,public right:number,public up:number,public down:number){}
}
