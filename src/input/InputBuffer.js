import { INPUT_BUFFER_MS } from '@core/Constants';
export class InputBuffer {
    constructor() {
        this.queue = [];
    }
    push(type) {
        this.queue.push({ type, timestamp: performance.now() });
    }
    consume(type) {
        const now = performance.now();
        for (let i = 0; i < this.queue.length; i++) {
            const a = this.queue[i];
            if (a.type === type && now - a.timestamp < INPUT_BUFFER_MS) {
                // swap-and-pop
                this.queue[i] = this.queue[this.queue.length - 1];
                this.queue.pop();
                return true;
            }
        }
        return false;
    }
    prune() {
        const now = performance.now();
        for (let i = this.queue.length - 1; i >= 0; i--) {
            if (now - this.queue[i].timestamp >= INPUT_BUFFER_MS) {
                this.queue[i] = this.queue[this.queue.length - 1];
                this.queue.pop();
            }
        }
    }
    clear() {
        this.queue.length = 0;
    }
}
