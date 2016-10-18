import { GameInstance } from '../game-instance';
import { GameObject } from './game-object';
import * as Terrain from './terrain';
import { Player } from './player';
import { Bullet } from './bullet';
import { Polar } from '../math/polar';
import { Collider } from '../math/collider';
import { Counter } from '../math/counter';

const enum EnemyState {
  Chasing,
  Knockback,
  Stunned,
}

/**
 * General enemy class, moves left and right towards the player but cannot
 * fly or jump. Is affected by gravity by default.
 */
export class Enemy extends GameObject {
  private _canvas: HTMLCanvasElement;
  protected _sprite: PIXI.Sprite;
  protected _onSolidGround: boolean = false;
  protected _damageAmount: number = 0.25;
  protected _score: number = 50;
  protected _shouldGoLeft: boolean = false;
  protected _shouldGoRight: boolean = false;
  protected _moveSpeed: number = 3;
  protected _knockbackVel: number = 0;
  protected _knockbackCounter: Counter = new Counter(0);
  protected _stunnedCounter: Counter = new Counter(0);
  protected _state: EnemyState = EnemyState.Chasing;

  public get z(): number {
    return 40;
  }

  public get score(): number {
    return this._score;
  }

  protected get _color(): string {
    return 'white';
  }

  public constructor(game: GameInstance) {
    super();
    this._maxHealth = 20;
    this._health = this._maxHealth;
    this._draw();
    this._sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(this._canvas));
    this._sprite.anchor.set(0.5, 0.5);
    this.pos.set(
      game.player.pos.r + 300,
      game.player.pos.theta - 0.5 + Math.random()
    );
    this.accel.r = Terrain.GRAVITY;
    this._mirrorList.push(this._sprite);
    this.addChild(this._sprite);
  }

  public type(): string { return 'enemy'; }

  public team(): string { return 'enemy'; }

  protected _updateChasing(game: GameInstance): void {
    // Decide if we should go left or right
    let closestPos = Polar.closestTheta(this.pos.theta, game.player.pos.theta);
    let diffTheta = game.player.pos.theta - closestPos;
    let minDiffTheta = (
      0.3 *
      (game.player.width + this.width) /
      game.player.pos.r
    );
    this._shouldGoLeft = diffTheta < -minDiffTheta;
    this._shouldGoRight = diffTheta > minDiffTheta;
    // Handle going left or right
    let speed = this._moveSpeed / this.pos.r;
    if (this._shouldGoLeft) {
      this.vel.theta = -speed;
    } else if (this._shouldGoRight) {
      this.vel.theta = speed;
    } else {
      this.vel.theta = 0;
    }
  }

  protected _updateKnockback(game: GameInstance): void {
    if (this._knockbackCounter.done()) {
      this._state = EnemyState.Stunned;
      this.vel.theta = 0;
    } else {
      this._knockbackCounter.next();
      this.vel.theta = this._knockbackVel;
    }
  }

  protected _updateStunned(game: GameInstance): void {
    if (this._stunnedCounter.done()) {
      this._state = EnemyState.Chasing;
    } else {
      this._stunnedCounter.next();
    }
  }

  public update(game: GameInstance): void {
    super.update(game);
    // Make transparent if damaged
    this.alpha = this._health / this._maxHealth;
    // Do something different depending on the enemy state
    switch (this._state) {
      case EnemyState.Chasing:
        this._updateChasing(game);
        break;
      case EnemyState.Knockback:
        this._updateKnockback(game);
        break;
      case EnemyState.Stunned:
        this._updateStunned(game);
        break;
    }
  }

  public collide(other: GameObject, result: Collider.Result): void {
    if (other.team() === 'player') {
      other.damage(this._damageAmount);
    }
    switch (other.type()) {
      case 'planet':
      case 'platform':
      case 'block':
        if (result.bottom) {
          this._onSolidGround = true;
          this.vel.theta += other.vel.theta;
        }
        break;
      case 'bullet':
        // Bullets knock the enemy back
        let bullet = <Bullet>other;
        this._state = EnemyState.Knockback;
        this._knockbackVel = bullet.knockbackVel;
        this._knockbackCounter.reset();
        this._knockbackCounter.max = bullet.knockbackTime;
        this._stunnedCounter.reset();
        this._stunnedCounter.max = bullet.stunTime;
        break;
    }
  }

  public getPolarBounds(): Polar.Rect {
    let widthTheta = this.width / this.pos.r;
    return new Polar.Rect(
      this.pos.r + (this.height / 2),
      this.pos.theta - (widthTheta / 2),
      this.height,
      widthTheta
    );
  }

  private _draw(): void {
    // Create canvas of appropriate size
    this._canvas = document.createElement('canvas');
    this._canvas.width = this.width + 2;
    this._canvas.height = this.height + 2;
    // Draw enemy on the canvas
    let ctx = this._canvas.getContext('2d');
    ctx.fillStyle = this._color;
    ctx.fillRect(1, 1, this.width, this.height);
  }
}

