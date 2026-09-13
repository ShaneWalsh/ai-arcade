// 1. Payload Interfaces (tells human & AI what data comes with the event)
export interface KeyboardEventPayload {
  code: string;
  originalEvent: KeyboardEvent;
}

export interface MouseEventPayload {
  mouseEvent: MouseEvent;
  mouseCords: {
    mouseX: number;
    mouseY: number;
    osl: number;
    ost: number;
  };
}

// 2. Strongly Typed Event Map
export interface GameEventMap {
  keyboard: KeyboardEventPayload;
  keydown: KeyboardEventPayload;
  keyup: KeyboardEventPayload;
  'mouse:left-click': MouseEventPayload;
  'mouse:right-click': MouseEventPayload;
  'mouse:left-release': MouseEventPayload;
  'mouse:right-release': MouseEventPayload;
  'mouse:wheel': MouseEventPayload;
  'mouse:double-click': MouseEventPayload;
  resize: Window;
  'fullscreenchange': UIEvent;
  'game:over': { reason: string };
}

// 3. String Constants (Prevents typos like 'key-down' vs 'keydown')
export const CORE_EVENTS = {
  KEYBOARD: 'keyboard',
  KEY_DOWN: 'keydown',
  KEY_UP: 'keyup',
  MOUSE_LEFT_CLICK: 'mouse:left-click',
  MOUSE_RIGHT_CLICK: 'mouse:right-click',
  MOUSE_LEFT_RELEASE: 'mouse:left-release',
  MOUSE_RIGHT_RELEASE: 'mouse:right-release',
  MOUSE_WHEEL: 'mouse:wheel',
  MOUSE_DOUBLE_CLICK: 'mouse:double-click',
  RESIZE: 'resize',
  FULLSCREEN_CHANGE: 'fullscreenchange',
  GAME_OVER: 'game:over',
} as const;