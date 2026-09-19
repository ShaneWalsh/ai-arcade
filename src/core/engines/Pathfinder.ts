import { IBot2d, IGridMap } from "../types";


export class DefaultBot2d implements IBot2d {
	public constructor(
		public readonly id: string = "default-bot",
		public readonly radius?: number,
		public readonly team: string = "neutral",
	) {}
}


/**
 * A simple grid map for tests and small games.
 * Boolean cells represent walkability; numeric cells represent tile costs.
 * Numeric values greater than zero are walkable and zero/Infinity are blocked.
 */
export class DefaultGridMap implements IGridMap {
	private readonly matrix: ReadonlyArray<ReadonlyArray<number | boolean>>;

	public constructor(matrix: ReadonlyArray<ReadonlyArray<number | boolean>>) {
		if (matrix.length > 0 && matrix.some((row) => row.length !== matrix[0].length)) {
			throw new Error("DefaultGridMap requires a rectangular matrix.");
		}

		this.matrix = matrix;
	}

	public isValidPosition(x: number, y: number): boolean {
		return Number.isInteger(x) && Number.isInteger(y)
			&& y >= 0
			&& y < this.getHeight()
			&& x >= 0
			&& x < this.getWidth();
	}

	public isWalkable(x: number, y: number, _bot?: IBot2d): boolean {
		if (!this.isValidPosition(x, y)) {
			return false;
		}

		const cell = this.matrix[y][x];
		return typeof cell === "boolean" ? cell : Number.isFinite(cell) && cell > 0;
	}

	public getTileCost(x: number, y: number): number {
		if (!this.isValidPosition(x, y)) {
			return Number.POSITIVE_INFINITY;
		}

		const cell = this.matrix[y][x];
		if (typeof cell === "boolean") {
			return cell ? 1 : Number.POSITIVE_INFINITY;
		}

		return cell;
	}

	public getWidth(): number {
		return this.matrix.length === 0 ? 0 : this.matrix[0].length;
	}

	public getHeight(): number {
		return this.matrix.length;
	}
}

export interface MovementCosts {
	orthogonal: number;
	diagonal: number;
}

export interface GridPosition {
	x: number;
	y: number;
}

export interface AStarPathfinderOptions {
	allowDiagonal?: boolean;
	allowCornerCutting?: boolean;
	movementCosts?: Partial<MovementCosts>;
}

interface PathNode extends GridPosition {
	g: number;
	f: number;
	parent?: PathNode;
}

class MinHeap {
	private readonly items: PathNode[] = [];

	public get size(): number {
		return this.items.length;
	}

	public push(node: PathNode): void {
		this.items.push(node);
		this.bubbleUp(this.items.length - 1);
	}

	public pop(): PathNode | undefined {
		if (this.items.length === 0) {
			return undefined;
		}

		const first = this.items[0];
		const last = this.items.pop();
		if (this.items.length > 0 && last) {
			this.items[0] = last;
			this.bubbleDown(0);
		}

		return first;
	}

	private bubbleUp(index: number): void {
		while (index > 0) {
			const parentIndex = Math.floor((index - 1) / 2);
			if (this.items[parentIndex].f <= this.items[index].f) {
				break;
			}

			[this.items[parentIndex], this.items[index]] = [this.items[index], this.items[parentIndex]];
			index = parentIndex;
		}
	}

	private bubbleDown(index: number): void {
		while (true) {
			const leftIndex = index * 2 + 1;
			const rightIndex = leftIndex + 1;
			let smallestIndex = index;

			if (leftIndex < this.items.length && this.items[leftIndex].f < this.items[smallestIndex].f) {
				smallestIndex = leftIndex;
			}
			if (rightIndex < this.items.length && this.items[rightIndex].f < this.items[smallestIndex].f) {
				smallestIndex = rightIndex;
			}
			if (smallestIndex === index) {
				break;
			}

			[this.items[index], this.items[smallestIndex]] = [this.items[smallestIndex], this.items[index]];
			index = smallestIndex;
		}
	}
}

export class AStarPathfinder {
	public  allowDiagonal: boolean;
	public  allowCornerCutting: boolean;
	public  movementCosts: MovementCosts;

	public constructor(options: AStarPathfinderOptions = {}) {
		this.allowDiagonal = options.allowDiagonal ?? false;
		this.allowCornerCutting = options.allowCornerCutting ?? false;
		this.movementCosts = {
			orthogonal: options.movementCosts?.orthogonal ?? 1,
			diagonal: options.movementCosts?.diagonal ?? Math.SQRT2,
		};

		if (this.movementCosts.orthogonal <= 0 || this.movementCosts.diagonal <= 0) {
			throw new Error("Movement costs must be greater than zero.");
		}
	}

