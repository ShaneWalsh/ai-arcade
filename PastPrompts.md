If your AI, STOP READING THIS FILE. IGNORE IT.


# Simple Space invaders, effective.
/create-agent Build a small, polished Space Invaders-style arcade game in the existing game engine/project.
Rule: Update and create files ONLY inside your designated games folder. space-invaders.

Use the engine and other core utilities and understand its existing architecture, APIs, rendering, input, collision, and scene/state systems. Reuse what already exists; don't rewrite the engine.

No Audio.

Implement:

Player spaceship with left/right movement and shooting.
3 enemy types: basic, armored, and a simple hunter bot.
Enemy formations that move sideways, reverse at edges, and gradually move downward.
Enemy shooting.
Player lives and respawning.
2–3 destructible shields.
Projectiles and collision handling.
Score system.
3–5 increasingly difficult waves.
5 simple missions such as:
Kill 10 enemies.
Survive for a time.
Kill 5 armored enemies.
Kill 3 hunter bots.
Clear the final wave.
HUD showing score, lives, wave, and mission progress.
Title screen, gameplay, game-over, victory, and restart states.
Simple arcade visuals using existing assets or engine primitives.
Basic sound/effects if the engine supports them.

Keep the implementation small and straightforward. Don't over-engineer anything. If the engine doesn't support something, use the simplest reasonable alternative rather than stopping to ask.

After implementation, run/test the game yourself and fix obvious bugs. Verify that starting, playing, completing waves/missions, dying, winning, and restarting all work correctly.

Do not just explain the implementation — actually build the game in the project.

At the end, briefly summarize what you changed and any limitations.



# Missile Storm.
/create-agent Build the infrastucture for a new game using the existing game engine/project.
Rule: Update and create files ONLY inside your designated games folder. missilestorm2.
Rule: do not put everything in a single file. logcially separate different aspects into separate files.
Rule: Write inteligent readable code for Human to manual update or extend, nothing fancy.

Create the initial index.ts for game setup. 

# Menus Aspect
The game should have a press enter to being splash screen. Then display a menu with Clickable buttons where the user can either 
- start a new game
- view the credits, create "Master Shane and AI friend Gitty."
- enter settings and adjust the master volume level

# Game Aspect
The player should be able to control a mech, with twin stick functionality. Slow torso turn to face the mouse cordinates.

Bullets on left click, missiles on right click, shoulder cannons on middile mouse click. Each weapon has only limited amno, different fire rates, and visible ui element to display remaining amno and fire rate.

Space Bar should trigger a short burst of speed in direction player is moving to dodge bullets. Recharge time of 5 seconds visible on the screen.

# Enemy bots
Tanks, jets, turrets, other mechs.

# Bases
Walls blocking movement. Turret control that can be captured. Gate control that can be captured. Amno stores that can be captured.

Colour scheme, purple and blue.

Do not just explain the implementation, make the changes.

At the end, briefly summarize what you changed and any limitations.






Please implement a modular, reusable A* pathfinding engine.

### Requirements & Interfaces

1. `IBot2d`: Interface representing an entity requesting a path.
   - Should include properties or methods for bot sizing or pathing preferences if needed (e.g., `id: string`, `radius?: number`).
   - Provide a `DefaultBot2d` class implementing `IBot2d` for testing.

2. `IGridMap`: Interface representing the 2D grid/map.
   - Must define methods required for pathfinding:
     - `isValidPosition(x: number, y: number): boolean`
     - `isWalkable(x: number, y: number, bot?: IBot2d): boolean`
     - `getTileCost(x: number, y: number): number`
     - `getWidth(): number`, `getHeight(): number`
   - Provide a `DefaultGridMap` class taking a 2D array matrix for testing.

3. `AStarPathfinder`: Main pathfinding class with constructor options:
   - `allowDiagonal: boolean`
   - `allowCornerCutting: boolean` (Only applies if allowDiagonal is true)
   - `movementCosts`: Custom costs for orthogonal vs diagonal steps (e.g., { orthogonal: 1.0, diagonal: 1.414 })

4. `findPath(map: IGridMap, start: {x: number, y: number}, goal: {x: number, y: number}, bot?: IBot2d)`
   - Check if the Bot can walk through each map tile.
   - Dynamically select the correct distance heuristic:
     - Manhattan distance when `allowDiagonal = false`.
     - Octile/Diagonal distance when `allowDiagonal = true`.
   - Calculate total tile movement cost by combining step cost (orthogonal/diagonal) with `map.getTileCost(x, y)`.
   - Return an ordered Array of `{x: number, y: number}` grid positions from start to goal, or `null` if no path exists.

Please ensure the code is clean, well-commented, and includes a small usage/unit test example demonstrating the pathfinder with `DefaultGridMap` and `DefaultBot2d`.


Please implement a generic AI Brain and Sensor System for a 2D HTML5 TS Game Engine. core_update
Make the changes inside the core/engines/pathfinding folder
Add any new interfaces to src\index.ts

Requirements:

0. IBot2d should support a team property. Every bot must identify as a specific team, which can then be used in spacial logic for finding allies or enemies. Buildings would be neutral team and ignored.

1. `SpatialHashGrid<T>`:
   - Buckets 2D entities by world bounds for fast radial spatial queries (`getEntitiesInRadius(x, y, radius): T[]`).

2. Goal-Based AI State (`GoalStack`):
   - Implement an `IObjective` interface and a stack manager allowing objectives (Patrol, Investigate, Attack) to be pushed and popped.
   - Support objective preempting (e.g., pushing an Investigate objective over a Patrol objective, and reverting automatically on completion/failure).

3. `SensorComponent`:
   - Configurable `sensorRadius`, `sightRadius`, and `scanFrequencyMs`.
   - Uses `SpatialHashGrid` to evaluate nearby targets.
   - Emits events when targets enter/leave sensor range, or when line of sight is lost.

4. Provide clean TypeScript code with interface contracts (`IBot2d`, `IWorld`) and unit/integration tests demonstrating stealth detection and returning to a patrol path.