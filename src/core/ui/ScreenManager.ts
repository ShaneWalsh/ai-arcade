export interface Screen {
  mount(container: HTMLElement): void;
  unmount(): void;
}

export class ScreenManager {
  private activeScreen: Screen | null = null;

  public constructor(private readonly root: HTMLElement) {}

  public show(screen: Screen): void {
    if (screen === this.activeScreen) {
      return;
    }

    this.activeScreen?.unmount();
    this.activeScreen = null;
    screen.mount(this.root);
    this.activeScreen = screen;
  }

  public clear(): void {
    this.activeScreen?.unmount();
    this.activeScreen = null;
  }

  public destroy(): void {
    this.clear();
  }
}
