import { Cord, Cords } from "../common/CommonCords";

export class LogicService {

  public static RADIANCAL= 180/Math.PI;
  public static DEGREECAL= Math.PI/180;

  // NO DEPS, shared service
  constructor() { }

  /**
   * The point of this method is to simplify the process of rotating an image around another image.
   * In order to draw something correctly after rotation you have to take its center point, and rotate that using the angle of the parent.
   * Then subtract half the image size to get the top left again, this is where the image needs to be drawn and rotated.
   * This is required to accurately draw a muzzle flash or bullet coming out of a turret correctly.
   * Rotate around the parents rotation point, with your rotation point,
   * then return both your final rotation cords and the topleft cords after rotating for drawing top left x+y.
   * @param parCenterX
   * @param parCenterY
   * @param point2X
   * @param point2Y
   * @param imgSizeX
   * @param imgSizeY
   * @param angle
   */
  public static topLeftAfterRotation(parCenterX: number, parCenterY: number, point2X: number, point2Y: number, imgSizeX: number, imgSizeY: number, angle: number) :{x:number,y:number, xR:number, yR:number} {
    let halfImageSizeX = imgSizeX/2;
    let halfImageSizeY = imgSizeY/2;
    let cords = this.pointAfterRotation(parCenterX, parCenterY, point2X + halfImageSizeX, point2Y + halfImageSizeY, angle);
    return { x: (cords.x-halfImageSizeX), y: (cords.y-halfImageSizeY), xR: cords.x, yR: cords.y };
  }

  /**
   *
   * @param centerX rotaing around
   * @param centerY
   * @param point2X point rotating
   * @param point2Y
   * @param angle
   * @returns
   */
  public static pointAfterRotation(centerX: number, centerY: number, point2X: number, point2Y: number, angle: number) :{x:number,y:number} {
    var x1 = point2X - centerX;
    var y1 = point2Y - centerY;

    var x2 = x1 * Math.cos(angle) - y1 * Math.sin(angle);
    var y2 = x1 * Math.sin(angle) + y1 * Math.cos(angle);

    var newX = x2 + centerX;
    var newY = y2 + centerY;

    return { x: newX, y: newY }; // so i can drop it straight into assignments
  }
	/**
	 * l are the image cords. x+y are the positions on the screen canvas.
	 * the translateX + Y when drawing something that is its own source of truth, e.g a turret, the defaults are fine.
	 * When calcualting the rotation of an object based off the rotation of another, eg. a bullet from a turret
	 * the translateX + Y need to be calcualted by rotating the center of the bullet, and use this rotated center as the translateX + Y
	 * and workout the x,y from the translateX + Y - sx+sy.
	 *
	 */
  public static drawRotateImage(imageObj: CanvasImageSource, ctx: CanvasRenderingContext2D, rotation: number, x: number, y: number, sx: number, sy: number, lx: number = x, ly: number = y, lxs: number = sx, lys: number = sy, translateX: number = x + (sx / 2), translateY: number = y + (sy / 2)) {
    // bitwise transformations to remove floating point values, canvas drawimage is faster with integers
    lx = (0.5 + lx) << 0;
    ly = (0.5 + ly) << 0;

    translateX = (0.5 + translateX) << 0;
    translateY = (0.5 + translateY) << 0;

    ctx.save();
    ctx.translate(translateX, translateY); // this moves the point of drawing and rotation to the center.
    ctx.rotate(rotation);
    ctx.translate(translateX * -1, translateY * -1); // this moves the point of drawing and rotation to the center.
    ctx.drawImage(imageObj, lx, ly, lxs, lys, x, y, sx, sy);

    ctx.restore();
  }

