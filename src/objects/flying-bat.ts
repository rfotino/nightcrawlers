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

  public enemyType(): string { return 'bat'; }

  protected _createSprite(): SpriteSheet {
    return new SpriteSheet(
      'game/flying-bat',
      3, 1, // width, height
      'walk', // default anim
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

  protected _updateChasing(): void {
    super._updateChasing();
    this._sprite.playAnim('run');
  }

  protected _updateSearching(): void {
    super._updateSearching();
    this._sprite.playAnim('walk');
  }

  protected _updateKnockback(): void {
    super._updateKnockback();
    this._sprite.stopAnim();
  }

  protected _updateStunned(): void {
    super._updateStunned();
    this._sprite.stopAnim();
  }
}
