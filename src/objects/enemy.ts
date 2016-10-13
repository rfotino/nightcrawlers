import { GameInstance } from '../game-instance';
import { GameObject } from './game-object';
import * as Terrain from './terrain';
import { Player } from './player';
import { Polar } from '../math/polar';
import { Collider } from '../math/collider';

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

  protected _updateBehavior(game: GameInstance): void {
    let diffTheta = (game.player.pos.theta - this.pos.theta) % (Math.PI * 2);
    let minDiffTheta = (
      0.3 *
      (game.player.width + this.width) /
      game.player.pos.r
    );
    this._shouldGoLeft = diffTheta < -minDiffTheta;
    this._shouldGoRight = diffTheta > minDiffTheta;
  }

  public update(game: GameInstance): void {
    super.update(game);
    // Use AI heuristic to see if we should go left, go right, jump, etc
    this._updateBehavior(game);
    // Make transparent if damaged
    this.alpha = this._health / this._maxHealth;
    // Handle turning
    let speed = this._moveSpeed / this.pos.r;
    if (this._shouldGoLeft) {
      this.vel.theta = -speed;
    } else if (this._shouldGoRight) {
      this.vel.theta = speed;
    } else {
      this.vel.theta = 0;
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

  protected _updateBehavior(game: GameInstance): void {
    super._updateBehavior(game);
    let diffR = game.player.pos.r - this.pos.r;
    let minDiffR = 5;
    this._shouldGoUp = diffR > minDiffR;
    this._shouldGoDown = diffR < -minDiffR;
  }

  public update(game: GameInstance): void {
    super.update(game);
    // Go up or down
    if (this._shouldGoUp) {
      this.vel.r = this._moveSpeed;
    } else if (this._shouldGoDown) {
      this.vel.r = -this._moveSpeed;
    } else {
      this.vel.r = 0;
    }
    // Not on solid ground unless we collide with something this frame
    this._onSolidGround = false;
  }
}

/**
 * Class of enemies that are affected by gravity and can only jump if they
 * are on solid ground.
 */
export class JumpingEnemy extends Enemy {
  protected _shouldJump: boolean = false;
  protected _jumpSpeed: number = 15;

  protected _updateBehavior(game: GameInstance): void {
    super._updateBehavior(game);
    this._shouldJump = game.player.pos.r > this.pos.r;
  }

  public update(game: GameInstance): void {
    super.update(game);
    // Handle jumping if player is above this enemy
    if (this._shouldJump && this._onSolidGround) {
      this._onSolidGround = false;
      this.vel.r = this._jumpSpeed;
    }
    // Not on solid ground unless we collide with something this frame
    this._onSolidGround = false;
  }
}