  public static drawRotateBorder(lineWidth: number, color: string, ctx: CanvasRenderingContext2D, rotation: number, x: number, y: number, sx: number, sy: number, translateX: number = x + (sx / 2), translateY: number = y + (sy / 2)) {
    // bitwise transformations to remove floating point values, canvas drawimage is faster with integers
    translateX = (0.5 + translateX) << 0;
    translateY = (0.5 + translateY) << 0;

    ctx.save();
    ctx.translate(translateX, translateY); // this moves the point of drawing and rotation to the center.
    ctx.rotate(rotation);
    ctx.translate(translateX * -1, translateY * -1);
    ctx.lineWidth = lineWidth;
  	ctx.strokeStyle = color;
  	ctx.strokeRect(x,y,sx,sy);
    ctx.restore();
  }

  public static drawBorder(x: number,y: number,sizeX: number,sizeY: number,ctx: CanvasRenderingContext2D,color: string,lineWidth: number = 1){
    ctx.lineWidth = lineWidth;
  	ctx.strokeStyle = color;
  	ctx.strokeRect(x,y,sizeX,sizeY);
  }

  public static drawBorderJustCorners(x: number,y: number,sizeX: number,sizeY: number,dist: number,color: string, ctx: CanvasRenderingContext2D){
    ctx.save();
    ctx.lineWidth = 5;
  	ctx.strokeStyle = color;
    //TODO redo this using highlighter path logic, to get nice straight edges.
    // top left
  	this.drawLine(x,y, x+dist,y,color,ctx);
  	this.drawLine(x,y, x,y+dist,color,ctx);
    // top right
    this.drawLine((x+sizeX)-dist,y, x+sizeX,y,color,ctx);
  	this.drawLine(x+sizeX,y, x+sizeX,y+dist,color,ctx);

    ctx.restore();
  }

  public static writeOnCanvas(x: number,y: number,text: string,size: number,color1: string,ctx: CanvasRenderingContext2D){
    ctx.font = size + "px 'Century Gothic'"; // Supertext 01
    ctx.fillStyle = color1;
    ctx.fillText(text, x, y+size);
    //ctx.fill();
  }

  public static posDiff(a: number,b: number):number {
    return (a > b)? a - b:b - a;
  }

  // 0 -> (max-1)
  public static getRandomInt(max: number): number {
    return Math.floor(Math.random() * Math.floor(max));
  }
  //https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
  public static shuffle(array: any[]): any[] {
    let currentIndex = array.length,  randomIndex;
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
  }

  public static radianToDegree(radians: number): number {
    var deg = radians * this.RADIANCAL;
    if(deg < 0){
        return deg+360;
    }
    else{
          return deg;
      }
  }

  public static radianToDegreeFloor(radians: number): number {
    return Math.floor(this.radianToDegree(radians))
  }

  public static degreeToRadian(degrees: number): number {
    return degrees * this.DEGREECAL;
  }

  public static Create2DArray(rows: number): any[][] {
    var gridA: any[][] = [];
    for (var i=0;i<rows;i++) {
       gridA[i] = [];
    }
    return gridA;
  }

