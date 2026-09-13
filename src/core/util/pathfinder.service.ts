import { Injectable } from '@angular/core';
import { Cord, Cords, GridCord } from '../../data/Common';
import { Bot2D } from '../support/bot/Bot2D';
import { isNull } from './logic.service';
import { UiSettings } from '../support/display/UiSettings';
import { DrawingContext } from '../support/SharedContext';

/**
 * Rip the War Rig path finding, and just adapt it. It worked well.
 * there is no need to alter the function for bigger tile sizes, the logic is base top left tile, so the loop works off this tile, the goal is to get this tile to the target location, or within accectable distance.
 * The logic to check if a tile is passable can do the work of checking if the other tiles are all passable as well! so a 2X2 will actually check 4 tiles for a single top left corner path finding.
 * I can optimise by adding a passable=true alongside mapped to speed up the logic, only have to check it the once inside the function.
 */
@Injectable({
  providedIn: 'root'
})
export class PathfinderService {

  public static straightLineLogic:boolean = false;

  constructor() { }

  // todo for multi sized bots that take more than one tile, I just need to change the isPassable call in the logic, to check all of the 4 squares, not just the top left,
  // if any of them are impassiable, then its a failure for that top left calculation isn't it.

  /**
   * Extracted from a former project from nearly 10 years ago
   * Needs Heavy refactoring.
   * Works for a single tile size element, not larger elements. Yet.
   * @param x starting x
   * @param y starting y
   * @param xx target x
   * @param yy target y
   * @param originalMap
   * @param checkTileEntity indicates if the passable function should include tile entities as blocking elements.
   * @returns
   */
  public static getSinglePath (x,y, xx,yy, originalMap:Map2D, td:TraversalDecider):MoveNode[] {
    // use A* to find the shortest path, return an array of nodes to move to
    var n = 0;
    var disx = this.positiveDifference(x,xx);
    var disy = this.positiveDifference(y,yy);
    let map = this.create2DArrayForMapped(originalMap.getTiles().length, originalMap.getTiles()[0].length);

    let open = []; // open and closed list for A* pathfinding
    let closed:MoveNode[] = [];

    var h = disx + disy + n;
    open.push(new MoveNode(x,y,n,h)); // opening node
    map[x][y].maped = true;

    // function to check for passability
    let checkPosition = (posX,posY) => {
      let mapTile = originalMap.safeGet(posX,posY);
      if( !isNull(mapTile) && map[posX][posY].maped === false && td.isOpen(mapTile, originalMap.getTiles())){ // open traversal? and it has not been maped yet
        disx = this.positiveDifference(posX,xx); 	// this will make sure the difference is a positive, or a zero :/
        disy = this.positiveDifference(posY,yy);
        var node = new MoveNode(posX,posY,n,(disx + disy + n));//create a new node, set values
        open.push(node);// add to open list
        map[posX][posY].maped = true;// mark as maped
      }
      else { // not a floor or door, dont add to closed, mark as maped
        map[posX][posY].maped = true;
      }
    }

    while(open[0].x != xx || open[0].y != yy){ // while the goal state is not in open position 0, keep searching
      closed.push(open.shift());	// remove first element, add it to the end of the closed list :p
      n = closed[closed.length-1].n; n++;// increase n based on open element's n
      x = closed[closed.length-1].x;
      y = closed[closed.length-1].y;

      if(this.straightLineLogic){
        if (x +1 < originalMap.getTiles().length ) checkPosition(x+1,y);
        if (x-1 > -1) checkPosition(x-1,y);
        if (y+1 < originalMap.getTiles()[x].length) checkPosition(x,y+1);
        if (y-1 > -1) checkPosition(x,y-1);
      } else {
        if (x +1 < originalMap.getTiles().length ){
          checkPosition(x+1,y);
          if (y+1 < originalMap.getTiles()[x+1].length){
            checkPosition(x+1,y+1);
          }
          if (y-1 > -1){
            checkPosition(x+1,y-1);
          }
        }
        if (x-1 > -1){
          checkPosition(x-1,y);
          if (y+1 < originalMap.getTiles()[x-1].length){
            checkPosition(x-1,y+1);
          }
          if (y-1 > -1){
            checkPosition(x-1,y-1);
          }
        }
        if (y+1 < originalMap.getTiles()[x].length) checkPosition(x,y+1);
        if (y-1 > -1) checkPosition(x,y-1);
      }

      open.sort((a,b)=>a.h - b.h); // sort and repeat until the goal is found eh?
      if(open.length === 0){ // then the target is not reachable
        return null;
      }
    } // when it ends the first element must be the goal tile
    closed.push(open.shift()); // now the goal is the final state in the closed list
    //closed.splice(0,1); // remove the very first element in closed list, as it is the starting position, // this is for the ai's benifit
    closed.reverse(); // for the loop, start at the end and work back using the n values to isolate the correct nodes
    for(var k = 0; k < closed.length-1; k++){//back track and remove all of the nodes I dont need, start at the end and work back, or reverse and start at the begining, each node after current not within 1X1 around it with a lower n value must be removed, then I will have one straight list of node positons to the goal
      var nodeClosed = closed[k];
      x = nodeClosed.x; y = nodeClosed.y;
      var next = false;
      while(next === false){ // keep going until I find the start node again
        var nextNode = closed[k+1];
        if(x+1 === nextNode.x && y === nextNode.y && nodeClosed.n > nextNode.n){
          next = true;
        }
        else if(x-1 === nextNode.x && y === nextNode.y && nodeClosed.n > nextNode.n){
          next = true;
        }
        else if(x === nextNode.x && y-1 === nextNode.y && nodeClosed.n > nextNode.n){
          next = true;
        }
        else if(x === nextNode.x && y+1 === nextNode.y && nodeClosed.n > nextNode.n){
          next = true;
        } // added the +1+1 as part of the  straightLineLogic toggle, but too lazy to separate the code. TODO add if around these, so I can go back to old logic.
        else if(x+1 === nextNode.x && y+1 === nextNode.y && nodeClosed.n > nextNode.n){
          next = true;
        }
        else if(x-1 === nextNode.x && y-1 === nextNode.y && nodeClosed.n > nextNode.n){
          next = true;
        }
        else if(x+1 === nextNode.x && y-1 === nextNode.y && nodeClosed.n > nextNode.n){
          next = true;
        }
        else if(x-1 === nextNode.x && y+1 === nextNode.y && nodeClosed.n > nextNode.n){
          next = true;
        }
        if(next === false){ // then I did not find it in the 1X1 around, remove it
          closed.splice(k+1,1); // remove k from the yoke
        }
        else{ // dont need to do anything, the other loop will move things along

        }
      }
    }
    closed.reverse() ;// so an enemy ai can use it to as a targeting system
    return closed;
  }

