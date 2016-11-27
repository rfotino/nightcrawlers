import { GameInstance } from '../game-instance';
import { GameObject } from './game-object';
import * as Terrain from './terrain';
import { Player } from './player';
import { FadingText } from './fading-text';
import { BloodSplatter } from './particles';
import { Polar } from '../math/polar';
import { Collider } from '../math/collider';
import { Counter } from '../math/counter';
import { Color } from '../graphics/color';
import { SpriteSheet } from '../graphics/spritesheet';
import { LagFactor } from '../math/lag-factor';

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
 * Miniature health bar that floats above the head of each enemy. Only has to
 * do with on-screen display of the enemy so this doesn't need to get exported.
 */
class EnemyHealthBar extends PIXI.Container {
  protected _emptySprite: PIXI.Sprite;
  protected _fullSprite: PIXI.Sprite;
  protected _fullSpriteMask: PIXI.Graphics;
  protected static _barTexture: PIXI.Texture = null;

  protected static get WIDTH(): number { return 50; }
  protected static get HEIGHT(): number { return 6; }

  protected static _getBarTexture(): PIXI.Texture {
    if (!EnemyHealthBar._barTexture) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = EnemyHealthBar.WIDTH + 2;
      canvas.height = EnemyHealthBar.HEIGHT + 2;
      ctx.fillStyle = 'white';
      ctx.fillRect(1, 1, EnemyHealthBar.WIDTH, EnemyHealthBar.HEIGHT);
      EnemyHealthBar._barTexture = PIXI.Texture.fromCanvas(canvas);
    }
    return EnemyHealthBar._barTexture;
  }

  public constructor(enemy: Enemy) {
    super();
    const texture = EnemyHealthBar._getBarTexture();
    const margin = 10;
    const width = EnemyHealthBar.WIDTH;
    const height = EnemyHealthBar.HEIGHT;
    const x = -texture.width / 2;
    const y = -margin - (0.5 * (enemy.height + height));
    // Have empty sprite on the bottom
    this._emptySprite = new PIXI.Sprite(texture);
    this._emptySprite.tint = new Color(255, 50, 50).toPixi();
    this._emptySprite.position.set(x, y);
    this.addChild(this._emptySprite);
    // Overlay full sprite on top
    this._fullSprite = new PIXI.Sprite(texture);
    this._fullSprite.tint = new Color(0, 255, 100).toPixi();
    this._fullSprite.position.set(x, y);
    this.addChild(this._fullSprite);
    // Add clipping mask to full sprite
    this._fullSpriteMask = new PIXI.Graphics();
    this._fullSprite.mask = this._fullSpriteMask;
    this._fullSprite.addChild(this._fullSpriteMask);
  }

  // Update size of green sprite to be proportional to enemy health
  public update(enemy: Enemy): void {
    this._fullSpriteMask.clear();
    this._fullSpriteMask.beginFill(0xffffff);
    this._fullSpriteMask.drawRect(
      0, 0,
      1 + this._fullSprite.width * enemy.health / enemy.maxHealth,
      this._fullSprite.height
    );
  }
}

/**
 * General enemy class, moves left and right towards the player but cannot
 * fly or jump. Is affected by gravity by default.
 */
export abstract class Enemy extends GameObject {
  protected _sprite: SpriteSheet;
  protected _healthBar: EnemyHealthBar;
  protected _damageAmount: number = 0.25;
  protected _score: number = 50;
  protected _shouldGoLeft: boolean = false;
  protected _shouldGoRight: boolean = false;
  protected _moveSpeed: number = 3;
  protected _knockbackCounter: Counter = new Counter(0);
  protected _stunnedCounter: Counter = new Counter(0);
  protected _state: EnemyState = EnemyState.Searching;
  protected _searchDir: Direction = Direction.None;
  protected _chasingCounter: Counter = new Counter(45);

  public get z(): number {
    return 40;
  }

  public get score(): number {
    return this._score;
  }

  protected get _color(): string {
    return 'white';
  }

  protected _createSprite(): SpriteSheet {
    // Create canvas of appropriate size
    let canvas = document.createElement('canvas');
    canvas.width = this.width + 2;
    canvas.height = this.height + 2;
    // Draw enemy on the canvas
    let ctx = canvas.getContext('2d');
    ctx.fillStyle = this._color;
    ctx.fillRect(1, 1, this.width, this.height);
    return new SpriteSheet(PIXI.Texture.fromCanvas(canvas));
  }

  protected _setInitialPos(): void {
    this.pos.set(
      this._game.player.pos.r + 300,
      this._game.player.pos.theta - 0.5 + Math.random()
    );
  }

