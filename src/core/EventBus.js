export class EventBus {
    constructor() {
        this.listeners = new Map();
    }
    on(event, fn) {
        let set = this.listeners.get(event);
        if (!set) {
            set = new Set();
            this.listeners.set(event, set);
        }
        set.add(fn);
    }
    off(event, fn) {
        this.listeners.get(event)?.delete(fn);
    }
    emit(event, data) {
        const set = this.listeners.get(event);
        if (set) {
            for (const fn of set) {
                fn(data);
            }
        }
    }
    clear() {
        this.listeners.clear();
    }
}
