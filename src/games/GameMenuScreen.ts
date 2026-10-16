import { BaseComponent } from '@/core/ui/BaseComponent';
import { Window as MovableWindow } from '@/core/ui/Window';

export interface GameMenuOptions {
	title: string;
	message: string;
	actionLabel: string;
	helpTitle: string;
	helpContent: string;
	onAction: () => void;
}

export class GameMenuScreen extends BaseComponent<Record<string, never>> {
	private readonly helpWindow: MovableWindow;

	public constructor(private readonly options: GameMenuOptions) {
		super({});
		this.helpWindow = new MovableWindow({
			title: options.helpTitle,
			content: options.helpContent,
			width: 360,
		});
	}

	protected render(): HTMLElement {
		const screen = document.createElement('main');
		screen.className = 'sim-ui-game-menu';

		const card = document.createElement('section');
		card.className = 'sim-ui-screen-card sim-ui-game-menu-card';

		const eyebrow = document.createElement('p');
		eyebrow.className = 'sim-ui-eyebrow';
		eyebrow.textContent = 'Mission Control';

		const title = document.createElement('h1');
		title.className = 'sim-ui-screen-title';
		title.textContent = this.options.title;

		const message = document.createElement('p');
		message.className = 'sim-ui-screen-copy';
		message.textContent = this.options.message;

		const actions = document.createElement('div');
		actions.className = 'sim-ui-game-menu-actions';

		const actionButton = document.createElement('button');
		actionButton.className = 'sim-ui-button sim-ui-button-primary';
		actionButton.type = 'button';
		actionButton.textContent = this.options.actionLabel;
		actionButton.addEventListener('click', this.options.onAction);

		const helpButton = document.createElement('button');
		helpButton.className = 'sim-ui-button';
		helpButton.type = 'button';
		helpButton.textContent = 'Controls & briefing';
		helpButton.addEventListener('click', () => this.helpWindow.open());

		actions.append(actionButton, helpButton);
		card.append(eyebrow, title, message, actions);
		screen.append(card);
		return screen;
	}

	protected onUnmount(): void {
		this.helpWindow.close();
	}
}
