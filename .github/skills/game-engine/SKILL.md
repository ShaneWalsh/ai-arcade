---
name: game-engine-architect
description: Teaches Copilot how to compose games using the internal PubSub, Physics, and Rendering modules. Trigger when writing or expanding game code.
---

# Game Engine Assembly Rules

When asked to generate or modify a game:
1. Initialize core utilities from `/src/engine/` (PubSub, Loop, Canvas).
2. Wire up inputs to the `PubSub` bus instead of standard `addEventListener`.
3. Keep game logic separated into distinct systems driven by events.

# Rule: Core Services
Do NOT pass engine instances into constructors. 
Import core services directly from `@/core/engine`:
`import { engine } from "@/core/engine";`

## API Cheat-Sheet
- For Event Specs: Refer to `references/pubsub.md`
- For Physics Specs: Refer to `references/physics.md`

---
name: game-module-builder
description: Teaches Copilot how to build or update game modules implementing the standard GameModule interface. Trigger when writing games.
---

# Game Module Standard Blueprint

When generating or modifying a game under `@/games/`, strictly adhere to this exact structural template:

```typescript
import { GameModule } from '@/core/types';
import { engine } from '@/core/engine';
import { DrawingContext } from '@/core/common/display/DrawingContext';
import { CORE_EVENTS } from '@/core/events';

export class [GameName]Game implements GameModule {
  public id = '[game-id-slug]';

  public init(): void | Promise<void> {
    // 1. Subscribe to events using engine.bus
    // 2. Setup game entities and state
  }

  public update(deltaTime: number): void {
    // 1. Process entity updates, physics, and movement
  }

  public render(dc: DrawingContext): void {
    // 1. Use the custom DrawingContext dc.cc context for rendering
  }

  public destroy(): void {
    // 1. Clean up event listeners via engine.bus.clear()
  }
}