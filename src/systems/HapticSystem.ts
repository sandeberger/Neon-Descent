import type { EventBus } from '@core/EventBus';

export class HapticSystem {
  private enabled = true;

  init(events: EventBus): void {
    // Check if vibration API is available
    if (!navigator.vibrate) { this.enabled = false; return; }

    // Wire events to vibration patterns
    events.on('player:stomp', () => this.vibrate(30));         // Short thump
    events.on('stomp:hit', () => this.vibrate(50));            // Stronger impact
    events.on('player:dash', () => this.vibrate(15));          // Quick tap
    events.on('player:damage', () => this.vibrate([50, 30, 50])); // Double buzz for damage
    events.on('player:dead', () => this.vibrate([100, 50, 100, 50, 200])); // Death rattle
    events.on('combo:threshold', () => this.vibrate(25));      // Combo tier up
    events.on('pickup:collected', () => this.vibrate(10));     // Tiny tap
    events.on('near:miss', () => this.vibrate(20));            // Near miss buzz
    events.on('boss:defeated', () => this.vibrate([60, 40, 60, 40, 60, 40, 120])); // Victory
  }

  private vibrate(pattern: number | number[]): void {
    if (!this.enabled) return;
    try { navigator.vibrate(pattern); } catch {}
  }

  setEnabled(v: boolean): void { this.enabled = v && !!navigator.vibrate; }
  get isEnabled(): boolean { return this.enabled; }
}
