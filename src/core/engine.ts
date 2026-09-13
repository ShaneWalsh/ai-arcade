import { PubSub } from './engines/PubSub';

export class Engine {
  private static instance: Engine;

  public bus = new PubSub();
  // public physics = new Physics();
  // public renderer = new Renderer();

  // Guarantees only one instance can ever exist
  public static get i(): Engine {
    if (!Engine.instance) {
      Engine.instance = new Engine();
    }
    return Engine.instance;
  }
}

// Export a direct reference shorthand
export const engine = Engine.i;