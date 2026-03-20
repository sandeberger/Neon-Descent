import { GestureRecognizer } from './GestureRecognizer';
import { InputBuffer } from './InputBuffer';
import { GestureType, type InputFrame, emptyInputFrame } from './InputTypes';

export class InputManager {
  readonly gesture: GestureRecognizer;
  readonly buffer: InputBuffer;

  // Keyboard state (desktop fallback)
  private keys = new Set<string>();

  private canvasScale = 1;

  constructor() {
    this.gesture = new GestureRecognizer();
    this.buffer = new InputBuffer();
  }

  bind(canvas: HTMLCanvasElement, canvasScale: number): void {
    this.canvasScale = canvasScale;
    this.gesture.bind(canvas);

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  unbind(canvas: HTMLCanvasElement): void {
    this.gesture.unbind(canvas);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  updateScale(scale: number): void {
    this.canvasScale = scale;
  }

  /** Build the input frame for this tick, consuming buffered gestures */
  buildFrame(): InputFrame {
    const frame = emptyInputFrame();

    // Process touch gestures
    const gestures = this.gesture.consumeGestures();
    for (const g of gestures) {
      switch (g) {
        case GestureType.SWIPE_DOWN:
          this.buffer.push('stomp');
          break;
        case GestureType.SWIPE_UP:
          this.buffer.push('dash');
          break;
        case GestureType.DOUBLE_TAP:
          this.buffer.push('special');
          break;
      }
    }

    // Touch movement
    frame.moveX = this.gesture.getMoveX(this.canvasScale);

    // Touch fire (hold right side)
    frame.fire = this.gesture.isHolding();

    // Keyboard fallback
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA'))  frame.moveX = -1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) frame.moveX = 1;
    if (this.keys.has('Space'))  frame.fire = true;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) {
      if (!this.consumedThisFrame.has('stomp')) {
        this.buffer.push('stomp');
        this.consumedThisFrame.add('stomp');
      }
    }
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) {
      if (!this.consumedThisFrame.has('dash')) {
        this.buffer.push('dash');
        this.consumedThisFrame.add('dash');
      }
    }
    if (this.keys.has('KeyE')) {
      if (!this.consumedThisFrame.has('special')) {
        this.buffer.push('special');
        this.consumedThisFrame.add('special');
      }
    }

    // Consume buffered actions
    frame.stomp   = this.buffer.consume('stomp');
    frame.dash    = this.buffer.consume('dash');
    frame.special = this.buffer.consume('special');

    this.buffer.prune();
    this.consumedThisFrame.clear();

    return frame;
  }

  // Prevent keyboard repeat from flooding the buffer
  private consumedThisFrame = new Set<string>();

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  get isTouch(): boolean {
    return this.gesture.hasActiveTouch();
  }
}
