import { engine } from "../engine";

export type Unsubscribe = () => void;

export class SubscriptionsHolder {
	public subscriptions: Unsubscribe[] = [];

	public subscribe(
		event: string,
		callback: Parameters<typeof engine.bus.subscribe>[1],
	): Unsubscribe {
		return this.add(engine.bus.subscribe(event, callback));
	}

	public add(unsubscribe: Unsubscribe): Unsubscribe {
		this.subscriptions.push(unsubscribe);
		return unsubscribe;
	}

	public destroy(): void {
		this.subscriptions.forEach((unsubscribe) => unsubscribe());
		this.subscriptions.length = 0;
	}
}