	public findPath(
		map: IGridMap,
		start: GridPosition,
		goal: GridPosition,
		bot?: IBot2d,
	): Array<GridPosition> | null {
		if (!this.canEnter(map, start.x, start.y, bot) || !this.canEnter(map, goal.x, goal.y, bot)) {
			return null;
		}

		if (start.x === goal.x && start.y === goal.y) {
			return [{ x: start.x, y: start.y }];
		}

		const openSet = new MinHeap();
		const bestCosts = new Map<string, number>();
		const closedSet = new Set<string>();
		const startNode: PathNode = {
			x: start.x,
			y: start.y,
			g: 0,
			f: this.heuristic(start, goal),
		};

		openSet.push(startNode);
		bestCosts.set(this.key(start.x, start.y), 0);

		while (openSet.size > 0) {
			const current = openSet.pop();
			if (!current) {
				break;
			}

			const currentKey = this.key(current.x, current.y);
			if (closedSet.has(currentKey)) {
				continue;
			}
			closedSet.add(currentKey);

			if (current.x === goal.x && current.y === goal.y) {
				return this.buildPath(current);
			}

			for (const neighbor of this.neighbors(map, current, bot)) {
				const neighborKey = this.key(neighbor.x, neighbor.y);
				if (closedSet.has(neighborKey)) {
					continue;
				}

				const stepCost = neighbor.diagonal ? this.movementCosts.diagonal : this.movementCosts.orthogonal;
				const tileCost = map.getTileCost(neighbor.x, neighbor.y);
				const tentativeG = current.g + stepCost * tileCost;
				if (tentativeG >= (bestCosts.get(neighborKey) ?? Number.POSITIVE_INFINITY)) {
					continue;
				}

				bestCosts.set(neighborKey, tentativeG);
				openSet.push({
					x: neighbor.x,
					y: neighbor.y,
					g: tentativeG,
					f: tentativeG + this.heuristic(neighbor, goal),
					parent: current,
				});
			}
		}

		return null;
	}

	private neighbors(
		map: IGridMap,
		current: PathNode,
		bot?: IBot2d,
	): Array<GridPosition & { diagonal: boolean }> {
		const directions = [
			{ x: 1, y: 0, diagonal: false },
			{ x: -1, y: 0, diagonal: false },
			{ x: 0, y: 1, diagonal: false },
			{ x: 0, y: -1, diagonal: false },
		];

		if (this.allowDiagonal) {
			directions.push(
				{ x: 1, y: 1, diagonal: true },
				{ x: -1, y: 1, diagonal: true },
				{ x: 1, y: -1, diagonal: true },
				{ x: -1, y: -1, diagonal: true },
			);
		}

		return directions
			.map((direction) => ({
				x: current.x + direction.x,
				y: current.y + direction.y,
				diagonal: direction.diagonal,
			}))
			.filter((position) => {
				if (!this.canEnter(map, position.x, position.y, bot)) {
					return false;
				}
				if (!position.diagonal || this.allowCornerCutting) {
					return true;
				}

				const xDirection = position.x > current.x ? 1 : -1;
				const yDirection = position.y > current.y ? 1 : -1;
				return this.canEnter(map, current.x + xDirection, current.y, bot)
					&& this.canEnter(map, current.x, current.y + yDirection, bot);
			});
	}

	private canEnter(map: IGridMap, x: number, y: number, bot?: IBot2d): boolean {
		return map.isValidPosition(x, y) && map.isWalkable(x, y, bot)
			&& Number.isFinite(map.getTileCost(x, y))
			&& map.getTileCost(x, y) >= 0;
	}

	private heuristic(from: GridPosition, to: GridPosition): number {
		const distanceX = Math.abs(from.x - to.x);
		const distanceY = Math.abs(from.y - to.y);

		if (!this.allowDiagonal) {
			return (distanceX + distanceY) * this.movementCosts.orthogonal;
		}

		const diagonalSteps = Math.min(distanceX, distanceY);
		const straightSteps = Math.max(distanceX, distanceY) - diagonalSteps;
		return diagonalSteps * this.movementCosts.diagonal + straightSteps * this.movementCosts.orthogonal;
	}

	private buildPath(node: PathNode): Array<GridPosition> {
		const path: Array<GridPosition> = [];
		let current: PathNode | undefined = node;
		while (current) {
			path.push({ x: current.x, y: current.y });
			current = current.parent;
		}
		return path.reverse();
	}

	private key(x: number, y: number): string {
		return `${x},${y}`;
	}
}

/** Small executable example for tests and consumers exploring the API. */
export function defaultPathfinderExample(): Array<GridPosition> | null {
	const map = new DefaultGridMap([
		[1, 1, 1],
		[1, 0, 1],
		[1, 1, 1],
	]);
	const bot = new DefaultBot2d("example-bot");
	const pathfinder = new AStarPathfinder({ allowDiagonal: false });

	return pathfinder.findPath(map, { x: 0, y: 0 }, { x: 2, y: 2 }, bot);
}
