

import { engine } from "@/core/engine";
import { KeyboardEventPayload } from "../events";

type KeyboardEventChannel = 'keyboard' | 'keydown' | 'keyup';

export class KeyboardEventService {

  // add a map to only trigger the key down once, then /// <reference path="
  private keyPressedMap:Map<string,KeyboardEvent> = new Map();

  constructor() {}

  public subscribe(
    channel: KeyboardEventChannel,
    callback: (event?: KeyboardEventPayload) => void,
  ): () => void {
    return engine.bus.subscribe(channel, callback);
  }

  public unsubscribe(
    channel: KeyboardEventChannel,
    callback: (event?: KeyboardEventPayload) => void,
  ): void {
    engine.bus.unsubscribe(channel, callback);
  }

  public clear(channel?: KeyboardEventChannel): void {
    engine.bus.clear(channel);
  }

  publishKeyboardUpEvent(event:KeyboardEvent){
    if(this.keyPressedMap.has(event.code)){
      const keyboardEvent = new CustomKeyboardEvent(event.code, event);
      engine.bus.publish('keyboard', keyboardEvent);
      engine.bus.publish('keyup', keyboardEvent);
      this.keyPressedMap.delete(event.code);
    }
  }

  publishKeyboardDownEvent(event:KeyboardEvent){
    if(!this.keyPressedMap.has(event.code)){
      const keyboardEvent = new CustomKeyboardEvent(event.code, event);
      engine.bus.publish('keyboard', keyboardEvent);
      engine.bus.publish('keydown', keyboardEvent);
      this.keyPressedMap.set(event.code,event);
    }
  }

  clearKeyPressMap(){
    this.keyPressedMap = new Map();
  }
}


export class CustomKeyboardEvent implements KeyboardEventPayload {
  constructor(public code:string, public originalEvent:KeyboardEvent){

  }
}
