export interface ModalOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

let nextModalId = 0;

export class Modal {
  private isOpen = false;

  public constructor(private readonly root: HTMLElement = document.body) {}

  public alert(title: string, message: string): Promise<void> {
    return this.show({ title, message, confirmLabel: 'OK' }).then(() => undefined);
  }

  public confirm(title: string, message: string): Promise<boolean> {
    return this.show({ title, message, confirmLabel: 'Confirm', cancelLabel: 'Cancel' });
  }

  public show(options: ModalOptions): Promise<boolean> {
    if (this.isOpen) {
      throw new Error('This Modal instance already has an open dialog.');
    }
    this.isOpen = true;

    const titleId = `sim-ui-modal-title-${nextModalId++}`;
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = this.root.style.overflow;

    const backdrop = document.createElement('div');
    backdrop.className = 'sim-ui-modal-backdrop';

    const dialog = document.createElement('section');
    dialog.className = 'sim-ui-modal';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', titleId);

    const heading = document.createElement('h2');
    heading.className = 'sim-ui-modal-title';
    heading.id = titleId;
    heading.textContent = options.title;

    const message = document.createElement('p');
    message.className = 'sim-ui-modal-message';
    message.textContent = options.message;

    const actions = document.createElement('div');
    actions.className = 'sim-ui-modal-actions';

    const cancelButton = options.cancelLabel === undefined
      ? null
      : this.createButton(options.cancelLabel, 'sim-ui-button sim-ui-button-secondary');
    const confirmButton = this.createButton(
      options.confirmLabel ?? 'OK',
      'sim-ui-button sim-ui-button-primary',
    );

    if (cancelButton) {
      actions.append(cancelButton);
    }
    actions.append(confirmButton);
    dialog.append(heading, message, actions);
    backdrop.append(dialog);

    return new Promise<boolean>((resolve) => {
      const finish = (confirmed: boolean): void => {
        if (!this.isOpen) {
          return;
        }

        this.isOpen = false;
        backdrop.removeEventListener('click', handleBackdropClick);
        backdrop.removeEventListener('keydown', handleKeyDown);
        backdrop.remove();
        if (this.root === document.body) {
          this.root.style.overflow = previousOverflow;
        }
        if (previousFocus?.isConnected) {
          previousFocus.focus();
        }
        resolve(confirmed);
      };

      const handleBackdropClick = (event: MouseEvent): void => {
        if (event.target === backdrop) {
          finish(false);
        }
      };

      const handleKeyDown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
          event.preventDefault();
          finish(false);
          return;
        }

        if (event.key !== 'Tab') {
          return;
        }

        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex]:not([tabindex="-1"])'),
        );
        if (focusable.length === 0) {
          event.preventDefault();
          dialog.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      };

      cancelButton?.addEventListener('click', () => finish(false));
      confirmButton.addEventListener('click', () => finish(true));
      backdrop.addEventListener('click', handleBackdropClick);
      backdrop.addEventListener('keydown', handleKeyDown);

      if (this.root === document.body) {
        this.root.style.overflow = 'hidden';
      }
      this.root.append(backdrop);
      confirmButton.focus();
    });
  }

  private createButton(label: string, className: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = className;
    button.type = 'button';
    button.textContent = label;
    return button;
  }
}
