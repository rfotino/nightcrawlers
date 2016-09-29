import { GameInstance } from '../game-instance';
import { GameObject } from './game-object';
import { Planet } from './planet';
import { Platform } from './platform';
import { Player } from './player';
import { Polar } from '../math/polar';
import { Collider } from '../math/collider';

export class Enemy extends GameObject {
  private _sprite: PIXI.Sprite;
  private _canvas: HTMLCanvasElement;
  private _onSolidGround: boolean = false;
  private _damageAmount: number = 0.25;
  private _maxHealth: number = 20;

  public get width() {
    return 30;
  }
  
  public get height() {
    return 50;
  }

  public constructor(r: number, theta: number) {
    super();
    this._health = this._maxHealth;
    this._draw();
    this._sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(this._canvas));
    this._sprite.anchor.set(0.5, 0.5);
    this.pos.set(r, theta);
    this.pos.mirror(this._sprite);
    this.addChild(this._sprite);
  }

  public type(): string { return 'enemy'; }

  public team(): string { return 'enemy'; }

  public update(game: GameInstance): void {
    super.update(game);
    // Make transparent if damaged
    this.alpha = this._health / this._maxHealth;
    // Handle turning
    let speed = 3 / this.pos.r;
    let diffTheta = (game.player.pos.theta - this.pos.theta) % (Math.PI * 2);
    let minDiffTheta = (
      0.3 *
      (game.player.width + this.width) /
      game.player.pos.r
    );
    let goLeft = diffTheta < -minDiffTheta;
    let goRight = diffTheta > minDiffTheta;
    if (goLeft) {
      this.vel.theta = -speed;
    } else if (goRight) {
      this.vel.theta = speed;
    } else {
      this.vel.theta = 0;
    }
    // Set acceleration due to gravity
    this.accel.r = Planet.GRAVITY;
    // Handle jumping if player is above this enemy
    let jumpSpeed = 15;
    let shouldJump = game.player.pos.r > this.pos.r;
    if (shouldJump && this._onSolidGround) {
      this._onSolidGround = false;
      this.vel.r = jumpSpeed;
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
        if (result.bottom) {
          this._onSolidGround = true;
        }
        break;
      case 'platform':
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
    ctx.fillStyle = 'green';
    ctx.fillRect(1, 1, this.width, this.height);
  }
}
