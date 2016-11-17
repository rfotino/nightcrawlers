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
    this._sprite.anchor.set(0.4, 0.5);
    this._moveSpeed = 2.5;
  }

  public enemyType(): string { return 'zombie'; }

  protected _createSprite(): SpriteSheet {
    return new SpriteSheet(
      'game/zombie',
      8, 2, // width, height
      'idle', // default anim
      { // animations
        idle: {
          frames: [0],
          ticksPerFrame: 0,
        },
        walk: {
          frames: [8, 9, 10, 11, 12, 13, 14, 15],
          ticksPerFrame: 8,
        },
        run: {
          frames: [8, 9, 10, 11, 12, 13, 14, 15],
          ticksPerFrame: 5,
        },
        jump: {
          frames: [1],
          ticksPerFrame: 0,
        },
        attack: {
          frames: [2, 3, 4, 5, 6, 7],
          ticksPerFrame: 3,
        },
      }
    );
  }

  protected _updateChasing(): void {
    super._updateChasing();
    if (this.getPolarBounds().intersects(this._game.player.getPolarBounds())) {
      // Because temporarily the enemies just do a steady stream of damage when
      // in contact with the player. The above if condition is a hack and should
      // be generalized out to the Enemy class to decide when we are attacking.
      this._sprite.playAnim('attack');
    } else if (this._isOnSolidGround()) {
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