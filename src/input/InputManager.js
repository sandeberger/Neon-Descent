import { GestureRecognizer } from './GestureRecognizer';
import { InputBuffer } from './InputBuffer';
import { GestureType, emptyInputFrame } from './InputTypes';
export class InputManager {
    constructor() {
        // Keyboard state (desktop fallback)
        this.keys = new Set();
        this.canvasScale = 1;
        // Prevent keyboard repeat from flooding the buffer
        this.consumedThisFrame = new Set();
        this.onKeyDown = (e) => {
            this.keys.add(e.code);
        };
        this.onKeyUp = (e) => {
            this.keys.delete(e.code);
        };
        this.gesture = new GestureRecognizer();
        this.buffer = new InputBuffer();
    }
    bind(canvas, canvasScale) {
        this.canvasScale = canvasScale;
        this.gesture.bind(canvas);
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }
    unbind(canvas) {
        this.gesture.unbind(canvas);
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
    }
    updateScale(scale) {
        this.canvasScale = scale;
    }
    /** Build the input frame for this tick, consuming buffered gestures */
    buildFrame() {
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
        if (this.keys.has('ArrowLeft') || this.keys.has('KeyA'))
            frame.moveX = -1;
        if (this.keys.has('ArrowRight') || this.keys.has('KeyD'))
            frame.moveX = 1;
        if (this.keys.has('Space'))
            frame.fire = true;
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
        frame.stomp = this.buffer.consume('stomp');
        frame.dash = this.buffer.consume('dash');
        frame.special = this.buffer.consume('special');
        this.buffer.prune();
        this.consumedThisFrame.clear();
        return frame;
    }
    get isTouch() {
        return this.gesture.hasActiveTouch();
    }
}
