export class StateMachine {
    constructor() {
        this.states = new Map();
        this.current = null;
    }
    register(state) {
        this.states.set(state.name, state);
    }
    transition(name) {
        const next = this.states.get(name);
        if (!next)
            throw new Error(`Unknown state: ${name}`);
        const prev = this.current;
        prev?.onExit(name);
        this.current = next;
        next.onEnter(prev?.name ?? null);
    }
    fixedUpdate(dt) {
        this.current?.fixedUpdate(dt);
    }
    render(alpha) {
        this.current?.render(alpha);
    }
    get currentName() {
        return this.current?.name ?? 'NONE';
    }
    get currentState() {
        return this.current;
    }
}
