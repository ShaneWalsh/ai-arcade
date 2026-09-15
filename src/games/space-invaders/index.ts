import { GameModule } from '@/core/types';
import { DrawingContext } from '@/core/common/display/DrawingContext';
import { SubscriptionsHolder } from '@/core/common/SubscriptionsHolder';
import { CORE_EVENTS, KeyboardEventPayload } from '@/core/events';

type GameState = 'title' | 'playing' | 'game-over' | 'victory';
type EnemyType = 'basic' | 'armored' | 'hunter';

interface Enemy {
  x: number;
  y: number;
  type: EnemyType;
  hp: number;
  phase: number;
}

interface Projectile {
  x: number;
  y: number;
  velocity: number;
  fromPlayer: boolean;
  width: number;
  height: number;
}

interface ShieldCell {
  x: number;
  y: number;
  hp: number;
}

const MAX_WAVES = 5;
const PLAYER_WIDTH = 42;
const PLAYER_HEIGHT = 22;
const MISSION_NAMES = [
  'Kill 10 enemies',
  'Survive 30 seconds',
  'Kill 5 armored enemies',
  'Destroy 3 hunter bots',
  'Clear the final wave',
];

export class SpaceInvadersGame implements GameModule {
  public id = 'space-invaders';

  private subscriptions = new SubscriptionsHolder();
  private state: GameState = 'title';
  private width = 800;
  private height = 600;
  private playerX = 379;
  private playerLives = 3;
  private playerRespawn = 0;
  private playerInvulnerable = 0;
  private score = 0;
  private wave = 1;
  private waveTime = 0;
  private fireCooldown = 0;
  private enemyFireCooldown = 1.2;
  private formationDirection = 1;
  private formationSpeed = 28;
  private formationDrop = 0;
  private formationShift = 0;
  private missionIndex = 0;
  private missionKills = 0;
  private armoredKills = 0;
  private hunterKills = 0;
  private totalKills = 0;
  private keys = new Set<string>();
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private shields: ShieldCell[] = [];

  public init(): void {
    this.subscriptions.subscribe(CORE_EVENTS.KEY_DOWN, (data) => this.onKeyDown(data as KeyboardEventPayload));
    this.subscriptions.subscribe(CORE_EVENTS.KEY_UP, (data) => this.keys.delete((data as KeyboardEventPayload).code));
  }

  public update(deltaTime: number): void {
    const dt = Math.min(deltaTime, 0.05);
    if (this.state !== 'playing') return;

    this.waveTime += dt;
    this.updateMission();
    this.fireCooldown -= dt;
    this.enemyFireCooldown -= dt;
    this.playerInvulnerable = Math.max(0, this.playerInvulnerable - dt);
    this.updatePlayer(dt);
    this.updateProjectiles(dt);
    this.updateEnemies(dt);
    this.handleCollisions();

    if (this.playerRespawn > 0) {
      this.playerRespawn -= dt;
      if (this.playerRespawn <= 0 && this.playerLives > 0) this.playerInvulnerable = 2;
    }
    if (this.enemies.length === 0) this.advanceWave();
  }

  public render(dc: DrawingContext): void {
    const background = dc.cc.canvasBG1Ctx;
    const game = dc.cc.canvasGame1Ctx;
    const effects = dc.cc.canvasGame2Ctx;
    const hud = dc.cc.canvasHUD1Ctx;
    const overlay = dc.cc.canvasHUD2Ctx;
    this.resizeCanvases(dc);

    background.fillStyle = '#07131f';
    background.fillRect(0, 0, this.width, this.height);
    this.drawStars(background);
    game.clearRect(0, 0, this.width, this.height);
    effects.clearRect(0, 0, this.width, this.height);
    hud.clearRect(0, 0, this.width, this.height);
    overlay.clearRect(0, 0, this.width, this.height);

    if (this.state === 'title') {
      this.drawTitle(overlay);
      return;
    }

    this.drawShields(game);
    this.drawEnemies(game);
    this.drawProjectiles(effects);
    this.drawPlayer(game);
    this.drawHud(hud);

    if (this.state === 'game-over' || this.state === 'victory') this.drawEndScreen(overlay);
  }

  public destroy(): void {
    this.subscriptions.destroy();
    this.keys.clear();
  }

  private onKeyDown(data: KeyboardEventPayload): void {
    this.keys.add(data.code);
    if (data.code === 'Enter' && this.state !== 'playing') this.startGame();
    if ((data.code === 'Space' || data.code === 'KeyZ') && this.state === 'playing') this.fire();
    if (data.event) data.event.preventDefault();
  }

