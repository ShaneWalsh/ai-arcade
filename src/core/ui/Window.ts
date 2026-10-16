import { BaseComponent } from './BaseComponent';

export interface WindowOptions {
  title: string;
  content: Node | string;
  x?: number;
  y?: number;
  width?: number;
  onClose?: () => void;
}

interface WindowState {
  x: number;
  y: number;
}

let nextWindowId = 0;

export class Window extends BaseComponent<WindowState> {
  private readonly titleId = `sim-ui-window-title-${nextWindowId++}`;
  private titleBar: HTMLElement | null = null;
  private dragStart: { pointerX: number; pointerY: number; x: number; y: number } | null = null;
  private dragPointerId: number | null = null;

  public constructor(private readonly options: WindowOptions) {
    super({ x: options.x ?? 48, y: options.y ?? 48 });
  }

  public open(container: HTMLElement = document.body): void {
    this.mount(container);
  }

  public close(): void {
    if (!this.element) {
      return;
    }

    this.unmount();
    this.options.onClose?.();
  }

  protected render(): HTMLElement {
    const frame = document.createElement('section');
    frame.className = 'sim-ui-window';
    frame.setAttribute('role', 'dialog');
    frame.setAttribute('aria-labelledby', this.titleId);
    frame.style.left = `${this.state.x}px`;
    frame.style.top = `${this.state.y}px`;
    if (this.options.width !== undefined) {
      frame.style.width = `${this.options.width}px`;
    }

    const titleBar = document.createElement('header');
    titleBar.className = 'sim-ui-window-titlebar';
    titleBar.addEventListener('pointerdown', this.handlePointerDown);
    titleBar.addEventListener('pointermove', this.handlePointerMove);
    titleBar.addEventListener('pointerup', this.handlePointerEnd);
    titleBar.addEventListener('pointercancel', this.handlePointerEnd);
    this.titleBar = titleBar;

    const title = document.createElement('h2');
    title.className = 'sim-ui-window-title';
    title.id = this.titleId;
    title.textContent = this.options.title;

    const closeButton = document.createElement('button');
    closeButton.className = 'sim-ui-button sim-ui-window-close';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', `Close ${this.options.title}`);
    closeButton.textContent = '×';
    closeButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.close();
    });

    titleBar.append(title, closeButton);

    const body = document.createElement('div');
    body.className = 'sim-ui-window-body';
    if (typeof this.options.content === 'string') {
      body.textContent = this.options.content;
    } else {
      body.append(this.options.content);
    }

    frame.append(titleBar, body);
    return frame;
  }

  protected onUnmount(): void {
    this.stopDragging();
    this.titleBar = null;
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || !this.titleBar) {
      return;
    }

    if (event.target instanceof Element && event.target.closest('button')) {
      return;
    }

    event.preventDefault();
    this.dragPointerId = event.pointerId;
    this.dragStart = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: this.state.x,
      y: this.state.y,
    };
    this.titleBar.classList.add('is-dragging');
    this.titleBar.setPointerCapture(event.pointerId);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.dragPointerId !== event.pointerId || !this.dragStart || !this.element) {
      return;
    }

    const maxX = Math.max(0, window.innerWidth - this.element.offsetWidth);
    const maxY = Math.max(0, window.innerHeight - (this.titleBar?.offsetHeight ?? 0));
    const x = Math.min(maxX, Math.max(0, this.dragStart.x + event.clientX - this.dragStart.pointerX));
    const y = Math.min(maxY, Math.max(0, this.dragStart.y + event.clientY - this.dragStart.pointerY));

    this.state = { x, y };
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
  };

  private readonly handlePointerEnd = (event: PointerEvent): void => {
    if (this.dragPointerId === event.pointerId) {
      this.stopDragging();
    }
  };

  private stopDragging(): void {
    if (this.dragPointerId !== null && this.titleBar?.hasPointerCapture(this.dragPointerId)) {
      this.titleBar.releasePointerCapture(this.dragPointerId);
    }

    this.dragPointerId = null;
    this.dragStart = null;
    this.titleBar?.classList.remove('is-dragging');
  }
}
