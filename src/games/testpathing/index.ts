import { engine } from '@/core/engine';
import { CORE_EVENTS } from '@/core/events';
import { DrawingContext } from '@/core/common/display/DrawingContext';
import { SubscriptionsHolder } from '@/core/common/SubscriptionsHolder';
import { GameModule, IBot2d, IGridMap } from '@/core/types';
import { AStarPathfinder, GridPosition } from '@/core/engines/Pathfinder';

interface Bot extends IBot2d {
	x: number;
	y: number;
	start: GridPosition;
	goal: GridPosition;
	path: GridPosition[];
	pathIndex: number;
	color: string;
	speed: number;
}

interface ClickPayload {
	mouseCords: {
		mouseX: number;
		mouseY: number;
	};
}

class MutableGridMap implements IGridMap {
	private readonly blocked: boolean[][];

	public constructor(public readonly width: number, public readonly height: number) {
		this.blocked = Array.from({ length: height }, () => Array(width).fill(false));
	}

	public isValidPosition(x: number, y: number): boolean {
		return Number.isInteger(x) && Number.isInteger(y)
			&& x >= 0 && x < this.width && y >= 0 && y < this.height;
	}

	public isWalkable(x: number, y: number, _bot?: IBot2d): boolean {
		return this.isValidPosition(x, y) && !this.blocked[y][x];
	}

	public getTileCost(x: number, y: number): number {
		return this.isWalkable(x, y) ? 1 : Number.POSITIVE_INFINITY;
	}

	public getWidth(): number {
		return this.width;
	}

	public getHeight(): number {
		return this.height;
	}

	public setWall(x: number, y: number, wall: boolean): void {
		if (this.isValidPosition(x, y)) this.blocked[y][x] = wall;
	}

	public hasWall(x: number, y: number): boolean {
		return this.isValidPosition(x, y) && this.blocked[y][x];
	}
}

const COLS = 18;
const ROWS = 10;
const CELL_SIZE = 46;
const BOARD_X = 36;
const BOARD_Y = 92;
const BOARD_WIDTH = COLS * CELL_SIZE;
const BOARD_HEIGHT = ROWS * CELL_SIZE;

export class TestPathingGame implements GameModule {
	public id = 'test-pathing';

	private readonly subscriptions = new SubscriptionsHolder();
	private readonly map = new MutableGridMap(COLS, ROWS);
	private readonly pathfinder = new AStarPathfinder({ allowDiagonal: false });
	private bots: Bot[] = [];

	public init(): void {
		this.subscriptions.add(engine.bus.subscribe(CORE_EVENTS.MOUSE_LEFT_CLICK, (data) => this.addWall(data as ClickPayload)));
		this.createBots();
	}

	public update(deltaTime: number): void {
		const dt = Math.min(deltaTime, 0.05);
		for (const bot of this.bots) this.moveBot(bot, dt);
	}

	public render(dc: DrawingContext): void {
		const background = dc.cc.canvasBG1Ctx;
		const game = dc.cc.canvasGame1Ctx;
		const hud = dc.cc.canvasHUD1Ctx;

		background.fillStyle = '#101923';
		background.fillRect(0, 0, BOARD_X + BOARD_WIDTH + 36, BOARD_Y + BOARD_HEIGHT + 32);
		this.drawGrid(background);
		this.drawPaths(game);
		this.drawBots(game);

		hud.fillStyle = '#d6e4ed';
		hud.font = 'bold 20px Georgia, serif';
		hud.fillText('PATHFINDER FIELD', BOARD_X, 42);
		hud.font = '14px Georgia, serif';
		hud.fillStyle = '#8ea6b7';
		hud.fillText('Click an open tile to place a wall. Bots recalculate their routes.', BOARD_X, 66);
	}

	public destroy(): void {
		this.subscriptions.destroy();
		this.bots = [];
	}

	private createBots(): void {
		const definitions = [
			{ start: { x: 0, y: 0 }, goal: { x: 17, y: 9 }, color: '#f8c15c', speed: 2.3 },
			{ start: { x: 17, y: 0 }, goal: { x: 0, y: 9 }, color: '#62d6c5', speed: 2.0 },
			{ start: { x: 0, y: 9 }, goal: { x: 17, y: 0 }, color: '#f47f9b', speed: 1.8 },
		];

		this.bots = definitions.map((definition, index) => {
			const bot: Bot = {
				id: `bot-${index + 1}`,
				team: 'scout',
				x: definition.start.x,
				y: definition.start.y,
				start: definition.start,
				goal: definition.goal,
				path: [],
				pathIndex: 0,
				color: definition.color,
				speed: definition.speed,
			};
			this.refreshPath(bot);
			return bot;
		});
	}

