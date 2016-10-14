import { GroundSpawnEnemy } from './enemy';
import { GameInstance } from '../game-instance';

/**
 * Stub class for skeleton behavior to be added later.
 */
export class Skeleton extends GroundSpawnEnemy {
  public get width(): number { return 30; }
  public get height(): number { return 50; }
  protected get _color(): string { return 'rgb(255,255,150)'; }

  public constructor(game: GameInstance) {
    super(game);
    this._moveSpeed = 5;
  }
}
