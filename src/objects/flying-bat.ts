import { FlyingEnemy } from './enemy';
import { GameInstance } from '../game-instance';
import { Polar } from '../math/polar';

/**
 * A bat-like enemy that flies around and chases the player, biting them if
 * it gets close enough.
 */
export class FlyingBat extends FlyingEnemy {
  protected _flapCounter: number = 0;
  protected _flapHeight: number = 15;

  public get width(): number { return 40; }
  public get height(): number { return 40; }
  protected get _color(): string { return 'purple'; }

  public mirror(): void {
    super.mirror();
    // Move the sprite up and down to "flap".
    this._flapCounter += 0.1;
    let flapDir = new Polar.Coord(
      (Math.abs(Math.sin(this._flapCounter)) - 0.5) * this._flapHeight,
      this.pos.theta
    );
    this._sprite.x += flapDir.x;
    this._sprite.y += flapDir.y;
  }
}
