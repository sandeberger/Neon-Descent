export class ObjectPool<T> {
  private pool: T[] = [];
  private activeList: T[] = [];

  constructor(
    private readonly factory: () => T,
    private readonly reset: (obj: T) => void,
    private readonly isActive: (obj: T) => boolean,
    initialSize: number = 32,
  ) {
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  acquire(): T {
    const obj = this.pool.length > 0 ? this.pool.pop()! : this.factory();
    this.activeList.push(obj);
    return obj;
  }

  release(obj: T): void {
    this.reset(obj);
    this.pool.push(obj);
  }

  /** Sweep inactive objects back to pool (swap-and-pop) */
  sweep(): void {
    for (let i = this.activeList.length - 1; i >= 0; i--) {
      if (!this.isActive(this.activeList[i]!)) {
        this.release(this.activeList[i]!);
        this.activeList[i] = this.activeList[this.activeList.length - 1]!;
        this.activeList.pop();
      }
    }
  }

  get active(): readonly T[] {
    return this.activeList;
  }

  get activeCount(): number {
    return this.activeList.length;
  }

  get poolSize(): number {
    return this.pool.length;
  }
}
