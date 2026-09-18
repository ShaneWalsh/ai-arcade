import { engine } from '@/core/engine';
import { CORE_EVENTS, KeyboardEventPayload } from '@/core/events';
import { SubscriptionsHolder } from '@/core/common/SubscriptionsHolder';
import { DrawingContext } from '@/core/common/display/DrawingContext';
import { GameModule } from '@/core/types';

type GameState = 'title' | 'playing' | 'level-complete' | 'victory' | 'game-over';
type Terrain = 'grass' | 'road' | 'water' | 'rock' | 'base';
type TurretType = 'machine' | 'cannon' | 'missile' | 'power';
type AlienType = 'basic' | 'fast' | 'heavy';

interface Point { col: number; row: number; }
interface Alien { x: number; y: number; pathIndex: number; hp: number; maxHp: number; speed: number; type: AlienType; reward: number; }
interface Turret { col: number; row: number; type: TurretType; level: number; cooldown: number; angle: number; target?: Alien; }
interface Shot { x: number; y: number; target: Alien; damage: number; kind: TurretType; speed: number; }

const COLS = 12;
const ROWS = 8;
const MAX_LEVEL = 2;
const GAME_WIDTH = 900;
const GAME_HEIGHT = 620;
const TURRET_COSTS: Record<TurretType, number> = { machine: 80, cannon: 130, missile: 180, power: 60 };
const TURRET_LABELS: Record<TurretType, string> = { machine: 'MG', cannon: 'CANNON', missile: 'MISSILE', power: 'POWER' };

export class MissileStormTowerDefenceGame implements GameModule {
	public id = 'missile-storm-tower-defence';

	private subscriptions = new SubscriptionsHolder();
	private state: GameState = 'title';
	private level = 1;
	private wave = 0;
	private waveTimer = 0;
	private spawnTimer = 0;
	private waveEnemies = 0;
	private spawned = 0;
	private defeated = 0;
	private money = 420;
	private power = 5;
	private maxPower = 5;
	private baseHealth = 100;
	private width = GAME_WIDTH;
	private height = GAME_HEIGHT;
	private boardX = 30;
	private boardY = 96;
	private cell = 58;
	private selectedType: TurretType = 'machine';
	private selectedTurret?: Turret;
	private hover?: Point;
	private path: Point[] = [];
	private aliens: Alien[] = [];
	private turrets: Turret[] = [];
	private shots: Shot[] = [];

	public init(): void {
		this.subscriptions.add(engine.bus.subscribe(CORE_EVENTS.KEY_DOWN, (data) => this.onKeyDown(data as KeyboardEventPayload)));
		this.subscriptions.add(engine.bus.subscribe(CORE_EVENTS.MOUSE_LEFT_CLICK, (data) => this.onClick(data)));
	}

	public update(deltaTime: number): void {
		if (this.state !== 'playing') return;
		const dt = Math.min(deltaTime, 0.05);
		this.waveTimer += dt;
		this.updateWave(dt);
		this.updateAliens(dt);
		this.updateTurrets(dt);
		this.updateShots(dt);
		if (this.baseHealth <= 0) this.state = 'game-over';
		if (this.defeated >= this.waveEnemies && this.spawned >= this.waveEnemies && this.aliens.length === 0 && this.shots.length === 0) {
			if (this.wave >= 3) {
				if (this.level >= MAX_LEVEL) this.state = 'victory';
				else this.state = 'level-complete';
			} else if (this.waveTimer > 1.4) this.startWave(this.wave + 1);
		}
	}

	public render(dc: DrawingContext): void {
		this.resize(dc);
		const background = dc.cc.canvasBG1Ctx;
		const game = dc.cc.canvasGame1Ctx;
		const effects = dc.cc.canvasGame2Ctx;
		const hud = dc.cc.canvasHUD1Ctx;
		const overlay = dc.cc.canvasHUD2Ctx;
		background.fillStyle = '#09131f';
		background.fillRect(0, 0, this.width, this.height);
		this.drawBackdrop(background);
		this.drawTerrain(background);
		this.drawTurrets(game);
		this.drawAliens(game);
		this.drawShots(effects);
		this.drawHud(hud);
		if (this.state !== 'playing') this.drawOverlay(overlay);
	}

