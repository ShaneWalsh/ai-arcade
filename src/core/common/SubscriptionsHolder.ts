
export type Unsubscribe = () => void;

export class SubscriptionsHolder {
	public subscriptions: Unsubscribe[] = [];

	public add(unsubscribe: Unsubscribe): Unsubscribe {
		this.subscriptions.push(unsubscribe);
		return unsubscribe;
	}

	public destroy(): void {
		this.subscriptions.forEach((unsubscribe) => unsubscribe());
		this.subscriptions.length = 0;
	}
}