  public static drawPath(x: number,y: number,xx: number,yy: number,color: string,ctx: CanvasRenderingContext2D){
    ctx.beginPath();
    ctx.moveTo(x+32, y+32);
    ctx.lineTo(xx, yy);
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  public static drawLine(x: number,y: number,xx: number,yy: number,color: string,ctx: CanvasRenderingContext2D){
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(xx, yy);
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  public static drawBox(x: number,y: number,sX: number,sY: number,ctx: CanvasRenderingContext2D,fillColour: string,borderColor: string,lineWidth: number = 2){
    ctx.lineWidth = lineWidth;
    ctx.fillStyle = fillColour;
    ctx.fillRect(x, y, sX, sY);
    ctx.strokeStyle = borderColor;
    ctx.strokeRect(x,y,sX,sY);
  }

  public static drawNoBorder(x: number,y: number,sX: number,sY: number,ctx: CanvasRenderingContext2D,fillColour: string,lineWidth: number = 2){
    ctx.lineWidth = lineWidth;
    ctx.fillStyle = fillColour;
    ctx.fillRect(x, y, sX, sY);
  }

  public static drawIsoBox(x: number,y: number,sX: number,sY: number,ctx: CanvasRenderingContext2D,colour: string){
    let hX= sX/2;
    let hY= sY/2;
    this.drawLine(x+hX,y,x+sX,y+hY,colour,ctx);
    this.drawLine(x+sX,y+hY,x+hX,y+sY,colour,ctx);
    this.drawLine(x+hX,y+sY,x,y+hY,colour,ctx);
    this.drawLine(x,y+hY,x+hX,y,colour,ctx);
  }

  public static drawCircle = (x:number, y:number, radius:number, fill:any, stroke:any, strokeWidth:number, style:any, ctx:CanvasRenderingContext2D) => {
    ctx.save();
    ctx.beginPath()
    if(style === "DOTTED") {
      ctx.setLineDash([5, 5]);
    }
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
    if (fill) {
      ctx.fillStyle = fill
      ctx.fill()
    }
    if (stroke) {
      ctx.lineWidth = strokeWidth
      ctx.strokeStyle = stroke
      ctx.stroke()
    }
    ctx.closePath()
    ctx.restore();
  }

  /**
   * Taking in two points return a rect between the two points no mater where they are in relation to each other
   * E.g click - draging and drawing a box in between.
   * x: The top left x
   * y: The top left y
   * sx: distance from x+x2 sx
   * sy: distance from y+y2 sy
   * x2: The bottom right x2
   * y2: The bottom right y2
   * @returns
   */
  public static getRectCords(p1x: number,p1y: number,p2x: number,p2y: number):{x:number,y:number,sx:number,sy:number,x2:number,y2:number}{
    if(p1x > p2x){
      if(p1y > p2y){ // p1 is bottom right
        return {x:p2x, y:p2y, sx:p1x-p2x, sy:p1y - p2y, x2:p1x, y2:p1y}
      } else { // p1 is top right
        return {x:p2x, y:p1y, sx:p1x-p2x, sy:p2y - p1y, x2:p1x, y2:p2y}
      }
    } else { // less than
      if(p1y > p2y){ // p1 is bottom left
        return {x:p1x, y:p2y, sx:p2x-p1x, sy:p1y - p2y, x2:p2x, y2:p1y}
      } else { // p1 top left
        return {x:p1x, y:p1y, sx:p2x-p1x, sy:p2y - p1y, x2:p2x, y2:p2y}
      }
    }
  }

  /**
   * Loop around on a value
   * @param index the current index position
   * @param length the maximum value before the loop resets to 0
   * @param increment the amount to increment on each loop
   * @returns
   */
  static incrementLoop(index: number, length: number, increment:number=1): number {
    index = index+increment;
    return (index >= length)?0:index;
  }

  /**
   * checks if the postive difference between number1 + 2 is less than the shouldBeLessThan value.
   * @param number1
   * @param number2
   * @param shouldBeLessThan
   * @returns
   */
   public static isDiffLessThanCalc(number1: number, number2: number, shouldBeLessThan:number){
    var totalDiff = number1 - number2;
    if(totalDiff < 0){
      totalDiff = totalDiff*-1;
    }
    return totalDiff < shouldBeLessThan;
  }

  /**
   * checks if the postive difference between number value is less than the shouldBeLessThan value.
   * @param value
   * @param shouldBeLessThan
   * @returns
   */
  public static isDiffLessThan(value: number, shouldBeLessThan:number){
    if(value < 0){
      value = value*-1;
    }
    return value < shouldBeLessThan;
  }

  // move values from one array to another while iterating over them and running some logic
  public static moveBetweenArrays(fromArray: any[], toArray: any[], func: (value: any) => boolean) {
    for( let i = 0; i < fromArray.length; i++ ) {
      if(func(fromArray[i])){
        toArray.push(fromArray.splice(i));
        i--;
      }
    }
  }

  // https://stackoverflow.com/questions/2752725/finding-whether-a-point-lies-inside-a-rectangle-or-not/37865332#37865332
  public static isPointInRectangle(m: {x: number, y: number}, r: {TL: {x: number, y: number}, TR: {x: number, y: number}, BL: {x: number, y: number}, BR: {x: number, y: number}} ):boolean {
    var AB = LogicService.vector(r.BL, r.TL);
    var AM = LogicService.vector(r.BL, m);
    var BC = LogicService.vector(r.TL, r.TR);
    var BM = LogicService.vector(r.TL, m);
    var dotABAM = LogicService.dot(AB, AM);
    var dotABAB = LogicService.dot(AB, AB);
    var dotBCBM = LogicService.dot(BC, BM);
    var dotBCBC = LogicService.dot(BC, BC);
    return 0 <= dotABAM && dotABAM <= dotABAB && 0 <= dotBCBM && dotBCBM <= dotBCBC;
  }
  public static isPointInCords(c:Cord, hb:Cords ):boolean {
    return this.isPointInRectangle({x:c.posX,y:c.posY},{TL:{x:hb.posX,y:hb.posY}, TR:{x:hb.posX+hb.sizeX,y:hb.posY},
       BL:{x:hb.posX,y:hb.posY+hb.sizeY}, BR:{x:hb.posX+hb.sizeX,y:hb.posY+hb.sizeY}})
  }
  private static vector(p1: {x: number, y: number}, p2: {x: number, y: number}): {x: number, y: number} {
    return {x: (p2.x - p1.x), y: (p2.y - p1.y)};
  }
  private static dot(u: {x: number, y: number}, v: {x: number, y: number}): number {
    return u.x * v.x + u.y * v.y;
  }
}

export function isNull(value:any):boolean{
  return value === undefined || value === null
}

export function notNull(value:any):boolean{
  return !isNull(value);
}

export enum HardRotationAngle {
  UP=-1.5707963267948966,
  DOWN=1.5707963267948966,
  LEFT=3.141592653589793,
  RIGHT=0,
}


/**
 * From Highlighter
 */
export const writeInPixels = (x:number, y:number, size:number, text:string, color:string, align:string, cords:Cords, ctx:any) => {
	//ctx.font = size + "px 'Century Gothic'";
  if(align === "SIDEBARLEFT"){
    let newX = cords.posX + (y-cords.posY);
    let newY = cords.posY + cords.sizeY
    ctx.save();
    ctx.font = size + "px 'sans-serif'";
    ctx.fillStyle = color;
    ctx.translate( newX, newY);
    ctx.rotate(-Math.PI/2);
    ctx.fillText(text, 5, 0);
    ctx.restore();
  } else if(align === "SIDEBARCENTER"){
    let newX = cords.posX + (y-cords.posY);
    let newY = cords.posY + (cords.sizeY/2)
    ctx.save();
    ctx.font = size + "px 'sans-serif'";
    ctx.fillStyle = color;
    ctx.translate( newX, newY);
    ctx.rotate(-Math.PI/2);
    ctx.textAlign = 'center';
    ctx.fillText(text, 5, 0);
    ctx.restore();
  } else if (align === "CENTER" || align === "TOPCENTER") {
    ctx.save();
    ctx.font = size + "px 'sans-serif'";
    ctx.fillStyle = color;
    let textSpace = ctx.measureText(text).width;
    ctx.fillText(text, cords.posX+ ((cords.sizeX-textSpace)/2), y);
    ctx.restore();
  } else {
    ctx.save();
    ctx.font = size + "px 'sans-serif'";
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }
}

export interface Chunk {
  x:number,
  y:number
  text:string
}

/**
 * Calc how many chunks there will be
 * Then calculate the postions of them, factoring in alignment
 * returns chunks:[{x,y,text}]
 */
export const calculateChunks = (x:number, y:number, sizeX:number, sizeY:number, textSize:number, text:string, align:string):Chunk[] => {
  if(sizeX > 5 && sizeY > 2) {
    if(align === "CODE"){
      let texts:any[] = text.split("\n");
      let chunks:Chunk[] = [];
      let topPadding = Math.round((textSize/100) * 130);
      for(let i = 0; i < texts.length;i++) {
        chunks.push({x:x + 5,y:y+topPadding+(i*textSize),text:texts[i] });
      }
      return chunks
    } else {
      text = text.trim();
      const len = text.length;
      let maxLen = Math.floor(sizeX / (textSize/2)) + Math.floor(sizeX/100);
      if(align === "SIDEBARLEFT" || align === "SIDEBARCENTER") { // the size is actually measured by height when doing sidebar
        maxLen = Math.floor(sizeY / (textSize/2)) + Math.floor(sizeY/100);
      }
      let curLen = 0;
      let texts:any[] = [];
      // work out the chunks of text based on the space
      for(let i =0; curLen < len; i++) {
        let max = (curLen+maxLen >= len)?len:curLen+maxLen;
        while(text.charAt(max)!== ' ' && max < len && max > 2){max--;}
        let txt = text.substring(curLen,max); //.trim();

        // Check for newlines in this text and split on it.
        let newLineSplits = txt.split('\n');// .map(t => t.trim());
        if(newLineSplits.length === 1){
          curLen = max;
        } else {
          curLen = curLen + newLineSplits[0].length + 1 // +1 to get past the \n
        }
        texts.push(newLineSplits[0]);
        if(i > 10000) return []; // sanity fallback
      }
      texts = texts.map(t => t.trim()).filter(t => t.length > 0); // trim everything. We cannot do it above, because we need the full lenghts for measuring
      // then do the alignment
      let chunks:Chunk[] = [];
      // for standard style
      if(align === "TOPLEFT" || align === "SIDEBARLEFT" || align === "SIDEBARCENTER") {
        let topPadding = Math.round((textSize/100) * 90);
        for(let i = 0; i < texts.length;i++) {
          chunks.push({x:x + 5,y:y+topPadding+(i*textSize),text:texts[i] });
        }
      } else if(align === "CENTER") {
        // TODO
        let halfText = textSize/2;
        let startingY = 5 + (sizeY/2);
        let startingX = (sizeX/2);
        // Lets work out the starting Y
        if(texts.length % 2 === 0 && texts.length > 1){ // even
          let even = texts.length/2;
          startingY = (startingY+halfText) - (textSize * even);
        } else if((texts.length % 2 === 1 && texts.length > 1)){
          let odd = Math.floor(texts.length/2); // round down.
          startingY = startingY - (textSize * odd);
        }
        // X will be worked out independently for each line
        for(let i = 0; i < texts.length;i++) {
          let txt = texts[i];
          let centeringAdjustment = 0;
          if(txt.length < 10) centeringAdjustment = halfText;
          let percentage = ((txt.length/maxLen)*100); // whats this text % of the total length is this string? Then half it.
          let widthOffset = ((sizeX/2)/100)*percentage; // now take this half percentage from the startingX which is centered.
          chunks.push({x:x+(startingX - widthOffset)-centeringAdjustment ,y:y+startingY+(i*textSize),text:texts[i] });
        }
      } else if(align === "TOPCENTER") {
        // TODO
        let halfText = textSize/2;
        let startingY = Math.round((textSize/100) * 90);
        let startingX = (sizeX/2);
        // X will be worked out independently for each line
        for(let i = 0; i < texts.length;i++) {
          let txt = texts[i];
          let centeringAdjustment = 0;
          if(txt.length < 10) centeringAdjustment = halfText;
          let percentage = ((txt.length/maxLen)*100); // whats this text % of the total length is this string? Then half it.
          let widthOffset = ((sizeX/2)/100)*percentage; // now take this half percentage from the startingX which is centered.
          chunks.push({x:x+(startingX - widthOffset)-centeringAdjustment ,y:y+startingY+(i*textSize),text:texts[i] });
        }
      }

      return chunks;
    }
  } else {
    return [];
  }
}
