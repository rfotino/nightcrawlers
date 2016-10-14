import { GroundSpawnEnemy } from './enemy';
import { GameInstance } from '../game-instance';
import { Polar } from '../math/polar';
import * as Terrain from './terrain';

/**
 * Stub class for zombie behavior to be added later.
 */
export class Zombie extends GroundSpawnEnemy {
  public get width(): number { return 30; }
  public get height(): number { return 50; }
  protected get _color(): string { return 'green'; }
}
