import { GameInstance } from '../game-instance';
import { GameObject } from './game-object';
import { Item } from './item';
import * as Terrain from './terrain';
import { Player } from './player';
import { FadingText } from './fading-text';
import { BloodSplatter, BigBloodSplatter } from './particles';
import { Polar } from '../math/polar';
import { Collider } from '../math/collider';
import { Counter } from '../math/counter';
import { Color } from '../graphics/color';
import { SpriteSheet } from '../graphics/spritesheet';
import { LagFactor } from '../math/lag-factor';
import { Config } from '../config';
import { Options } from '../options';

const enum Direction {
  None,
  Left,
  Right,
  Up,
  Down,
}

const enum EnemyState {
  Spawning,
  Searching,
  Chasing,
  AttackingWindUp,
  AttackingRecovery,
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

  protected static get WIDTH(): number { return 45; }
  protected static get HEIGHT(): number { return 8; }
  protected static get MARGIN(): number { return 8; }

  protected static _getBarTexture(): PIXI.Texture {
    if (!EnemyHealthBar._barTexture) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = EnemyHealthBar.WIDTH + 2;
      canvas.height = EnemyHealthBar.HEIGHT + 2;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = EnemyHealthBar.HEIGHT - 2;
      ctx.beginPath();
      const radius = 350;
      const theta = canvas.width / radius;
      ctx.arc(
        canvas.width / 2,
        radius + (canvas.height / 2),
        radius,
        (-theta / 2) - (Math.PI / 2),
        (theta / 2) - (Math.PI / 2)
      );
      ctx.stroke();
      EnemyHealthBar._barTexture = PIXI.Texture.fromCanvas(canvas);
    }
    return EnemyHealthBar._barTexture;
  }

  public constructor(enemy: Enemy) {
    super();
    const texture = EnemyHealthBar._getBarTexture();
    const margin = EnemyHealthBar.MARGIN;
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
export class Enemy extends GameObject {
  protected _enemyType: string;
  protected _sprite: SpriteSheet;
  protected _healthBar: EnemyHealthBar;
  protected _shouldGoLeft: boolean = false;
  protected _shouldGoRight: boolean = false;
  protected _knockbackCounter: Counter = new Counter(0);
  protected _stunnedCounter: Counter = new Counter(0);
  protected _state: EnemyState = EnemyState.Spawning;
  protected _searchDir: Direction = Direction.None;
  protected _chasingCounter: Counter = new Counter(45);
  protected _spawningCounter: Counter;
  protected _attackWindUpCounter: Counter;
  protected _attackRecoveryCounter: Counter;
  protected _facingLeft: boolean = false;

  public get z(): number {
    return 40;
  }

  public get attributes(): any {
    return Config.enemies[this._enemyType];
  }

  public static fromType(game: GameInstance, enemyType: string): Enemy {
    const attributes = Config.enemies[enemyType];
    switch (attributes.class) {
      case 'flying':
        return new FlyingEnemy(game, enemyType);
      case 'jumping':
        return new JumpingEnemy(game, enemyType);
      case 'groundspawn':
        return new GroundSpawnEnemy(game, enemyType);
      default:
        throw (
          `Unknown enemy class ${attributes.class} for enemy type ${enemyType}`
        );
    }
  }

  /**
   * Default to spawning 300 units above the player and within 200 units to
   * the left or right. Override this in subclasses to spawn in different
   * locations.
   */
  protected _setInitialPos(): void {
    const r = this._game.player.pos.r + 300;
    const theta = this._game.player.pos.theta + (Math.random() - 0.5) * 400 / r;
    this.pos.set(r, theta);
  }

  public constructor(game: GameInstance, enemyType: string) {
    super(game);
    this._enemyType = enemyType;
    this._health = this._maxHealth = this.attributes.health;
    this._spawningCounter = new Counter(this.attributes.spawnTime);
    this._attackWindUpCounter = new Counter(this.attributes.attack.windUpTime);
    this._attackRecoveryCounter = new Counter(this.attributes.attack.recoveryTime);
    this._sprite = new SpriteSheet(
      PIXI.loader.resources[this.attributes.sprite.resource].texture,
      this.attributes.sprite.frames.width,
      this.attributes.sprite.frames.height,
      'idle', // default animation
      this.attributes.animations
    );
    this._sprite.anchor.set(
      this.attributes.sprite.anchor.x,
      this.attributes.sprite.anchor.y
    );
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
    // Always spawn facing the player
    this._facePlayer();
  }

  /**
   * Optimization so that we don't check collision of enemies with each other,
   * etc. May need to be augmented with things like player projectiles in the
   * future.
   */
  public collidesWith(otherType: string): boolean {
    switch (otherType) {
      case 'block':
      case 'platform':
        return true;
      default:
        return false;
    }
  }

  public type(): string { return 'enemy'; }

  public team(): string { return 'enemy'; }

  public enemyType(): string { return this._enemyType; }

  /**
   * Add points to player score and show the amount of points where
   * the enemy used to be
   */
  public kill(): void {
    if (!this.alive) {
      return;
    }
    super.kill();
    // Add this enemy's points to the score and display the points where the
    // enemy used to be
    const points = (
      this.attributes.points *
      this._game.scoreMultiplier.value
    );
    this._game.player.score += points;
    this._game.scoreMultiplier.increase(this.attributes.points);
    this._game.addGameObject(new FadingText(
      this._game,
      `+${points}`,
      this.pos,
      { fontSize: 36, fill: 'white' }
    ));
    // Also add a blood splatter if on normal blood level
    if (Options.BLOOD_NORMAL === this._game.options.blood) {
      const splatter = new BloodSplatter(this._game, this.pos, this.vel);
      this._game.addGameObject(splatter);
    }
    // And maybe spawn an item
    const itemDiceRoll = Math.random();
    let diceRollFloor = 0;
    for (let i = 0; i < this.attributes.items.length; i++) {
      const itemAttr = this.attributes.items[i];
      const diceRollCeiling = diceRollFloor + itemAttr.chance;
      if (itemDiceRoll >= diceRollFloor && itemDiceRoll < diceRollCeiling) {
        const item = new Item(
          this._game,
          itemAttr.type,
          this.pos.r,
          this.pos.theta
        );
        this._game.addGameObject(item);
      }
      diceRollFloor = diceRollCeiling;
    }
  }

  /**
   * Show visual indication that the enemy was damaged.
   */
  public damage(amount: number): void {
    super.damage(amount);
    // Add red fading text with amount of damage, like "-10"
    this._game.addGameObject(new FadingText(
      this._game,
      `-${amount.toFixed()}`,
      this.pos,
      { fontSize: 28, fill: 'red' },
      15 // timer
    ));
    // Add blood splatter if on blood level extra
    if (Options.BLOOD_EXTRA === this._game.options.blood) {
      const splatter = new BigBloodSplatter(this._game, this.pos, this.vel);
      this._game.addGameObject(splatter);
    }
  }

  /**
   * Returns true if a polar line from the center of the enemy to the center
   * of the player intersects no more than 1 horizontal line and no more than
   * 1 vertical line taken from the block bounds.
   */
  protected _canSeePlayer(): boolean {
    const line = new Polar.Line(
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
   * Check if we are close enough to attack the player
   */
  protected _canAttackPlayer(): boolean {
    const player = this._game.player;
    const rDistToPlayer = Math.abs(player.pos.r - this.pos.r);
    const thetaDistToPlayer = (
      Math.abs(player.pos.theta - this.pos.theta) % (Math.PI * 2)
    );
    const arcDistToPlayer = thetaDistToPlayer * this.pos.r;
    const rAttackDist = this.attributes.attack.distances.y;
    const arcAttackDist = this.attributes.attack.distances.x;
    return rDistToPlayer < rAttackDist && arcDistToPlayer < arcAttackDist;
  }

  /**
   * Creates a polar rectangle of the hitbox location, to use for attacking
   * the player.
   */
  protected _getHitbox(): Polar.Rect {
    const height = this.attributes.size.height;
    const arcWidth = (
      this.attributes.attack.reach +
      (this.attributes.size.width / 2)
    );
    const thetaWidth = arcWidth / this.pos.r;
    return new Polar.Rect(
      this.pos.r + (this.attributes.size.height / 2),
      this._facingLeft ? this.pos.theta - thetaWidth : this.pos.theta,
      height,
      thetaWidth
    );
  }

  /**
   * Make the sprite face right or left depending on the closest position
   * of the player.
   */
  protected _facePlayer(): void {
    const player = this._game.player;
    const closestPos = Polar.closestTheta(this.pos.theta, player.pos.theta);
    const diffTheta = player.pos.theta - closestPos;
    if (diffTheta < 0) {
      this._sprite.scale.x = -1;
      this._facingLeft = true;
    } else if (diffTheta > 0) {
      this._sprite.scale.x = 1;
      this._facingLeft = false;
    }
  }

  /**
   * Initialize an attack by playing the proper animation, transitioning to the
   * correct state, etc.
   */
  protected _initAttack(): void {
    this._state = EnemyState.AttackingWindUp;
    this._attackWindUpCounter.reset();
    this._sprite.stopAnim();
    this._sprite.playAnimOnce('attack');
  }

  /**
   * Update the enemy if it is in the "spawning" state, where it can't attack
   * or chase the player but just fades into play so the player has some
   * warning.
   */
  protected _updateSpawning(): void {
    if (this._spawningCounter.done()) {
      this._state = EnemyState.Searching;
    } else {
      this._spawningCounter.next();
      // While spawning, enemies fade in, are not affected by gravity, and
      // play the 'spawn' animation if available
      this.alpha = this._spawningCounter.percent();
      this.accel.r = 0;
      this._sprite.playAnim('spawn');
    }
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
    const moveSpeed = this.attributes.moveSpeed;
    const moveDist = Math.abs((this.pos.theta - this.prevPos.theta) * this.pos.r);
    if (moveDist < moveSpeed / 2 ||
        this._searchDir === Direction.None) {
      if (Math.random() < 0.5) {
        this._searchDir = Direction.Left;
        this._sprite.scale.x = -1;
        this._facingLeft = true;
      } else {
        this._searchDir = Direction.Right;
        this._sprite.scale.x = 1;
        this._facingLeft = false;
      }
    }
    // Update the theta velocity based on the current direction. Search speed
    // is slower than normal movement speed
    const searchSpeed = 0.6 * moveSpeed / this.pos.r;
    if (this._searchDir === Direction.Left) {
      this.vel.theta = -searchSpeed;
    } else {
      this.vel.theta = searchSpeed;
    }
    // Set the correct animation
    this._sprite.playAnim('walk');
  }

  /**
   * Update the enemy if it is in the "chasing" state. Try to get to the
   * player, and if they go out of sight then go back to the "searching" state.
   */
  protected _updateChasing(): void {
    // If we can attack the player, definitely do that instead
    if (this._canAttackPlayer()) {
      this._initAttack();
      return;
    }
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
    const closestPos = Polar.closestTheta(this.pos.theta, player.pos.theta);
    const diffTheta = player.pos.theta - closestPos;
    // Use min diff to prevent flicker from one side to another when very close
    // to the player's theta
    const minDiffTheta = this.attributes.attack.distances.x / this.pos.r;
    this._shouldGoLeft = diffTheta < -minDiffTheta;
    this._shouldGoRight = diffTheta > minDiffTheta;
    // Handle going left or right
    const speed = this.attributes.moveSpeed / this.pos.r;
    if (this._shouldGoLeft) {
      this.vel.theta = -speed;
      this._sprite.scale.x = -1;
      this._facingLeft = true;
    } else if (this._shouldGoRight) {
      this.vel.theta = speed;
      this._sprite.scale.x = 1;
      this._facingLeft = false;
    } else {
      this.vel.theta = 0;
    }
    // Play the run animation when in chase mode by default
    this._sprite.playAnim('run');
  }

  /**
   * Update the enemy if it is in the "attacking wind up" state. Go through the
   * attack animation, spawn a hitbox, then go to the recovery state.
   */
  protected _updateAttackingWindUp(): void {
    // Shouldn't be moving left and right, should be still and facing the player
    this.vel.theta = 0;
    this._facePlayer();
    // Check If we're done
    if (this._attackWindUpCounter.done()) {
      // Spawn hitbox, hurt the player if it intersects with them
      const hitbox = this._getHitbox();
      const playerBounds = this._game.player.getPolarBounds();
      if (hitbox.intersects(playerBounds)) {
        this._game.player.damage(this.attributes.attack.damage);
      }
      // Transition to the attack recovery stage
      this._attackRecoveryCounter.reset();
      this._state = EnemyState.AttackingRecovery;
    } else {
      this._attackWindUpCounter.next();
    }
  }

  /**
   * Update the enemy if it is in the "attacking recovery" state. Just wait a
   * bit without moving anywhere, then check if we should go back to attack
   * wind up or back to chasing.
   */
  protected _updateAttackingRecovery(): void {
    if (this._attackRecoveryCounter.done()) {
      // If we are still close enough to the player, attack again
      if (this._canAttackPlayer()) {
        this._initAttack();
      } else {
        // Otherwise just chase them
        this._state = EnemyState.Chasing;
      }
    } else {
      this._attackRecoveryCounter.next();
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
    // Show stunned animation
    this._sprite.playAnim('stunned');
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
    // Show stunned animation
    this._sprite.playAnim('stunned');
  }

  /**
   * Update the enemy behavior based on its current state.
   */
  public updatePreCollision(): void {
    super.updatePreCollision();
    this._healthBar.update(this);
    // All enemies are affected by gravity by default
    this.accel.r = Terrain.GRAVITY;
    // Enemies are opaque by default
    this.alpha = 1;
    // Do something different depending on the enemy state
    switch (this._state) {
      case EnemyState.Spawning:
        this._updateSpawning();
        break;
      case EnemyState.Searching:
        this._updateSearching();
        break;
      case EnemyState.Chasing:
        this._updateChasing();
        break;
      case EnemyState.AttackingWindUp:
        this._updateAttackingWindUp();
        break;
      case EnemyState.AttackingRecovery:
        this._updateAttackingRecovery();
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

  public getPolarBounds(): Polar.Rect {
    const size = this.attributes.size;
    const widthTheta = size.width / this.pos.r;
    return new Polar.Rect(
      this.pos.r + (size.height / 2),
      this.pos.theta - (widthTheta / 2),
      size.height,
      widthTheta
    );
  }
}

/**
 * Class of enemies that can move in all directions (up and down as well as
 * left and right). Not affected by gravity, since they can fly.
 */
export class FlyingEnemy extends Enemy {
  protected _shouldGoUp: boolean = false;
  protected _shouldGoDown: boolean = false;

  public constructor(game: GameInstance, enemyType: string) {
    super(game, enemyType);
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
    const moveSpeed = this.attributes.moveSpeed;
    if (this._shouldGoUp) {
      this.vel.r = moveSpeed;
    } else if (this._shouldGoDown) {
      this.vel.r = -moveSpeed;
    } else {
      this.vel.r = 0;
    }
  }

  /**
   * Flying enemies don't move up and down while attacking.
   */
  protected _updateAttackingWindUp(): void {
    super._updateAttackingWindUp();
    this.accel.r = 0;
    this.vel.r = 0;
  }

  /**
   * Flying enemies don't move up and down while attacking.
   */
  protected _updateAttackingRecovery(): void {
    super._updateAttackingRecovery();
    this.accel.r = 0;
    this.vel.r = 0;
  }
}

/**
 * Class of enemies that are affected by gravity and can only jump if they
 * are on solid ground.
 */
export class JumpingEnemy extends Enemy {
  private _searchingJumpCounter: Counter;
  private _chasingJumpCounter: Counter = new Counter(30);
  protected _shouldJump: boolean = false;

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
        this.vel.r = this.attributes.jumpSpeed;
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
    // Show jump animation if we're not on solid ground
    if (!this._isOnSolidGround()) {
      this._sprite.playAnim('jump');
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
      this.vel.r = this.attributes.jumpSpeed;
      this._chasingJumpCounter.reset();
    }
    // Show jump animation if we're not on solid ground
    if (!this._isOnSolidGround()) {
      this._sprite.playAnim('jump');
    }
  }
}

/**
 * Class of enemies that spawn out of the ground instead of falling from the
 * sky. If you spawn out of the ground, you probably jump, so this class
 * naturally extends JumpingEnemy.
 */
export class GroundSpawnEnemy extends JumpingEnemy {
  protected _setInitialPos(): void {
    const game = this._game;
    // Spawn the enemy on a block near to the player. First choose an angle
    // to spawn at that is between minDist and maxDist radians away from the
    // player.
    const rand = Math.random();
    const minDist = 150 / this._game.player.pos.r;
    const maxDist = 300 / this._game.player.pos.r;
    const offset = minDist + (rand * (maxDist - minDist));
    if (rand < 0.5) {
      this.pos.theta = game.player.pos.theta - offset;
    } else {
      this.pos.theta = game.player.pos.theta + offset;
    }
    // Then find all blocks that can be found at that angle and sort them by
    // distance from the player.
    const blockBounds = game.level.blocks.map(block => block.getPolarBounds());
    const possibleRects = blockBounds.filter(rect => {
      return Polar.thetaBetween(
        this.pos.theta,
        rect.theta,
        rect.theta + rect.width
      );
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
