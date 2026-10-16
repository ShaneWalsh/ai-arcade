---
name: simulation-ui
description: "Use when building or refactoring game menus, screens, HUD panels, movable windows, dialogs, or other DOM-based simulation UI in this repository. Covers the shared TypeScript UI components and game lifecycle integration."
---

# Simulation UI

Use the repository's existing DOM UI framework when implementing game menus and interface elements. The framework is vanilla TypeScript and CSS; do not add another UI library or create parallel screen/window/modal abstractions.

## Before editing

1. Read the relevant game module and identify its state transitions, input subscriptions, rendered canvas layers, and cleanup behavior.
2. Read the existing UI components and the reusable game menu at:
   - `src/core/ui/BaseComponent.ts`
   - `src/core/ui/ScreenManager.ts`
   - `src/core/ui/Window.ts`
   - `src/core/ui/Modal.ts`
   - `src/games/GameMenuScreen.ts`
3. Confirm that `public/index.html` contains `#app-root`, `src/index.ts` imports both CSS files, and the webpack entry remains the normal app entry. UI belongs in the main app; do not add a separate demo entry or HTML page.

## Available components

- `BaseComponent<TState>` provides typed state, `mount(container)`, `unmount()`, an `element` getter, and a protected `setState(nextState)`. Extend it for custom DOM components and implement `protected render(): HTMLElement`. Use `onUnmount()` to clean up owned UI resources.
- `ScreenManager(root)` controls one active screen. Call `show(screen)` to replace the current screen, `clear()` when returning to gameplay, and `destroy()` when the game module is destroyed. Screens implement `mount(container)` and `unmount()`; `BaseComponent` already implements that contract.
- `Window` (imported as `MovableWindow` if that improves clarity) accepts `title`, `content`, and optional position/width/close callback. Call `open()` to display and `close()` to remove it. It is draggable by its title bar.
- `Modal` offers `alert(title, message): Promise<void>`, `confirm(title, message): Promise<boolean>`, and `show(options): Promise<boolean>`. Await the result. Confirmation returns `false` on cancel, Escape, or backdrop click.

Example imports:

```ts
import { Modal } from '@/core/ui/Modal';
import { ScreenManager } from '@/core/ui/ScreenManager';
import { GameMenuScreen } from '@/games/GameMenuScreen';
```

## Integrate a game menu

1. Create and validate the screen manager in `GameModule.init()`:

   ```ts
   const root = document.getElementById('app-root');
   if (!root) throw new Error('The game UI requires an element with id "app-root".');
   this.screenManager = new ScreenManager(root);
   this.syncMenuScreen();
   ```

2. Keep the game state as the source of truth. Add a helper such as `syncMenuScreen()` that:
   - Clears the active UI screen while gameplay is active.
   - Shows a screen for title, pause, level-complete, victory, or game-over states as needed.
   - Tracks the state currently represented by the UI, so it does not rebuild the DOM every frame.
   - Wires button callbacks to existing game state transitions rather than duplicating game logic.
3. Prefer `GameMenuScreen` for standard title/result menus. Extend it only when the game needs a distinct menu structure; build custom elements with DOM APIs and text properties such as `textContent`, not interpolated HTML.
4. If menus need help or controls, use a `MovableWindow`. Close owned windows when the screen unmounts so they do not survive game/menu transitions.
5. Use `Modal.confirm()` for consequential actions such as restarting an active game. Guard against duplicate outstanding dialogs when keyboard input can repeat. Do not block menu interactions with `alert()` or synchronous browser dialogs.
6. Preserve relevant keyboard shortcuts, but keep them consistent with the visible buttons. Ensure a menu action cannot also trigger gameplay input.
7. Call `screenManager.destroy()` in `GameModule.destroy()` and clear references. Keep engine subscriptions in the existing `SubscriptionsHolder`; do not add UI-specific global event buses.

## Styling and layering

- The shared UI styles live in `src/core/ui/style.css` and are imported from `src/index.ts`; do not import them separately in each game.
- Reuse the `sim-ui-*` classes and CSS variables. Add styles there only when a shared component or shared visual pattern needs them. Keep game-specific visual styles narrowly scoped.
- `#app-root` overlays the game canvases. Its root uses `pointer-events: none`; interactive screen descendants explicitly enable pointer events. Preserve this behavior so gameplay remains clickable when no menu is mounted.
- Use DOM UI for menus, dialogs, and management panels; keep canvas drawing for game-world visuals. Do not clear the canvas in game logic.
- Create DOM nodes and event listeners in component render methods. Let unmount remove the component root, and use `onUnmount()` for owned windows/listeners requiring explicit cleanup.

## Validation checklist

- Run the production build and inspect TypeScript diagnostics for modified files.
- Verify the initial menu, each relevant terminal/transition state, button and keyboard actions, confirm/cancel behavior, and cleanup when switching or destroying a game.
- Open a briefing window, verify dragging and closing, and ensure the main page still loads the single app bundle.
- Confirm that gameplay input and clicks still work whenever menus and modal backdrops are absent.