	public destroy(): void {
		this.subscriptions.destroy();
		this.aliens = [];
		this.turrets = [];
		this.shots = [];
	}

	private onKeyDown(data: KeyboardEventPayload): void {
		const code = data.code;
		if (code === 'Enter' && this.state === 'level-complete') this.advanceLevel();
		else if (code === 'Enter' && this.state !== 'playing') this.startGame();
		if (code === 'KeyR') this.startGame();
		if (code === 'Digit1') this.selectedType = 'machine';
		if (code === 'Digit2') this.selectedType = 'cannon';
		if (code === 'Digit3') this.selectedType = 'missile';
		if (code === 'Digit4') this.selectedType = 'power';
		if (code === 'KeyU' && this.selectedTurret) this.upgrade(this.selectedTurret);
		if (data.event) data.event.preventDefault();
	}

	private onClick(data: any): void {
		const mouse = data?.mouseCords;
		if (!mouse) return;
		const point = this.pointAt(mouse.mouseX, mouse.mouseY);
		if (!point || this.state !== 'playing') return;
		const existing = this.turrets.find((turret) => turret.col === point.col && turret.row === point.row);
		if (existing) {
			this.selectedTurret = existing;
			return;
		}
		if (this.terrainAt(point.col, point.row) !== 'grass') return;
		const cost = TURRET_COSTS[this.selectedType];
		if (this.money < cost || (this.selectedType !== 'power' && this.power < 1)) return;
		this.money -= cost;
		if (this.selectedType !== 'power') this.power -= 1;
		this.turrets.push({ col: point.col, row: point.row, type: this.selectedType, level: 1, cooldown: 0, angle: 0 });
		this.selectedTurret = this.turrets[this.turrets.length - 1];
		if (this.selectedType === 'power') this.maxPower += 3;
	}

	private startGame(): void {
		this.state = 'playing';
		this.level = 1;
		this.money = 420;
		this.power = 5;
		this.maxPower = 5;
		this.baseHealth = 100;
		this.turrets = [];
		this.aliens = [];
		this.shots = [];
		this.selectedTurret = undefined;
		this.setPath();
		this.startWave(1);
	}

	private advanceLevel(): void {
		this.level += 1;
		this.state = 'playing';
		this.setPath();
		this.startWave(1);
	}

	private startWave(wave: number): void {
		this.wave = wave;
		this.waveTimer = 0;
		this.spawnTimer = 0;
		this.spawned = 0;
		this.defeated = 0;
		this.waveEnemies = 5 + this.level * 2 + wave * 2;
		this.aliens = [];
		this.shots = [];
	}

	private updateWave(dt: number): void {
		if (this.spawned >= this.waveEnemies) return;
		this.spawnTimer -= dt;
		if (this.spawnTimer > 0) return;
		const roll = this.spawned % 7;
		const type: AlienType = this.wave > 1 && roll === 0 ? 'heavy' : this.wave > 1 && roll % 3 === 0 ? 'fast' : 'basic';
		const hp = type === 'heavy' ? 90 + this.level * 25 : type === 'fast' ? 32 + this.level * 8 : 48 + this.level * 12;
		const speed = type === 'heavy' ? 24 : type === 'fast' ? 70 : 42;
		this.aliens.push({ x: this.cellCenter(this.path[0]).x, y: this.cellCenter(this.path[0]).y, pathIndex: 0, hp, maxHp: hp, speed, type, reward: type === 'heavy' ? 55 : type === 'fast' ? 24 : 16 });
		this.spawned += 1;
		this.spawnTimer = Math.max(0.35, 0.95 - this.wave * 0.08);
	}

	private updateAliens(dt: number): void {
		for (const alien of this.aliens) {
			const next = this.path[Math.min(alien.pathIndex + 1, this.path.length - 1)];
			const target = this.cellCenter(next);
			const distance = Math.hypot(target.x - alien.x, target.y - alien.y);
			const step = alien.speed * this.terrainSpeed(alien) * dt;
			if (distance <= step) {
				alien.x = target.x;
				alien.y = target.y;
				alien.pathIndex += 1;
				if (alien.pathIndex >= this.path.length - 1) {
					alien.hp = 0;
					this.baseHealth -= alien.type === 'heavy' ? 18 : alien.type === 'fast' ? 7 : 10;
				}
			} else {
				alien.x += ((target.x - alien.x) / distance) * step;
				alien.y += ((target.y - alien.y) / distance) * step;
			}
		}
		this.aliens = this.aliens.filter((alien) => {
			if (alien.hp > 0) return true;
			if (alien.pathIndex < this.path.length - 1) {
				this.money += alien.reward;
				this.defeated += 1;
			}
			return false;
		});
	}