  private startGame(): void {
    this.state = 'playing';
    this.score = 0;
    this.wave = 1;
    this.playerLives = 3;
    this.playerRespawn = 0;
    this.playerInvulnerable = 1.5;
    this.missionIndex = 0;
    this.missionKills = 0;
    this.armoredKills = 0;
    this.hunterKills = 0;
    this.totalKills = 0;
    this.buildWave();
  }

  private buildWave(): void {
    this.waveTime = 0;
    this.formationDirection = 1;
    this.formationShift = 0;
    this.formationDrop = 0;
    this.formationSpeed = 25 + this.wave * 7;
    this.enemyFireCooldown = Math.max(0.45, 1.45 - this.wave * 0.14);
    this.enemies = [];
    const rows = Math.min(4 + Math.floor(this.wave / 2), 6);
    const columns = Math.min(7 + this.wave, 10);
    const gapX = Math.min(65, (this.width - 150) / Math.max(1, columns - 1));
    const startX = (this.width - gapX * (columns - 1)) / 2;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const type: EnemyType = row === 0 && this.wave > 1 ? 'hunter' : row === 1 ? 'armored' : 'basic';
        this.enemies.push({ x: startX + column * gapX, y: 92 + row * 34, type, hp: type === 'armored' ? 2 : 1, phase: column * 0.7 + row });
      }
    }
    this.shields = [];
    const shieldCount = 3;
    for (let shield = 0; shield < shieldCount; shield += 1) {
      const shieldX = 145 + shield * ((this.width - 290) / (shieldCount - 1));
      for (let row = 0; row < 3; row += 1) {
        for (let column = 0; column < 5; column += 1) {
          if (row === 0 && (column === 0 || column === 4)) continue;
          if (row === 2 && column === 2) continue;
          this.shields.push({ x: shieldX - 28 + column * 14, y: this.height - 170 + row * 14, hp: 3 });
        }
      }
    }
  }

  private updatePlayer(dt: number): void {
    if (this.playerRespawn > 0) return;
    const movingLeft = this.keys.has('ArrowLeft') || this.keys.has('KeyA');
    const movingRight = this.keys.has('ArrowRight') || this.keys.has('KeyD');
    if (movingLeft) this.playerX -= 310 * dt;
    if (movingRight) this.playerX += 310 * dt;
    this.playerX = Math.max(18, Math.min(this.width - PLAYER_WIDTH - 18, this.playerX));
    if (this.keys.has('Space') || this.keys.has('KeyZ')) this.fire();
  }

  private fire(): void {
    if (this.fireCooldown > 0 || this.playerRespawn > 0) return;
    this.projectiles.push({ x: this.playerX + PLAYER_WIDTH / 2 - 2, y: this.height - 74, velocity: -470, fromPlayer: true, width: 4, height: 14 });
    this.fireCooldown = 0.24;
  }

  private updateProjectiles(dt: number): void {
    for (const projectile of this.projectiles) projectile.y += projectile.velocity * dt;
    this.projectiles = this.projectiles.filter((projectile) => projectile.y > -24 && projectile.y < this.height + 24);
  }

  private updateEnemies(dt: number): void {
    const edge = this.enemies.some((enemy) => enemy.x + this.formationShift < 22 || enemy.x + this.formationShift > this.width - 42);
    if (edge) {
      this.formationDirection *= -1;
      this.formationDrop += 17;
    }
    this.formationShift += this.formationDirection * this.formationSpeed * dt;
    for (const enemy of this.enemies) {
      if (enemy.type === 'hunter') enemy.x += Math.sin(this.waveTime * 2.2 + enemy.phase) * 9 * dt;
    }
    if (this.enemyFireCooldown <= 0 && this.enemies.length > 0) {
      const shooter = this.enemies[Math.floor(Math.random() * this.enemies.length)];
      this.projectiles.push({ x: shooter.x + this.formationShift, y: shooter.y + this.formationDrop + 17, velocity: 175 + this.wave * 12, fromPlayer: false, width: 4, height: 12 });
      this.enemyFireCooldown = Math.max(0.4, 1.35 - this.wave * 0.12) + Math.random() * 0.7;
    }
    if (this.enemies.some((enemy) => enemy.y + this.formationDrop > this.height - 205)) this.loseLife();
  }

  private handleCollisions(): void {
    for (const projectile of this.projectiles) {
      if (!projectile.fromPlayer && this.playerRespawn <= 0 && this.playerInvulnerable <= 0 && this.overlaps(projectile.x, projectile.y, projectile.width, projectile.height, this.playerX, this.height - 70, PLAYER_WIDTH, PLAYER_HEIGHT)) {
        projectile.y = this.height + 30;
        this.loseLife();
      }
      for (const shield of this.shields) {
        if (this.overlaps(projectile.x, projectile.y, projectile.width, projectile.height, shield.x, shield.y, 12, 12)) {
          shield.hp -= 1;
          projectile.y = this.height + 30;
          break;
        }
      }
      if (!projectile.fromPlayer) continue;
      for (const enemy of this.enemies) {
        const enemyX = enemy.x + this.formationShift;
        const enemyY = enemy.y + this.formationDrop;
        if (this.overlaps(projectile.x, projectile.y, projectile.width, projectile.height, enemyX - 12, enemyY - 10, 24, 20)) {
          projectile.y = -30;
          enemy.hp -= 1;
          if (enemy.hp <= 0) this.destroyEnemy(enemy);
          break;
        }
      }
    }
    this.shields = this.shields.filter((shield) => shield.hp > 0);
    this.projectiles = this.projectiles.filter((projectile) => projectile.y > -24 && projectile.y < this.height + 24);
  }

  private destroyEnemy(enemy: Enemy): void {
    this.enemies = this.enemies.filter((candidate) => candidate !== enemy);
    this.score += enemy.type === 'armored' ? 30 : enemy.type === 'hunter' ? 50 : 10;
    this.totalKills += 1;
    this.missionKills += 1;
    if (enemy.type === 'armored') this.armoredKills += 1;
    if (enemy.type === 'hunter') this.hunterKills += 1;
    this.updateMission();
  }

  private updateMission(): void {
    const missionComplete = this.missionIndex === 0 && this.totalKills >= 10
      || this.missionIndex === 1 && this.waveTime >= 30
      || this.missionIndex === 2 && this.armoredKills >= 5
      || this.missionIndex === 3 && this.hunterKills >= 3
      || this.missionIndex === 4 && this.wave > MAX_WAVES;
    if (missionComplete) this.missionIndex = Math.min(MISSION_NAMES.length - 1, this.missionIndex + 1);
  }

  private advanceWave(): void {
    if (this.wave >= MAX_WAVES) {
      this.missionIndex = MISSION_NAMES.length - 1;
      this.state = 'victory';
      return;
    }
    this.wave += 1;
    this.buildWave();
  }

  private loseLife(): void {
    if (this.playerRespawn > 0 || this.playerInvulnerable > 0) return;
    this.playerLives -= 1;
    this.playerRespawn = 1.2;
    this.projectiles = this.projectiles.filter((projectile) => projectile.fromPlayer);
    if (this.playerLives <= 0) this.state = 'game-over';
  }

  private resizeCanvases(dc: DrawingContext): void {
    const canvas = dc.cc.canvasGame1El as HTMLCanvasElement;
    const nextWidth = Math.max(640, Math.min(960, window.innerWidth));
    const nextHeight = Math.max(480, Math.min(720, window.innerHeight));
    if (canvas.width === nextWidth && canvas.height === nextHeight) return;
    this.width = nextWidth;
    this.height = nextHeight;
    const canvases = [dc.cc.canvasBG1El, dc.cc.canvasBG2El, dc.cc.canvasGame1El, dc.cc.canvasGame2El, dc.cc.canvasHUD1El, dc.cc.canvasHUD2El];
    canvases.forEach((layer) => { layer.width = this.width; layer.height = this.height; });
    this.playerX = this.width / 2 - PLAYER_WIDTH / 2;
    if (this.state === 'playing') this.buildWave();
  }

  private drawStars(context: CanvasRenderingContext2D): void {
    context.fillStyle = '#173047';
    for (let index = 0; index < 42; index += 1) {
      const x = (index * 193) % this.width;
      const y = (index * 97) % this.height;
      context.fillRect(x, y, index % 3 === 0 ? 2 : 1, index % 3 === 0 ? 2 : 1);
    }
  }

  private drawPlayer(context: CanvasRenderingContext2D): void {
    if (this.playerRespawn > 0 || (this.playerInvulnerable > 0 && Math.floor(this.playerInvulnerable * 8) % 2 === 0)) return;
    const y = this.height - 70;
    context.fillStyle = '#54e6c4';
    context.beginPath();
    context.moveTo(this.playerX + PLAYER_WIDTH / 2, y - 7);
    context.lineTo(this.playerX + PLAYER_WIDTH, y + PLAYER_HEIGHT);
    context.lineTo(this.playerX, y + PLAYER_HEIGHT);
    context.closePath();
    context.fill();
    context.fillStyle = '#d8fff4';
    context.fillRect(this.playerX + 18, y + 6, 6, 10);
  }

  private drawEnemies(context: CanvasRenderingContext2D): void {
    for (const enemy of this.enemies) {
      const x = enemy.x + this.formationShift;
      const y = enemy.y + this.formationDrop;
      context.fillStyle = enemy.type === 'hunter' ? '#ff668c' : enemy.type === 'armored' ? '#ffc857' : '#67a9ff';
      context.fillRect(x - 12, y - 8, 24, 16);
      context.fillRect(x - 8, y - 12, 16, 24);
      context.fillStyle = '#07131f';
      context.fillRect(x - 7, y - 3, 4, 4);
      context.fillRect(x + 3, y - 3, 4, 4);
      if (enemy.type === 'armored') {
        context.strokeStyle = '#fff0b3';
        context.strokeRect(x - 14, y - 10, 28, 20);
      }
    }
  }

  private drawProjectiles(context: CanvasRenderingContext2D): void {
    for (const projectile of this.projectiles) {
      context.fillStyle = projectile.fromPlayer ? '#f7ff83' : '#ff756b';
      context.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
    }
  }

  private drawShields(context: CanvasRenderingContext2D): void {
    context.fillStyle = '#4bd1a0';
    for (const shield of this.shields) {
      context.globalAlpha = shield.hp / 3;
      context.fillRect(shield.x, shield.y, 12, 12);
    }
    context.globalAlpha = 1;
  }

  private drawHud(context: CanvasRenderingContext2D): void {
    context.fillStyle = '#d8fff4';
    context.font = '16px monospace';
    context.fillText(`SCORE ${String(this.score).padStart(5, '0')}`, 20, 28);
    context.fillText(`LIVES ${this.playerLives}`, this.width / 2 - 42, 28);
    context.fillText(`WAVE ${this.wave}/${MAX_WAVES}`, this.width - 145, 28);
    const progress = this.getMissionProgress();
    context.fillStyle = '#8aa6b8';
    context.font = '13px monospace';
    context.fillText(`MISSION ${this.missionIndex + 1}: ${MISSION_NAMES[this.missionIndex]}  [${progress}]`, 20, this.height - 18);
  }

  private getMissionProgress(): string {
    if (this.missionIndex === 0) return `${Math.min(this.totalKills, 10)}/10`;
    if (this.missionIndex === 1) return `${Math.min(Math.floor(this.waveTime), 30)}/30s`;
    if (this.missionIndex === 2) return `${Math.min(this.armoredKills, 5)}/5`;
    if (this.missionIndex === 3) return `${Math.min(this.hunterKills, 3)}/3`;
    return this.wave >= MAX_WAVES && this.state === 'victory' ? 'CLEAR' : `${Math.min(this.wave - 1, MAX_WAVES)}/${MAX_WAVES}`;
  }

  private drawTitle(context: CanvasRenderingContext2D): void {
    this.drawPanel(context, 'STARFALL // INVASION');
    context.fillStyle = '#d8fff4';
    context.font = '18px monospace';
    context.textAlign = 'center';
    context.fillText('A SMALL SHIP. FIVE WAVES. NO SECOND CHANCES.', this.width / 2, this.height / 2 - 40);
    context.fillStyle = '#54e6c4';
    context.font = 'bold 22px monospace';
    context.fillText('PRESS ENTER TO DEPLOY', this.width / 2, this.height / 2 + 34);
    context.font = '13px monospace';
    context.fillStyle = '#8aa6b8';
    context.fillText('ARROW KEYS / A D TO MOVE    SPACE / Z TO FIRE', this.width / 2, this.height / 2 + 70);
    context.textAlign = 'left';
  }

  private drawEndScreen(context: CanvasRenderingContext2D): void {
    this.drawPanel(context, this.state === 'victory' ? 'SECTOR SECURED' : 'SIGNAL LOST');
    context.fillStyle = this.state === 'victory' ? '#54e6c4' : '#ff756b';
    context.font = 'bold 22px monospace';
    context.textAlign = 'center';
    context.fillText(`FINAL SCORE ${this.score}`, this.width / 2, this.height / 2 + 8);
    context.font = '16px monospace';
    context.fillText('PRESS ENTER TO RESTART', this.width / 2, this.height / 2 + 52);
    context.textAlign = 'left';
  }

  private drawPanel(context: CanvasRenderingContext2D, title: string): void {
    context.fillStyle = 'rgba(4, 12, 20, 0.88)';
    context.fillRect(0, 0, this.width, this.height);
    context.strokeStyle = '#54e6c4';
    context.lineWidth = 2;
    context.strokeRect(this.width / 2 - 275, this.height / 2 - 120, 550, 260);
    context.fillStyle = '#54e6c4';
    context.font = 'bold 38px monospace';
    context.textAlign = 'center';
    context.fillText(title, this.width / 2, this.height / 2 - 78);
    context.textAlign = 'left';
  }

  private overlaps(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number): boolean {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
}