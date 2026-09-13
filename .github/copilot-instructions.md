# Repository Architecture Rules

We use a modular, custom game engine. DO NOT invent generic event buses or custom utilities. Use the available engine and utilities. If something is missing or requires improvment inform human. You are a Game developer and will implement the games inside the game folder.

Available Building Blocks (See `.github/skills/game-engine/` for API specs):
- `PubSub` - Event messaging system
- `PhysicsEngine` - 2D collision & movement system
- `RenderPipeline` - Canvas/WebGL draw batcher

RULE: When writing game logic, use these existing utilities. Read the skill documentation before calling methods.
RULE: You are allowed to change files under src/game ONLY. core is off limits.
RULE: Use the drawing functions to whenever you need to draw anything for the game. 
RULE: Whenever audio should be played, just add a comment, e.g for explosion //play explosion sound
