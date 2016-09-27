import { Game } from '../game';
import { GameObject } from './game-object';
import { Planet } from './planet';
import { Platform } from './platform';
import { PolarCoord } from '../math/polar-coord';

export class Enemy extends GameObject {
  private _sprite: PIXI.Sprite;
  private _canvas: HTMLCanvasElement;
  private _onSolidGround: boolean = false;
  private _ridingPlatform: Platform = null;

  public get width() {
    return 30;
  }
  
  public get height() {
    return 50;
  }

  public constructor(r: number, theta: number) {
    super();
    this._draw();
    this._sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(this._canvas));
    this._sprite.anchor.set(0.5, 0.5);
    this.pos.set(r, theta);
    this.pos.mirror(this._sprite);
    this.addChild(this._sprite);
  }

  public update(game: Game): void {
    super.update(game);
    // Handle turning
    let speed = 3 / this.pos.r;
    let diffTheta = (game.player.pos.theta - this.pos.theta) % (Math.PI * 2);
    let minDiffTheta = (
      ((game.player.width + this.width) / 2) / 
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
    // Handle collision with the planet
    this._onSolidGround = false;
    let minR = Planet.RADIUS + (this.height / 2);
    if (this.pos.r <= minR) {
      this.pos.r = minR;
      this._onSolidGround = true;
      this.vel.r = 0;
    }
    // Handle collision with platforms
    this._ridingPlatform = null;
    game.platforms.forEach(platform => {
      let minR = platform.pos.r + (this.height / 2);
      let minTheta = platform.pos.theta;
      let maxTheta = platform.pos.theta + platform.width;
      let theta = this.pos.theta;
      while (theta > maxTheta) {
        theta -= Math.PI * 2;
      }
      while (theta < minTheta) {
        theta += Math.PI * 2;
      }
      if (this.pos.r < minR && this.prevPos.r >= minR) {
        if (theta <= maxTheta) {
          this.pos.r = minR;
          this._onSolidGround = true;
          this._ridingPlatform = platform;
          this.vel.r = 0;
        }
      }
    });
    if (null !== this._ridingPlatform) {
      this.pos.theta += this._ridingPlatform.vel.theta;
    }
    // Handle jumping if player is above this enemy
    let jumpSpeed = 15;
    let shouldJump = game.player.pos.r > this.pos.r;
    if (shouldJump && this._onSolidGround) {
      this._onSolidGround = false;
      this.vel.r = jumpSpeed;
    }
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