/**
 * Class of enemies that can move in all directions (up and down as well as
 * left and right). Not affected by gravity, since they can fly.
 */
export class FlyingEnemy extends Enemy {
  protected _shouldGoUp: boolean = false;
  protected _shouldGoDown: boolean = false;

  public constructor(game: GameInstance) {
    super(game);
    this.accel.r = 0;
  }

  protected _updateChasing(game: GameInstance): void {
    super._updateChasing(game);
    // Decide if we should go up or down
    let diffR = game.player.pos.r - this.pos.r;
    let minDiffR = 5;
    this._shouldGoUp = diffR > minDiffR;
    this._shouldGoDown = diffR < -minDiffR;
    // Go up or down
    if (this._shouldGoUp) {
      this.vel.r = this._moveSpeed;
    } else if (this._shouldGoDown) {
      this.vel.r = -this._moveSpeed;
    } else {
      this.vel.r = 0;
    }
  }
}

/**
 * Class of enemies that are affected by gravity and can only jump if they
 * are on solid ground.
 */
export class JumpingEnemy extends Enemy {
  protected _shouldJump: boolean = false;
  protected _jumpSpeed: number = 15;

  protected _updateChasing(game: GameInstance): void {
    super._updateChasing(game);
    // Decide if we should jump
    this._shouldJump = game.player.pos.r > this.pos.r;
    // Handle jumping if player is above this enemy
    if (this._shouldJump && this._onSolidGround) {
      this._onSolidGround = false;
      this.vel.r = this._jumpSpeed;
    }
  }

  public update(game: GameInstance): void {
    super.update(game);
    // Not on solid ground unless we collide with something this frame
    this._onSolidGround = false;
  }
}

/**
 * Class of enemies that spawn out of the ground instead of falling from the
 * sky. If you spawn out of the ground, you probably jump, so this class
 * naturally extends JumpingEnemy.
 */
export class GroundSpawnEnemy extends JumpingEnemy {
  public constructor(game: GameInstance) {
    super(game);
    // Spawn the enemy on a block near to the player. First choose an angle
    // to spawn at that is between minDist and maxDist radians away from the
    // player.
    let rand = Math.random();
    let minDist = 0.2;
    let maxDist = 0.4;
    let theta: number;
    if (rand < 0.5) {
      theta = game.player.pos.theta - minDist - (rand * (maxDist - minDist));
    } else {
      theta = game.player.pos.theta + minDist + (rand * (maxDist - minDist));
    }
    this.pos.theta = theta;
    // Then find all blocks that can be found at that angle and sort them by
    // distance from the player.
    let blockBounds = game.level.blocks.map(block => block.getPolarBounds());
    let possibleRects = blockBounds.filter(rect => {
      return Polar.thetaBetween(theta, rect.theta, rect.theta + rect.width);
    }).sort((r1, r2) => {
      return (
        Math.abs(game.player.pos.r - r1.r) -
        Math.abs(game.player.pos.r - r2.r)
      );
    });
    // Choose the closest possible rectangle, if available, and then push the
    // enemy up until it isn't intersecting any blocks
    if (possibleRects.length > 0) {
      let rect = possibleRects[0];
      this.pos.r = rect.r + (this.height / 2);
    }
    let enemyRect = this.getPolarBounds();
    for (let i = 0; i < blockBounds.length; i++) {
      let blockRect = blockBounds[i];
      if (enemyRect.intersects(blockRect) &&
          !Polar.above(enemyRect, blockRect) &&
          !Polar.above(blockRect, enemyRect)) {
        // Push this enemy above the block and update bounds
        this.pos.r = blockRect.r + (this.height / 2);
        enemyRect = this.getPolarBounds();
        // start loop over, i === 0 next iteration
        i = -1;
      }
    }
    // Push the enemy up a bit so that it doesn't fall through the block below
    // it in the first frame after it spawns
    this.pos.r += Math.abs(Terrain.GRAVITY) + 0.1;
  }
}