  public constructor(game: GameInstance) {
    super(game);
    this._maxHealth = 20;
    this._health = this._maxHealth;
    this._sprite = this._createSprite();
    this._sprite.anchor.set(0.5, 0.5);
    this._setInitialPos();
    this._mirrorList.push(this._sprite);
    this.addChild(this._sprite);
    // Add health bar
    this._healthBar = new EnemyHealthBar(this);
    this._mirrorList.push(this._healthBar);
    this.addChild(this._healthBar);
    // Push the enemy sprite up and out of the ground, if that is where it is
    const blockBounds = game.level.blocks.map(block => block.getPolarBounds());
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

  public type(): string { return 'enemy'; }

  public team(): string { return 'enemy'; }

  public abstract enemyType(): string;

  /**
   * Add points to player score and show the amount of points where
   * the enemy used to be
   */
  public kill(): void {
    super.kill();
    this._game.player.score += this.score;
    this._game.addGameObject(new FadingText(
      this._game,
      `+${this.score}`,
      this.pos,
      { fontSize: 36, fill: 'white' }
    ));
    this._game.addGameObject(new BloodSplatter(this._game, this.pos, this.vel));
  }

  /**
   * Show little red number that shows how much the enemy was damaged.
   */
  public damage(amount: number): void {
    super.damage(amount);
    this._game.addGameObject(new FadingText(
      this._game,
      `-${amount}`,
      this.pos,
      { fontSize: 28, fill: 'red' },
      15 // timer
    ));
  }

  /**
   * Returns true if a polar line from the center of the enemy to the center
   * of the player intersects no more than 1 horizontal line and no more than
   * 1 vertical line taken from the block bounds.
   */
  protected _canSeePlayer(): boolean {
    let line = new Polar.Line(
      this.pos.r,
      this.pos.theta,
      this._game.player.pos.r,
      this._game.player.pos.theta
    );
    let numHor = 0, numVer = 0;
    this._game.level.blocks.forEach(block => {
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
  protected _updateSearching(): void {
    // Switch to chasing if we can see the player
    if (this._canSeePlayer()) {
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
        this._sprite.scale.x = -1;
      } else {
        this._searchDir = Direction.Right;
        this._sprite.scale.x = 1;
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
  protected _updateChasing(): void {
    // If we can't see the player, switch to searching after chasingCounter
    // is up. The small timer period that the enemy continues chasing after it
    // has lost sight of the player can help it to get the player in its line
    // of sight once more
    if (this._canSeePlayer()) {
      this._chasingCounter.reset();
    } else {
      this._chasingCounter.next();
      if (this._chasingCounter.done()) {
        this._chasingCounter.reset();
        this._state = EnemyState.Searching;
        return;
      }
    }
    // Decide if we should go left or right
    const player = this._game.player;
    let closestPos = Polar.closestTheta(this.pos.theta, player.pos.theta);
    let diffTheta = player.pos.theta - closestPos;
    let minDiffTheta = (
      0.3 *
      (player.width + this.width) /
      player.pos.r
    );
    this._shouldGoLeft = diffTheta < -minDiffTheta;
    this._shouldGoRight = diffTheta > minDiffTheta;
    // Handle going left or right
    let speed = this._moveSpeed / this.pos.r;
    if (this._shouldGoLeft) {
      this.vel.theta = -speed;
      this._sprite.scale.x = -1;
    } else if (this._shouldGoRight) {
      this.vel.theta = speed;
      this._sprite.scale.x = 1;
    } else {
      this.vel.theta = 0;
    }
  }

  /**
   * Update the enemy if it is in the "knockback" state. Move by some constant
   * knockback velocity for a certain number of frames, then transition to
   * the "stunned" state.
   */
  protected _updateKnockback(): void {
    // Flip the enemy over while knocked back and stunned
    this._sprite.scale.y = -1;
    // Wait for counter to go to stunned state
    if (this._knockbackCounter.done()) {
      this._state = EnemyState.Stunned;
      this.vel.theta = 0;
    } else {
      this._knockbackCounter.next();
    }
  }

  /**
   * Update the enemy if it is in the "stunned" state. Wait a certain number
   * of frames and do not move, then transition to the "chasing" or "searching"
   * state depending on if we can see the player.
   */
  protected _updateStunned(): void {
    if (this._stunnedCounter.done()) {
      // Flip rightside up when done being stunned
      this._sprite.scale.y = 1;
      // Either chase or search depending on if the player is in sight
      if (this._canSeePlayer()) {
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
  public update(): void {
    super.update();
    this._healthBar.update(this);
    // All enemies are affected by gravity by default
    this.accel.r = Terrain.GRAVITY;
    // Do something different depending on the enemy state
    switch (this._state) {
      case EnemyState.Searching:
        this._updateSearching();
        break;
      case EnemyState.Chasing:
        this._updateChasing();
        break;
      case EnemyState.Knockback:
        this._updateKnockback();
        break;
      case EnemyState.Stunned:
        this._updateStunned();
        break;
    }
    // Update current animation
    this._sprite.nextFrame();
  }

  public knockback(knockbackVel: number, knockbackTime: number,
                   stunTime: number) {
    this._state = EnemyState.Knockback;
    this.vel.theta = knockbackVel;
    this._knockbackCounter.reset();
    this._knockbackCounter.max = knockbackTime;
    this._stunnedCounter.reset();
    this._stunnedCounter.max = stunTime;
  }

  public collide(other: GameObject, result: Collider.Result): void {
    super.collide(other, result);
    if (other.team() === 'player') {
      other.damage(this._damageAmount * LagFactor.get());
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
}

/**
 * Class of enemies that can move in all directions (up and down as well as
 * left and right). Not affected by gravity, since they can fly.
 */
export abstract class FlyingEnemy extends Enemy {
  protected _shouldGoUp: boolean = false;
  protected _shouldGoDown: boolean = false;

  public constructor(game: GameInstance) {
    super(game);
    this.accel.r = 0;
  }

  protected _updateSearching(): void {
    super._updateSearching();
    if (this._state !== EnemyState.Searching) {
      return;
    }
    // Flying enemies aren't affected by gravity while searching
    this.accel.r = 0;
    // Stop going up or down for now. Maybe later on add going up or down
    // to the list of possible search directions instead of just left and right
    this.vel.r = 0;
  }

  protected _updateChasing(): void {
    super._updateChasing();
    if (this._state !== EnemyState.Chasing) {
      return;
    }
    // Flying enemies aren't affected by gravity while chasing
    this.accel.r = 0;
    // Decide if we should go up or down
    let diffR = this._game.player.pos.r - this.pos.r;
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
export abstract class JumpingEnemy extends Enemy {
  private _searchingJumpCounter: Counter;
  private _chasingJumpCounter: Counter = new Counter(30);
  protected _shouldJump: boolean = false;
  protected _jumpSpeed: number = 18;

  private _getNewJumpCounterInterval(): number {
    return 60 + (90 * Math.random());
  }

  protected _updateSearching(): void {
    super._updateSearching();
    if (this._state !== EnemyState.Searching) {
      this._searchingJumpCounter = null;
      return;
    }
    // Make sure the jump counter has been initialized
    if (!this._searchingJumpCounter) {
      this._searchingJumpCounter = new Counter(this._getNewJumpCounterInterval());
    }
    // Update the jump counter, jump if it has expired
    if (this._isOnSolidGround()) {
      if (this._searchingJumpCounter.done()) {
        // Jump
        this.vel.r = this._jumpSpeed;
        // Reset jump counter with another randomized interval
        this._searchingJumpCounter.max = this._getNewJumpCounterInterval();
        this._searchingJumpCounter.reset();
      } else {
        // Increment jump counter
        this._searchingJumpCounter.next();
      }
    } else {
      // Not on solid ground, reset the jump counter
      this._searchingJumpCounter.reset();
    }
  }

  protected _updateChasing(): void {
    super._updateChasing();
    if (this._state !== EnemyState.Chasing) {
      this._chasingJumpCounter.count = this._chasingJumpCounter.max;
      return;
    }
    // Decide if we should jump
    const JUMP_THRESHOLD = 30;
    this._shouldJump = this._game.player.pos.r > this.pos.r + JUMP_THRESHOLD;
    // Only jump every so often when we are on the ground, don't jump constantly
    if (this._isOnSolidGround()) {
      this._chasingJumpCounter.next();
    }
    // Handle jumping if player is above this enemy
    if (this._shouldJump && this._isOnSolidGround() &&
        this._chasingJumpCounter.done()) {
      this.vel.r = this._jumpSpeed;
      this._chasingJumpCounter.reset();
    }
  }
}

/**
 * Class of enemies that spawn out of the ground instead of falling from the
 * sky. If you spawn out of the ground, you probably jump, so this class
 * naturally extends JumpingEnemy.
 */
export abstract class GroundSpawnEnemy extends JumpingEnemy {
  protected _setInitialPos(): void {
    const game = this._game;
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
    const blockBounds = game.level.blocks.map(block => block.getPolarBounds());
    const possibleRects = blockBounds.filter(rect => {
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
      const rect = possibleRects[0];
      this.pos.r = rect.r + (this.height / 2);
    } else {
      super._setInitialPos();
    }
  }
}
