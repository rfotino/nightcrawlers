import { Enemy } from './enemy';

/**
 * A bat-like enemy that flies around and chases the player, biting them if
 * it gets close enough.
 */
export class FlyingBat extends Enemy {
  public get width(): number { return 40; }
  public get height(): number { return 40; }
  protected get _color(): string { return 'purple'; }
}
