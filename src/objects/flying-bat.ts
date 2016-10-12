import { Enemy } from './enemy';
import { GameInstance } from '../game-instance';

/**
 * A bat-like enemy that flies around and chases the player, biting them if
 * it gets close enough.
 */
export class FlyingBat extends Enemy {
  public get width(): number { return 40; }
  public get height(): number { return 40; }
  protected get _color(): string { return 'purple'; }

  public constructor(game: GameInstance) {
    super(game);
    this._flying = true;
    this._jumpSpeed = 12;
    this._maxFlapCounter = 20;
  }
}