	private updateTurrets(dt: number): void {
		for (const turret of this.turrets) {
			if (turret.type === 'power') continue;
			turret.cooldown -= dt;
			const origin = this.cellCenter(turret);
			const range = this.range(turret);
			turret.target = this.aliens.filter((alien) => Math.hypot(alien.x - origin.x, alien.y - origin.y) <= range).sort((a, b) => b.pathIndex - a.pathIndex)[0];
			if (!turret.target) continue;
			turret.angle = Math.atan2(turret.target.y - origin.y, turret.target.x - origin.x);
			if (turret.cooldown <= 0) {
				const damage = turret.type === 'cannon' ? 34 + turret.level * 16 : turret.type === 'missile' ? 20 + turret.level * 10 : 8 + turret.level * 4;
				this.shots.push({ x: origin.x, y: origin.y, target: turret.target, damage, kind: turret.type, speed: turret.type === 'missile' ? 330 : 470 });
				turret.cooldown = (turret.type === 'machine' ? 0.22 : turret.type === 'cannon' ? 1.1 : 0.65) / (1 + (turret.level - 1) * 0.16);
			}
		}
	}

	private updateShots(dt: number): void {
		for (const shot of this.shots) {
			if (!this.aliens.includes(shot.target)) { shot.x = -100; continue; }
			const distance = Math.hypot(shot.target.x - shot.x, shot.target.y - shot.y);
			const step = shot.speed * dt;
			if (distance <= step) {
				shot.target.hp -= shot.damage;
				if (shot.kind === 'missile') {
					for (const alien of this.aliens) if (Math.hypot(alien.x - shot.target.x, alien.y - shot.target.y) < 34) alien.hp -= shot.damage * 0.35;
				}
				shot.x = -100;
			} else {
				shot.x += ((shot.target.x - shot.x) / distance) * step;
				shot.y += ((shot.target.y - shot.y) / distance) * step;
			}
		}
		this.shots = this.shots.filter((shot) => shot.x >= 0);
	}

	private upgrade(turret: Turret): void {
		const cost = 70 * turret.level;
		if (turret.level >= 4 || this.money < cost) return;
		this.money -= cost;
		turret.level += 1;
	}

	private setPath(): void {
		this.path = [];
		const row = this.level === 1 ? 3 : 5;
		if (this.level === 1) for (let col = 0; col < COLS; col += 1) this.path.push({ col, row });
		else {
			for (let col = 0; col < 4; col += 1) this.path.push({ col, row });
			for (let nextRow = row - 1; nextRow >= 2; nextRow -= 1) this.path.push({ col: 3, row: nextRow });
			for (let col = 4; col < COLS; col += 1) this.path.push({ col, row: 2 });
		}
	}

	private terrainAt(col: number, row: number): Terrain {
		if (col === COLS - 1 && row === (this.level === 1 ? 3 : 2)) return 'base';
		if (this.path.some((point) => point.col === col && point.row === row)) return 'road';
		if ((col + row * 3) % 11 === 0 || (this.level === 2 && row === 0 && col > 5)) return 'water';
		if ((col * 5 + row) % 13 === 0) return 'rock';
		return 'grass';
	}

	private terrainSpeed(alien: Alien): number {
		const col = Math.round((alien.x - this.boardX) / this.cell - 0.5);
		const row = Math.round((alien.y - this.boardY) / this.cell - 0.5);
		return this.terrainAt(col, row) === 'road' ? 1 : 0.8;
	}

	private range(turret: Turret): number {
		return (turret.type === 'missile' ? 190 : turret.type === 'cannon' ? 145 : 115) + turret.level * 12;
	}

	private pointAt(x: number, y: number): Point | undefined {
		const col = Math.floor((x - this.boardX) / this.cell);
		const row = Math.floor((y - this.boardY) / this.cell);
		return col >= 0 && col < COLS && row >= 0 && row < ROWS ? { col, row } : undefined;
	}

