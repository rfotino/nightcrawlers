import { GameObject } from './game-object';
import { KeyState } from '../input/keystate';
import { GameInstance } from '../game-instance';
import * as Terrain from './terrain';
import { Bullet } from './bullet';
import { Polar } from '../math/polar';
import { Collider } from '../math/collider';

export class Player extends GameObject {
  private _sprite: PIXI.Sprite;
  private _canvas: HTMLCanvasElement;
  private _onSolidGround: boolean = false;
  private _dirLeft: boolean = true;
  private _ground: GameObject = null;
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
    this.pos.r = Terrain.Planet.RADIUS + (this.height / 2);
    this.pos.theta = 0;
    this.pos.mirror(this._sprite);
    this.addChild(this._sprite);
  }

  public type(): string { return 'player'; }

  public team(): string { return 'player'; }

  public update(game: GameInstance): void {
    super.update(game);
    // Add relative velocity from the ground
    this.vel.theta = this._ground ? this._ground.vel.theta : 0;
    // Handle turning due to user input
    let speed = 7 / this.pos.r;
    let leftArrow = game.keyState.isDown('ArrowLeft');
    let rightArrow = game.keyState.isDown('ArrowRight');
    if (leftArrow && !rightArrow) {
      this.vel.theta -= speed;
      this._dirLeft = true;
    } else if (rightArrow && !leftArrow) {
      this.vel.theta += speed;
      this._dirLeft = false;
    }
    // Set acceleration due to gravity
    this.accel.r = Terrain.Planet.GRAVITY;
    // Handle jumping due to user input
    let jumpSpeed = 17;
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
    this._ground = null;
  }

  public collide(other: GameObject, result: Collider.Result): void {
    switch (other.type()) {
      case 'planet':
      case 'platform':
      case 'block':
        if (result.bottom) {
          this._onSolidGround = true;
          this._ground = other;
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
