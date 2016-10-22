import { GameInstance } from '../game-instance';
import { GameObject } from './game-object';
import * as Terrain from './terrain';
import { Player } from './player';
import { Bullet } from './bullet';
import { Polar } from '../math/polar';
import { Collider } from '../math/collider';
import { Counter } from '../math/counter';

const enum Direction {
  None,
  Left,
  Right,
  Up,
  Down,
}

const enum EnemyState {
  Searching,
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
  protected _state: EnemyState = EnemyState.Searching;
  protected _searchDir: Direction = Direction.None;

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

  /**
   * Returns true if a polar line from the center of the enemy to the center
   * of the player intersects no more than 1 horizontal line and no more than
   * 1 vertical line taken from the block bounds.
   */
  protected _canSeePlayer(game: GameInstance): boolean {
    let line = new Polar.Line(
      this.pos.r,
      this.pos.theta,
      game.player.pos.r,
      game.player.pos.theta
    );
    let numHor = 0, numVer = 0;
    game.level.blocks.forEach(block => {
      let bounds = block.getPolarBounds();
      let result = line.intersectsRect(bounds);
      if (result.top) { numHor++; }
      if (result.bottom) { numHor++; }
      if (result.left) { numVer++; }
      if (result.right) { numVer++; }
    });
    return numHor <= 1 && numVer <= 1;
  }

  /**
   * Update the enemy if it is in the "searching" state, where it can't
   * see the player. Wander around until the player comes in sight, then
   * transition to the "chasing" state.
   */
  protected _updateSearching(game: GameInstance): void {
    // Switch to chasing if we can see the player
    if (this._canSeePlayer(game)) {
      this._state = EnemyState.Chasing;
      this._searchDir = Direction.None;
      return;
    }
    // Otherwise, if we are not moving left or right, then choose a new
    // direction
    let moveDist = Math.abs((this.pos.theta - this.prevPos.theta) * this.pos.r);
    if (moveDist < this._moveSpeed / 2 ||
        this._searchDir === Direction.None) {
      if (Math.random() < 0.5) {
        this._searchDir = Direction.Left;
      } else {
        this._searchDir = Direction.Right;
      }
    }
    // Update the theta velocity based on the current direction. Search speed
    // is slower than normal movement speed
    let searchSpeed = 0.6 * this._moveSpeed / this.pos.r;
    if (this._searchDir === Direction.Left) {
      this.vel.theta = -searchSpeed;
    } else {
      this.vel.theta = searchSpeed;
    }
  }

  /**
   * Update the enemy if it is in the "chasing" state. Try to get to the
   * player, and if they go out of sight then go back to the "searching" state.
   */
  protected _updateChasing(game: GameInstance): void {
    // If we can't see the player, switch to searching
    if (!this._canSeePlayer(game)) {
      this._state = EnemyState.Searching;
      return;
    }
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

  /**
   * Update the enemy if it is in the "knockback" state. Move by some constant
   * knockback velocity for a certain number of frames, then transition to
   * the "stunned" state.
   */
  protected _updateKnockback(game: GameInstance): void {
    if (this._knockbackCounter.done()) {
      this._state = EnemyState.Stunned;
      this.vel.theta = 0;
    } else {
      this._knockbackCounter.next();
      this.vel.theta = this._knockbackVel;
    }
  }

  /**
   * Update the enemy if it is in the "stunned" state. Wait a certain number
   * of frames and do not move, then transition to the "chasing" or "searching"
   * state depending on if we can see the player.
   */
  protected _updateStunned(game: GameInstance): void {
    if (this._stunnedCounter.done()) {
      if (this._canSeePlayer(game)) {
        this._state = EnemyState.Chasing;
      } else {
        this._state = EnemyState.Searching;
      }
    } else {
      this._stunnedCounter.next();
    }
  }

  /**
   * Update the enemy behavior based on its current state.
   */
  public update(game: GameInstance): void {
    super.update(game);
    // Make transparent if damaged
    this.alpha = this._health / this._maxHealth;
    // Do something different depending on the enemy state
    switch (this._state) {
      case EnemyState.Searching:
        this._updateSearching(game);
        break;
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

  protected _updateSearching(game: GameInstance): void {
    super._updateSearching(game);
    if (this._state !== EnemyState.Searching) {
      return;
    }
    // Stop going up or down for now. Maybe later on add going up or down
    // to the list of possible search directions instead of just left and right
    this.vel.r = 0;
  }

  protected _updateChasing(game: GameInstance): void {
    super._updateChasing(game);
    if (this._state !== EnemyState.Chasing) {
      return;
    }
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
  private _jumpCounter: Counter;
  protected _shouldJump: boolean = false;
  protected _jumpSpeed: number = 15;

  private _getNewJumpCounterInterval(): number {
    return 60 + (90 * Math.random());
  }

  protected _updateSearching(game: GameInstance): void {
    super._updateSearching(game);
    if (this._state !== EnemyState.Searching) {
      this._jumpCounter = null;
      return;
    }
    // Make sure the jump counter has been initialized
    if (!this._jumpCounter) {
      this._jumpCounter = new Counter(this._getNewJumpCounterInterval());
    }
    // Update the jump counter, jump if it has expired
    if (this._onSolidGround) {
      if (this._jumpCounter.done()) {
        // Jump
        this._onSolidGround = false;
        this.vel.r = this._jumpSpeed;
        // Reset jump counter with another randomized interval
        this._jumpCounter.max = this._getNewJumpCounterInterval();
        this._jumpCounter.reset();
      } else {
        // Increment jump counter
        this._jumpCounter.next();
      }
    } else {
      // Not on solid ground, reset the jump counter
      this._jumpCounter.reset();
    }
  }

  protected _updateChasing(game: GameInstance): void {
    super._updateChasing(game);
    if (this._state !== EnemyState.Chasing) {
      return;
    }
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