	private cellCenter(point: Point): { x: number; y: number } {
		return { x: this.boardX + point.col * this.cell + this.cell / 2, y: this.boardY + point.row * this.cell + this.cell / 2 };
	}

	private resize(dc: DrawingContext): void {
		const canvases = [dc.cc.canvasBG1El, dc.cc.canvasBG2El, dc.cc.canvasGame1El, dc.cc.canvasGame2El, dc.cc.canvasHUD1El, dc.cc.canvasHUD2El] as HTMLCanvasElement[];
		for (const canvas of canvases) {
			if (canvas.width !== GAME_WIDTH) canvas.width = GAME_WIDTH;
			if (canvas.height !== GAME_HEIGHT) canvas.height = GAME_HEIGHT;
		}
		this.width = GAME_WIDTH;
		this.height = GAME_HEIGHT;
		this.cell = Math.min(58, (this.width - 60) / COLS, (this.height - 140) / ROWS);
		this.boardX = (this.width - COLS * this.cell) / 2;
		this.boardY = 92;
		this.setPath();
	}

	private drawBackdrop(context: CanvasRenderingContext2D): void {
		context.fillStyle = '#10283a';
		context.fillRect(0, 0, this.width, 72);
		context.fillStyle = '#183c4a';
		for (let index = 0; index < 30; index += 1) context.fillRect((index * 149) % this.width, 76 + ((index * 61) % 55), 2, 2);
	}

	private drawTerrain(context: CanvasRenderingContext2D): void {
		for (let row = 0; row < ROWS; row += 1) for (let col = 0; col < COLS; col += 1) {
			const terrain = this.terrainAt(col, row);
			const x = this.boardX + col * this.cell;
			const y = this.boardY + row * this.cell;
			const colors: Record<Terrain, string> = { grass: '#24464a', road: '#796849', water: '#153d52', rock: '#3d4548', base: '#318078' };
			context.fillStyle = colors[terrain];
			context.fillRect(x + 1, y + 1, this.cell - 2, this.cell - 2);
			context.strokeStyle = '#35605d';
			context.strokeRect(x, y, this.cell, this.cell);
			if (terrain === 'water') { context.fillStyle = '#327087'; context.fillRect(x + 8, y + this.cell / 2, this.cell - 16, 2); }
			if (terrain === 'rock') { context.fillStyle = '#606c6b'; context.fillRect(x + 12, y + 16, 13, 9); context.fillRect(x + 27, y + 26, 10, 8); }
			if (terrain === 'base') { context.fillStyle = '#b6f0d0'; context.fillRect(x + 12, y + 14, this.cell - 24, this.cell - 28); }
		}
		if (this.hover && this.state === 'playing') {
			context.strokeStyle = this.terrainAt(this.hover.col, this.hover.row) === 'grass' ? '#a9f4ca' : '#ff806e';
			context.lineWidth = 2;
			context.strokeRect(this.boardX + this.hover.col * this.cell + 3, this.boardY + this.hover.row * this.cell + 3, this.cell - 6, this.cell - 6);
			context.lineWidth = 1;
		}
	}

	private drawTurrets(context: CanvasRenderingContext2D): void {
		for (const turret of this.turrets) {
			const center = this.cellCenter(turret);
			context.fillStyle = turret.type === 'power' ? '#f2c14e' : turret.type === 'cannon' ? '#f27b50' : turret.type === 'missile' ? '#e88bea' : '#67d5c4';
			context.beginPath(); context.arc(center.x, center.y, this.cell * 0.25 + turret.level * 1.5, 0, Math.PI * 2); context.fill();
			if (turret.type !== 'power') {
				context.save(); context.translate(center.x, center.y); context.rotate(turret.angle); context.fillRect(0, -3, this.cell * 0.34, 6); context.restore();
				if (this.selectedTurret === turret) { context.strokeStyle = '#fff1a8'; context.beginPath(); context.arc(center.x, center.y, this.range(turret), 0, Math.PI * 2); context.stroke(); }
			} else { context.fillStyle = '#20303d'; context.fillRect(center.x - 3, center.y - 12, 6, 24); context.fillRect(center.x - 12, center.y - 3, 24, 6); }
			context.fillStyle = '#f5fff1'; context.font = '10px monospace'; context.textAlign = 'center'; context.fillText(String(turret.level), center.x, center.y + 4); context.textAlign = 'left';
		}
	}

