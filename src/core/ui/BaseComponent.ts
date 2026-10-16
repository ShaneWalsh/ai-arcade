export abstract class BaseComponent<TState> {
  protected state: TState;
  private mountedElement: HTMLElement | null = null;

  protected constructor(initialState: TState) {
    this.state = initialState;
  }

  protected abstract render(): HTMLElement;

  protected onUnmount(): void {}

  public get element(): HTMLElement | null {
    return this.mountedElement;
  }

  public mount(container: HTMLElement): void {
    if (this.mountedElement) {
      this.unmount();
    }

    const element = this.render();
    container.append(element);
    this.mountedElement = element;
  }

  public unmount(): void {
    if (!this.mountedElement) {
      return;
    }

    this.onUnmount();
    this.mountedElement.remove();
    this.mountedElement = null;
  }

  protected setState(nextState: TState): void {
    const previousState = this.state;
    this.state = nextState;

    if (!this.mountedElement) {
      return;
    }

    try {
      const nextElement = this.render();
      this.mountedElement.replaceWith(nextElement);
      this.mountedElement = nextElement;
    } catch (error) {
      this.state = previousState;
      throw error;
    }
  }
}
