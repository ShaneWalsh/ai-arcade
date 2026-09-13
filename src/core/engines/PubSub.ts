type Callback = (data?: any) => void;

export class PubSub {
  private events: { [key: string]: Callback[] } = {};

  /**
   * Subscribe to an event
   * @returns An unsubscribe function for convenience
   */
  subscribe(event: string, callback: Callback): () => void {
    if (!this.events[event]) {
      this.events[event] = [];
    }

    this.events[event].push(callback);

    // Return a function to easily unsubscribe
    return () => this.unsubscribe(event, callback);
  }

  /**
   * Publish data to all subscribers of an event
   */
  publish(event: string, data?: any): void {
    const callbacks = this.events[event];
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  /**
   * Unsubscribe a specific callback from an event
   */
  unsubscribe(event: string, callback: Callback): void {
    const callbacks = this.events[event];
    if (callbacks) {
      this.events[event] = callbacks.filter((cb) => cb !== callback);
    }
  }

  /**
   * Clear all listeners for a specific event or all events
   */
  clear(event?: string): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}