	private drawAliens(context: CanvasRenderingContext2D): void {
		for (const alien of this.aliens) {
			context.fillStyle = alien.type === 'heavy' ? '#7a3d98' : alien.type === 'fast' ? '#c55bd0' : '#9b59b6';
			context.beginPath(); context.arc(alien.x, alien.y, alien.type === 'heavy' ? 15 : 11, 0, Math.PI * 2); context.fill();
			context.fillStyle = '#f1b7ff'; context.fillRect(alien.x - 6, alien.y - 3, 4, 4); context.fillRect(alien.x + 2, alien.y - 3, 4, 4);
			context.fillStyle = '#261b39'; context.fillRect(alien.x - 16, alien.y - 23, 32, 4); context.fillStyle = '#ed718d'; context.fillRect(alien.x - 16, alien.y - 23, 32 * Math.max(0, alien.hp / alien.maxHp), 4);
		}
	}

	private drawShots(context: CanvasRenderingContext2D): void {
		for (const shot of this.shots) { context.fillStyle = shot.kind === 'cannon' ? '#ff9b55' : shot.kind === 'missile' ? '#eea5ff' : '#d9fff3'; context.beginPath(); context.arc(shot.x, shot.y, shot.kind === 'cannon' ? 6 : 3, 0, Math.PI * 2); context.fill(); }
	}

	private drawHud(context: CanvasRenderingContext2D): void {
		context.fillStyle = '#effff5'; context.font = 'bold 16px monospace';
		context.fillText('MISSILE STORM // HUMAN DEFENCE', 22, 28);
		context.font = '14px monospace'; context.fillStyle = '#a9d9cf';
		context.fillText(`BASE ${Math.max(0, this.baseHealth)}%`, 22, 53);
		context.fillText(`POWER ${this.power}/${this.maxPower}`, 180, 53);
		context.fillText(`CREDITS $${this.money}`, 370, 53);
		context.fillText(`LEVEL ${this.level}/${MAX_LEVEL}  WAVE ${Math.min(this.wave, 3)}/3`, this.width - 220, 28);
		context.fillText(`ALIENS ${this.defeated}/${this.waveEnemies}`, this.width - 220, 53);
		context.fillStyle = '#d6e7db'; context.font = '12px monospace';
		context.fillText(`[1] MG $80   [2] CANNON $130   [3] MISSILE $180   [4] POWER $60`, 22, this.height - 30);
		context.fillText(`SELECTED: ${TURRET_LABELS[this.selectedType]}   CLICK: BUILD/SELECT   U: UPGRADE`, 22, this.height - 13);
	}

	private drawOverlay(context: CanvasRenderingContext2D): void {
		context.fillStyle = 'rgba(5, 14, 24, 0.86)'; context.fillRect(0, 0, this.width, this.height);
		context.textAlign = 'center';
		const title = this.state === 'title' ? 'HUMANS VS ALIENS' : this.state === 'level-complete' ? `LEVEL ${this.level} SECURED` : this.state === 'victory' ? 'EARTH HOLDS' : 'BASE OVERRUN';
		context.fillStyle = this.state === 'game-over' ? '#ff806e' : '#b6f0d0'; context.font = 'bold 34px monospace'; context.fillText(title, this.width / 2, this.height / 2 - 45);
		context.fillStyle = '#e4f6e9'; context.font = '15px monospace';
		const message = this.state === 'title' ? 'Build the line. Keep the base alive.' : this.state === 'level-complete' ? 'Press ENTER to deploy on the next level.' : this.state === 'victory' ? 'Two levels defended. Press R to play again.' : 'The last transmission was lost. Press R to restart.';
		context.fillText(message, this.width / 2, this.height / 2 + 5);
		context.fillStyle = '#f2c14e'; context.font = 'bold 18px monospace'; context.fillText(this.state === 'playing' ? '' : 'PRESS ENTER', this.width / 2, this.height / 2 + 52);
		context.textAlign = 'left';
	}
}

export default MissileStormTowerDefenceGame;
