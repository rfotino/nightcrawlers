import { JumpingEnemy } from './enemy';
import { GameInstance } from '../game-instance';

/**
 * Stub class for spider behavior to be added later.
 */
export class Spider extends JumpingEnemy {
  public get width(): number { return 50; }
  public get height(): number { return 50; }
  protected get _color(): string { return 'black'; }

  public constructor(game: GameInstance) {
    super(game);
    this._moveSpeed = 5;
    this._jumpSpeed = 22;
  }

  public enemyType(): string { return 'spider'; }
}