	private addWall(data: ClickPayload): void {
		const x = Math.floor((data.mouseCords.mouseX - BOARD_X) / CELL_SIZE);
		const y = Math.floor((data.mouseCords.mouseY - BOARD_Y) / CELL_SIZE);
		if (!this.map.isValidPosition(x, y) || this.map.hasWall(x, y) || this.isBotTile(x, y)) return;
		if (this.bots.some((bot) => (bot.goal.x === x && bot.goal.y === y) || (bot.start.x === x && bot.start.y === y))) return;

		this.map.setWall(x, y, true);
		for (const bot of this.bots) this.refreshPath(bot);
	}

	private refreshPath(bot: Bot): void {
		const current = { x: Math.round(bot.x), y: Math.round(bot.y) };
		bot.path = this.pathfinder.findPath(this.map, current, bot.goal, bot) ?? [];
		bot.pathIndex = bot.path.length > 1 ? 1 : 0;
	}

	private moveBot(bot: Bot, deltaTime: number): void {
		if (bot.path.length === 0) return;
		const next = bot.path[bot.pathIndex];
		if (!next) {
			bot.x = bot.goal.x;
			bot.y = bot.goal.y;
			return;
		}

		const distanceX = next.x - bot.x;
		const distanceY = next.y - bot.y;
		const distance = Math.hypot(distanceX, distanceY);
		const step = bot.speed * deltaTime;
		if (distance <= step) {
			bot.x = next.x;
			bot.y = next.y;
			bot.pathIndex += 1;
			if (bot.pathIndex >= bot.path.length) {
				const oldStart = bot.start;
				bot.start = bot.goal;
				bot.goal = oldStart;
				this.refreshPath(bot);
			}
			return;
		}

		bot.x += (distanceX / distance) * step;
		bot.y += (distanceY / distance) * step;
	}

	private isBotTile(x: number, y: number): boolean {
		return this.bots.some((bot) => Math.round(bot.x) === x && Math.round(bot.y) === y);
	}

	private drawGrid(context: CanvasRenderingContext2D): void {
		context.fillStyle = '#172632';
		context.fillRect(BOARD_X, BOARD_Y, BOARD_WIDTH, BOARD_HEIGHT);
		for (let y = 0; y < ROWS; y += 1) {
			for (let x = 0; x < COLS; x += 1) {
				const left = BOARD_X + x * CELL_SIZE;
				const top = BOARD_Y + y * CELL_SIZE;
				context.strokeStyle = '#29404c';
				context.strokeRect(left, top, CELL_SIZE, CELL_SIZE);
				if (this.map.hasWall(x, y)) {
					context.fillStyle = '#51616a';
					context.fillRect(left + 3, top + 3, CELL_SIZE - 6, CELL_SIZE - 6);
					context.strokeStyle = '#7e919a';
					context.beginPath();
					context.moveTo(left + 8, top + CELL_SIZE - 8);
					context.lineTo(left + CELL_SIZE - 8, top + 8);
					context.stroke();
				}
			}
		}
	}

	private drawPaths(context: CanvasRenderingContext2D): void {
		for (const bot of this.bots) {
			if (bot.path.length < 2) continue;
			context.strokeStyle = `${bot.color}66`;
			context.lineWidth = 2;
			context.beginPath();
			context.moveTo(BOARD_X + (bot.x + 0.5) * CELL_SIZE, BOARD_Y + (bot.y + 0.5) * CELL_SIZE);
			for (let index = bot.pathIndex; index < bot.path.length; index += 1) {
				const point = bot.path[index];
				context.lineTo(BOARD_X + (point.x + 0.5) * CELL_SIZE, BOARD_Y + (point.y + 0.5) * CELL_SIZE);
			}
			context.stroke();
		}
		context.lineWidth = 1;
	}

	private drawBots(context: CanvasRenderingContext2D): void {
		for (const bot of this.bots) {
			const centerX = BOARD_X + (bot.x + 0.5) * CELL_SIZE;
			const centerY = BOARD_Y + (bot.y + 0.5) * CELL_SIZE;
			context.fillStyle = bot.color;
			context.beginPath();
			context.arc(centerX, centerY, 11, 0, Math.PI * 2);
			context.fill();
			context.fillStyle = '#172632';
			context.beginPath();
			context.arc(centerX - 4, centerY - 2, 2, 0, Math.PI * 2);
			context.arc(centerX + 4, centerY - 2, 2, 0, Math.PI * 2);
			context.fill();
		}
	}
}

export default TestPathingGame;
