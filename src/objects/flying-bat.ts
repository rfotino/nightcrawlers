import { FlyingEnemy } from './enemy';
import { GameInstance } from '../game-instance';
import { Polar } from '../math/polar';
import { SpriteSheet} from '../graphics/spritesheet';

/**
 * A bat-like enemy that flies around and chases the player, biting them if
 * it gets close enough.
 */
export class FlyingBat extends FlyingEnemy {
  public get width(): number { return 50; }
  public get height(): number { return 50; }

  protected _createSprite(): SpriteSheet {
    return new SpriteSheet(
      'game/flying-bat',
      3, 1, // width, height
      0, // default frame
      { // animations
        walk: {
          frames: [ 0, 1, 2 ],
          ticksPerFrame: 10,
        },
        run: {
          frames: [ 0, 1, 2 ],
          ticksPerFrame: 6,
        },
      }
    );
  }

  protected _updateChasing(game: GameInstance): void {
    super._updateChasing(game);
    this._sprite.playAnim('run');
  }

  protected _updateSearching(game: GameInstance): void {
    super._updateSearching(game);
    this._sprite.playAnim('walk');
  }

  protected _updateKnockback(game: GameInstance): void {
    super._updateKnockback(game);
    this._sprite.stopAnim();
  }

  protected _updateStunned(game: GameInstance): void {
    super._updateStunned(game);
    this._sprite.stopAnim();
  }
}
