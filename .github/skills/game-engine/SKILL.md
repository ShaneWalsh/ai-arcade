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