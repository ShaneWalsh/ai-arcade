export class HitBox {
  constructor(
      public hitBoxX:number=0,
      public hitBoxY:number=0,
      public hitBoxSizeX:number=90,
      public hitBoxSizeY:number=60
  ){

  }

  drawBorder(x:number,y:number,sizeX:number,sizeY:number,ctx:any,color:string){
      ctx.lineWidth = 1;
    ctx.strokeStyle = color;
    ctx.strokeRect(x,y,sizeX,sizeY);
  }

  areCentersToClose(first:any, a:HitBox,second:any, b:HitBox) {
      let ax = first.posX+a.hitBoxX;
      let ay = first.posY+a.hitBoxY;
      let bx = second.posX+b.hitBoxX;
      let by = second.posY+b.hitBoxY;
      return  (this.absVal( (ax+(a.hitBoxSizeX >> 1))  - (bx + (b.hitBoxSizeX >> 1)) ) < ((a.hitBoxSizeX >>1) + (b.hitBoxSizeX >> 1))) &&
              (this.absVal( (ay+(a.hitBoxSizeY >> 1))  - (by + (b.hitBoxSizeY >> 1)) ) < ((a.hitBoxSizeY >> 1) + (b.hitBoxSizeY >> 1)));
  }

  // HB to HB comparision
  clickedIn(b:HitBox) {
    return (b.hitBoxX > this.hitBoxX) && (b.hitBoxY > this.hitBoxY)
    && b.hitBoxX+b.hitBoxSizeX < this.hitBoxX+this.hitBoxSizeX
    && b.hitBoxY+b.hitBoxSizeY < this.hitBoxY+this.hitBoxSizeY;
  }

  /**
   * A rect cordinates for the hitbox, factoring in the relative position of the entity.
   * Support for instances with cords.
   */
  rectEl(relative:{posX:number,posY:number}):{TL:{x:number,y:number}, TR:{x:number,y:number}, BL:{x:number,y:number}, BR:{x:number,y:number}}{
    let hbX = this.hitBoxX+relative.posX;
    let hbY = this.hitBoxY+relative.posY;

    return {
      TL:{x:hbX,y:hbY},
      TR:{x:hbX+this.hitBoxSizeX,y:hbY},
      BL:{x:hbX,y:hbY+this.hitBoxSizeY},
      BR:{x:hbX+this.hitBoxSizeX,y:hbY+this.hitBoxSizeY}
    }
  }

  // Support for Targets
  rectTarget(relative:{x:number,y:number}):{TL:{x:number,y:number}, TR:{x:number,y:number}, BL:{x:number,y:number}, BR:{x:number,y:number}}{
    let hbX = this.hitBoxX+relative.x;
    let hbY = this.hitBoxY+relative.y;

    return {
      TL:{x:hbX,y:hbY},
      TR:{x:hbX+this.hitBoxSizeX,y:hbY},
      BL:{x:hbX,y:hbY+this.hitBoxSizeY},
      BR:{x:hbX+this.hitBoxSizeX,y:hbY+this.hitBoxSizeY}
    }
  }

  absVal(val:number) {
    return (val < 0) ? -val : val;
  }
}
