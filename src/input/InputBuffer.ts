import { INPUT_BUFFER_MS } from '@core/Constants';

export type BufferedActionType = 'stomp' | 'dash' | 'special';

interface BufferedAction {
  type:      BufferedActionType;
  timestamp: number;
}

export class InputBuffer {
  private queue: BufferedAction[] = [];

  push(type: BufferedActionType): void {
    this.queue.push({ type, timestamp: performance.now() });
  }

  consume(type: BufferedActionType): boolean {
    const now = performance.now();
    for (let i = 0; i < this.queue.length; i++) {
      const a = this.queue[i]!;
      if (a.type === type && now - a.timestamp < INPUT_BUFFER_MS) {
        // swap-and-pop
        this.queue[i] = this.queue[this.queue.length - 1]!;
        this.queue.pop();
        return true;
      }
    }
    return false;
  }

  prune(): void {
    const now = performance.now();
    for (let i = this.queue.length - 1; i >= 0; i--) {
      if (now - this.queue[i]!.timestamp >= INPUT_BUFFER_MS) {
        this.queue[i] = this.queue[this.queue.length - 1]!;
        this.queue.pop();
      }
    }
  }

  clear(): void {
    this.queue.length = 0;
  }
}
