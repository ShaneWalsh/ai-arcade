import { GameModule } from '@/core/types';
import { DrawingContext } from '@/core/common/display/DrawingContext';
import { SubscriptionsHolder } from '@/core/common/SubscriptionsHolder';
import { CORE_EVENTS } from '@/core/events';

export class SpaceInvadersGame implements GameModule {
  public id = 'space-invaders';
  private x = 50;
  private subscriptions = new SubscriptionsHolder();

  public init(): void {
    this.subscriptions.subscribe(CORE_EVENTS.KEY_DOWN, (data) => {
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
    this.subscriptions.destroy();
  }
}