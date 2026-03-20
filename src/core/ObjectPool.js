export class ObjectPool {
    constructor(factory, reset, isActive, initialSize = 32) {
        this.factory = factory;
        this.reset = reset;
        this.isActive = isActive;
        this.pool = [];
        this.activeList = [];
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.factory());
        }
    }
    acquire() {
        const obj = this.pool.length > 0 ? this.pool.pop() : this.factory();
        this.activeList.push(obj);
        return obj;
    }
    release(obj) {
        this.reset(obj);
        this.pool.push(obj);
    }
    /** Sweep inactive objects back to pool (swap-and-pop) */
    sweep() {
        for (let i = this.activeList.length - 1; i >= 0; i--) {
            if (!this.isActive(this.activeList[i])) {
                this.release(this.activeList[i]);
                this.activeList[i] = this.activeList[this.activeList.length - 1];
                this.activeList.pop();
            }
        }
    }
    get active() {
        return this.activeList;
    }
    get activeCount() {
        return this.activeList.length;
    }
    get poolSize() {
        return this.pool.length;
    }
}
