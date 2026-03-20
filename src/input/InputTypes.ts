export interface InputFrame {
  moveX:     number;        // -1.0 to 1.0
  fire:      boolean;       // right zone held
  stomp:     boolean;       // swipe down consumed
  dash:      boolean;       // swipe up consumed
  special:   boolean;       // double-tap consumed
  aimTarget: number | null; // entity ID from aim assist
}

export const enum GestureType {
  NONE,
  HOLD,
  SWIPE_DOWN,
  SWIPE_UP,
  DOUBLE_TAP,
}

export interface ActiveTouch {
  id:        number;
  startX:    number;
  startY:    number;
  currentX:  number;
  currentY:  number;
  startTime: number;
  zone:      'left' | 'right';
}

export function emptyInputFrame(): InputFrame {
  return {
    moveX: 0,
    fire: false,
    stomp: false,
    dash: false,
    special: false,
    aimTarget: null,
  };
}
