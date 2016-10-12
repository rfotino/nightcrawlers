import { GameInstance } from '../game-instance';
import { GameObject } from './game-object';
import * as Terrain from './terrain';
import { Player } from './player';
import { Polar } from '../math/polar';
import { Collider } from '../math/collider';

export class Enemy extends GameObject {
  private _sprite: PIXI.Sprite;
  private _canvas: HTMLCanvasElement;
  private _onSolidGround: boolean = false;
  private _damageAmount: number = 0.25;
  protected _score: number = 50;
  protected _shouldGoLeft: boolean = false;
  protected _shouldGoRight: boolean = false;
  protected _shouldJump: boolean = false;
  protected _moveSpeed: number = 3;
  protected _jumpSpeed: number = 15;
  protected _flying: boolean = false;
  protected _flapCounter: number = 0;
  protected _maxFlapCounter: number = Infinity;

  public get width(): number {
    return 30;
  }
  
  public get height(): number {
    return 50;
  }

  public get z(): number {
    return 40;
  }

  public get score(): number {
    return this._score;
  }

  protected get _color(): string {
    return 'green';
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
    this._shouldJump = game.player.pos.r > this.pos.r;
  }

  protected _canJump(): boolean {
    return (
      this._onSolidGround ||
      (this._flying && this._flapCounter > this._maxFlapCounter)
    );
  }

  public update(game: GameInstance): void {
    super.update(game);
    // Use AI heuristic to see if we should go left, go right, jump, etc
    this._updateBehavior(game);
    // Make transparent if damaged
    this.alpha = this._health / this._maxHealth;
    // Increment flap counter
    if (this._onSolidGround) {
      this._flapCounter = 0;
    } else if (this._flying) {
      this._flapCounter++;
    }
    // Handle turning
    let speed = this._moveSpeed / this.pos.r;
    if (this._shouldGoLeft) {
      this.vel.theta = -speed;
    } else if (this._shouldGoRight) {
      this.vel.theta = speed;
    } else {
      this.vel.theta = 0;
    }
    // Set acceleration due to gravity
    this.accel.r = Terrain.GRAVITY;
    // Handle jumping if player is above this enemy
    if (this._shouldJump && this._canJump()) {
      this._onSolidGround = false;
      this.vel.r = this._jumpSpeed;
      this._flapCounter = 0;
    }
    // Not on solid ground unless we collide with something this frame
    this._onSolidGround = false;
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
