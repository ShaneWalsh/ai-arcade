// 1. Payload Interfaces (tells human & AI what data comes with the event)
export interface KeyboardEventPayload {
  code: string;
  originalEvent: KeyboardEvent;
}

// 2. Strongly Typed Event Map
export interface GameEventMap {
  'input:keydown': KeyboardEventPayload;
  'input:keyup': KeyboardEventPayload;
  'game:over': { reason: string };
}

// 3. String Constants (Prevents typos like 'key-down' vs 'keydown')
export const CORE_EVENTS = {
  KEY_DOWN: 'input:keydown',
  KEY_UP: 'input:keyup',
  GAME_OVER: 'game:over',
} as const;