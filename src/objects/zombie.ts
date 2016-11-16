import { GroundSpawnEnemy } from './enemy';
import { GameInstance } from '../game-instance';
import { Polar } from '../math/polar';
import * as Terrain from './terrain';
import { SpriteSheet } from '../graphics/spritesheet';

/**
 * Slow, shuffling zombie enemy that seeks and damages the player.
 */
export class Zombie extends GroundSpawnEnemy {
  public get width(): number { return 25; }
  public get height(): number { return 75; }

  public constructor(game: GameInstance) {
    super(game);
    this._sprite.anchor.set(0.3, 0.5);
    this._moveSpeed = 2.5;
  }

  protected _createSprite(): SpriteSheet {
    return new SpriteSheet(
      'game/zombie',
      8, 2, // width, height
      'walk', // default anim
      { // animations
        walk: {
          frames: [0, 1, 2, 3, 4, 5, 6, 7],
          ticksPerFrame: 8,
        },
        run: {
          frames: [0, 1, 2, 3, 4, 5, 6, 7],
          ticksPerFrame: 5,
        },
        jump: {
          frames: [8],
          ticksPerFrame: 0,
        },
      }
    );
  }

  protected _updateChasing(): void {
    super._updateChasing();
    if (this._isOnSolidGround()) {
      this._sprite.playAnim('run');
    } else {
      this._sprite.playAnim('jump');
    }
  }

  protected _updateSearching(): void {
    super._updateSearching();
    if (this._isOnSolidGround()) {
      this._sprite.playAnim('walk');
    } else {
      this._sprite.playAnim('jump');
    }
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