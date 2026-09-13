# PubSub Reference

Import: `import { bus } from '@/engine/PubSub';`

- `subscribe(event: string, cb: (data?: any) => void): () => void`
- `publish(event: string, data?: any): void`
- `clear(event?: string): void`

Usage:
const unsub = bus.subscribe('player:score', (pts) => score.add(pts));
bus.publish('player:score', 10);