  private static positiveDifference(a,b):number {
    return (a > b)? a - b:b - a;
  }

  private static create2DArrayForMapped(rowsX,rowsY) {
    var gridA = [];
    for (var i=0;i<rowsX;i++) {
       gridA[i] = [];
       for (var j=0;j<rowsY;j++) {
        gridA[i][j] = {maped:false};
     }
    }
    return gridA;
  }

  public static getHeadingDirection(current:{x,y},target:{x,y}):HeadingDirection {
    if(target.x > current.x) {
      return (target.y > current.y)? HeadingDirection.BR : (target.y < current.y)? HeadingDirection.TR : HeadingDirection.RIGHT;
    } else if(target.x < current.x) {
      return (target.y > current.y)? HeadingDirection.BL : (target.y < current.y)? HeadingDirection.TL : HeadingDirection.LEFT;
    } else {
      return (target.y > current.y)? HeadingDirection.BOTTOM : (target.y < current.y)? HeadingDirection.TOP : HeadingDirection.NA;
    }
  }
}

export interface Map2D {
  // should safely return null if nothing exists in this position.
  safeGet(posX: number, posY: number): MapTile2D;
  getTiles(): MapTile2D[][];
  get(x, y): MapTile2D;
  getTilesWithinSensor(range: number, cords: GridCord): MapTile2D[];
}

export interface MapTile2D {
  // screen x+y postion scalled for tile size and zoom?
  getPosX():number;
  getPosY():number;
  getCenterX():number;
  getCenterY():number;
  // Cordinates in the Actual Map[][] grid
  getGridX():number;
  getGridY():number;
  gridCord():GridCord;
  getTileEntity():Bot2D;
  getTerrainCode():number;
  getUiCords(uiSet:UiSettings):Cord;
  // visibility.
  isRevealed(): boolean;
  reveal();
  drawOnMiniMap(dc: DrawingContext, cords:Cords);
}

/**
 *  Logic to decide if path is possible and optimal.
 *  Simple example is to pass off to the bot the logic, or maybe it just checks if its land based, and it can pass, like a spider or unstoppable machine.
 * */
export interface TraversalDecider {
  // Can we move through this tile
  isOpen(mapTile: MapTile2D, tiles:MapTile2D[][]): boolean;

}

export class MoveNode {
  constructor(
    public x,
    public y,
    public n,// distance from start
    public h // total value n + distance to end node
    ){ }
}

//########### UTILITY #############
// TL, T, TR
// L, NA, R
// BL, B, BR
export enum HeadingDirection {
  TL="TL",
  TOP="TOP",
  TR="TR",
  LEFT="LEFT",
  NA="NA",
  RIGHT="RIGHT",
  BL="BL",
  BOTTOM="BOTTOM",
  BR="BR"
 }

 export class BotSimpleTraversalDecider implements TraversalDecider {
  constructor(public bot:Bot2D){}

   isOpen(mapTile: MapTile2D, tiles:MapTile2D[][]): boolean {
    for(let i = mapTile.getGridX(); i < mapTile.getGridX()+this.bot.getTileSizeX(); i++) {
      for(let j = mapTile.getGridY(); j < mapTile.getGridY()+this.bot.getTileSizeY(); j++) {
        //console.log("i:"+i +" j:"+j);
        try {
          // TODO find a way to remove this check, its slowing everything down!
          if(i < tiles.length && j < tiles[i].length){
            let checkTile = tiles[i][j];
            if(!this.bot.canTraverse(checkTile)){
              return false;
            }
          }
        } catch (error) {
          console.warn(error);
          return false;
        }
      }
      // TODO how to optimise so I dont check the same tile more than once! Not just mapped but mark passable? will cut down on loops for big bots.
    }
    return true;
   }
 }

