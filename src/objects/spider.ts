import { JumpingEnemy } from './enemy';
import { SpriteSheet } from '../graphics/spritesheet';
import { GameInstance } from '../game-instance';

/**
 * Stub class for spider behavior to be added later.
 */
export class Spider extends JumpingEnemy {
  public get width(): number { return 80; }
  public get height(): number { return 60; }
  protected get _color(): string { return 'black'; }

  public constructor(game: GameInstance) {
    super(game);
    this._health = this._maxHealth = 50;
    this._moveSpeed = 5;
    this._jumpSpeed = 22;
  }

  public enemyType(): string { return 'spider'; }

  protected _createSprite(): SpriteSheet {
    return new SpriteSheet(
      'game/spider',
      6, 2, // width, height
      'idle', // default anim
      { // animations
        idle: {
          frames: [0],
          ticksPerFrame: 0,
        },
        walk: {
          frames: [0, 1, 2, 3, 4, 5],
          ticksPerFrame: 8,
        },
        run: {
          frames: [0, 1, 2, 3, 4, 5],
          ticksPerFrame: 5,
        },
        jump: {
          frames: [6],
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
