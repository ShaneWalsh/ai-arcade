import { GameModule } from '@/core/types';
import { engine } from '@/core/engine';
import { DrawingContext } from '@/core/common/display/DrawingContext';
import { CORE_EVENTS } from '@/core/events';

export class SpaceInvadersGame implements GameModule {
  public id = 'space-invaders';
  private x = 50;

  public init(): void {
    // Subscribe to events using your simple PubSub
    engine.bus.subscribe(CORE_EVENTS.KEY_DOWN, (data) => {
      if (data.code === 'ArrowRight') this.x += 10;
    });
  }

  public update(deltaTime: number): void {
    // Move entities, run collisions, etc.
  }

  public render(dc:DrawingContext): void {
    // Draw game elements
    dc.cc.canvasGame1Ctx.fillStyle = 'red';
    dc.cc.canvasGame1Ctx.fillRect(this.x, 100, 40, 40);
  }

  public destroy(): void {
    // Clear listeners/timers when switching away from this game
    engine.bus.clear();
  }
}