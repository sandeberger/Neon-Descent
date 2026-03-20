export interface GameState {
  readonly name: string;
  onEnter(prev: string | null): void;
  onExit(next: string): void;
  fixedUpdate(dt: number): void;
  render(alpha: number): void;
  onPause?(): void;
  onResume?(): void;
}

export class StateMachine {
  private states = new Map<string, GameState>();
  private current: GameState | null = null;

  register(state: GameState): void {
    this.states.set(state.name, state);
  }

  transition(name: string): void {
    const next = this.states.get(name);
    if (!next) throw new Error(`Unknown state: ${name}`);
    const prev = this.current;
    prev?.onExit(name);
    this.current = next;
    next.onEnter(prev?.name ?? null);
  }

  fixedUpdate(dt: number): void {
    this.current?.fixedUpdate(dt);
  }

  render(alpha: number): void {
    this.current?.render(alpha);
  }

  get currentName(): string {
    return this.current?.name ?? 'NONE';
  }

  get currentState(): GameState | null {
    return this.current;
  }
}
