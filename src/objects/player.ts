import { GameObject } from './game-object';
import { Planet } from './planet';
import { KeyState } from '../input/keystate';
import { GameInstance } from '../game-instance';
import { Platform } from './platform';
import { Bullet } from './bullet';
import { Polar } from '../math/polar';
import { Collider } from '../math/collider';

export class Player extends GameObject {
  private _sprite: PIXI.Sprite;
  private _canvas: HTMLCanvasElement;
  private _onSolidGround: boolean = false;
  private _dirLeft: boolean = true;
  public score: number = 0;

  public get width(): number {
    return 25;
  }

  public get height(): number {
    return 50;
  }

  public constructor() {
    super();
    this._health = 100;
    this._canvas = document.createElement('canvas');
    this._draw();
    this._sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(this._canvas));
    this._sprite.anchor.x = this._sprite.anchor.y = 0.5;
    this.pos.r = Planet.RADIUS + (this.height / 2);
    this.pos.theta = 0;
    this.pos.mirror(this._sprite);
    this.addChild(this._sprite);
  }

  public type(): string { return 'player'; }

  public team(): string { return 'player'; }

  public update(game: GameInstance): void {
    super.update(game);
    // Handle turning due to user input
    let speed = 5 / this.pos.r;
    let leftArrow = game.keyState.isDown('ArrowLeft');
    let rightArrow = game.keyState.isDown('ArrowRight');
    if (leftArrow && !rightArrow) {
      this.vel.theta = -speed;
      this._dirLeft = true;
    } else if (rightArrow && !leftArrow) {
      this.vel.theta = speed;
      this._dirLeft = false;
    } else {
      this.vel.theta = 0;
    }
    // Set acceleration due to gravity
    this.accel.r = Planet.GRAVITY;
    // Handle jumping due to user input
    let jumpSpeed = 15;
    if (game.keyState.isPressed('ArrowUp') && this._onSolidGround) {
      this._onSolidGround = false;
      this.vel.r = jumpSpeed;
    }
    // Handle firing bullets due to user input
    if (game.keyState.isPressed(' ')) {
      let bullet = new Bullet(this, this._dirLeft);
      game.addGameObject(bullet);
    }
    // Not on solid ground unless we collide with something this frame
    this._onSolidGround = false;
  }

  public collide(other: GameObject, result: Collider.Result): void {
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
    // Resize the canvas
    this._canvas.width = this.width + 2;
    this._canvas.height = this.height + 2;
    // Draw a rectangle
    let ctx = this._canvas.getContext('2d');
    ctx.save();
    ctx.fillStyle = 'red';
    ctx.fillRect(1, 1, this.width, this.height);
    ctx.restore();
  }
}
