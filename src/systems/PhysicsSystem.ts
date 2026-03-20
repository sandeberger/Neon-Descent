import type { Player } from '@entities/Player';
import type { InputFrame } from '@input/InputTypes';
import {
  GRAVITY, TERMINAL_VELOCITY,
  MOVE_ACCEL, MOVE_DECEL, MAX_MOVE_SPEED, AIR_STEER,
  WALL_SLIDE_SPEED, CANVAS_W,
} from '@core/Constants';
import { clamp } from '@utils/math';

export class PhysicsSystem {
  update(dt: number, player: Player, input: InputFrame, moveSpeedMod: number = 1): void {
    player.savePrevious();

    if (player.state === 'DEAD') return;

    // Horizontal movement (not during stomp)
    if (player.state !== 'STOMPING' && player.state !== 'STOMP_STARTUP') {
      if (Math.abs(input.moveX) > 0.1) {
        const accel = MOVE_ACCEL * (player.grounded ? 1 : AIR_STEER);
        player.vx += input.moveX * accel * dt;
      } else {
        // Decelerate
        const decel = MOVE_DECEL * dt;
        if (Math.abs(player.vx) < decel) {
          player.vx = 0;
        } else {
          player.vx -= Math.sign(player.vx) * decel;
        }
      }
      const effectiveMaxSpeed = MAX_MOVE_SPEED * moveSpeedMod;
      player.vx = clamp(player.vx, -effectiveMaxSpeed, effectiveMaxSpeed);
    }

    // Gravity (not during stomp startup or dashing)
    if (player.state !== 'STOMP_STARTUP' && player.state !== 'DASHING' && player.state !== 'STOMPING') {
      player.vy += GRAVITY * dt;
      player.vy = Math.min(player.vy, TERMINAL_VELOCITY);
    }

    // Wall slide: cap downward speed
    if (player.state === 'WALL_SLIDING' && player.vy > 0) {
      player.vy = Math.min(player.vy, WALL_SLIDE_SPEED);
    }

    // Apply velocity
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // World bounds (horizontal clamp)
    const halfW = player.hitbox.width / 2;
    if (player.x < halfW) {
      player.x = halfW;
      player.vx = 0;
      player.touchingWallLeft = true;
    } else {
      player.touchingWallLeft = false;
    }

    if (player.x > CANVAS_W - halfW) {
      player.x = CANVAS_W - halfW;
      player.vx = 0;
      player.touchingWallRight = true;
    } else {
      player.touchingWallRight = false;
    }

    // Wall slide state transition
    if (player.touchingWall && player.vy > 0 && !player.grounded &&
        player.state === 'FALLING') {
      player.state = 'WALL_SLIDING';
      player.airDashesUsed = 0; // reset air dashes on wall contact
      player.events?.emit('player:wallslide', {
        side: player.touchingWallLeft ? 'left' : 'right',
      });
    }
  }
}
