# Event Bus Reference

All global game events are defined in `@/core/events`. 

When listening or publishing, always import `CORE_EVENTS` from `@/core/events`:

Available Events:
- `EVENTS.KEY_DOWN` (`input:keydown`) -> `{ key: string, code: string, originalEvent: KeyboardEvent }`
- `EVENTS.KEY_UP` (`input:keyup`) -> `{ key: string, code: string, originalEvent: KeyboardEvent }`

Example:
engine.bus.subscribe(EVENTS.KEY_DOWN, (data: KeyboardEventPayload) => {
  if (data.code === 'Space') jump();
});