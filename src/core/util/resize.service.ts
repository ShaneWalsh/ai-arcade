import { engine } from "@/core/engine";
import { CORE_EVENTS } from "../events";

export class ResizeService {
  constructor() {}

  public static publishResizeEvent(event: UIEvent) {
    console.log("publishResizeEvent");
    engine.bus.publish(CORE_EVENTS.RESIZE, event.target as Window);
  }

  public static publishFullscreenchangeEvent(event: UIEvent) {
    console.log("publishFullscreenchangeEvent I should probably do something with this :/ ");
    engine.bus.publish(CORE_EVENTS.FULLSCREEN_CHANGE, event);
  }

}
