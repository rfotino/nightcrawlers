import { GameObject } from './game-object';
import { Planet } from './planet';
import { KeyState } from '../input/keystate';
import { Game } from '../game';
import { Platform } from './platform';

export class Player extends GameObject {
  private _sprite: PIXI.Sprite;
  private _canvas: HTMLCanvasElement;
  private _onSolidGround: boolean = false;
  private _ridingPlatform: Platform = null;

  public get width(): number {
    return 25;
  }
  public get height(): number {
    return 50;
  }

  public constructor(container: PIXI.Container) {
    super();
    this._canvas = document.createElement('canvas');
    this._draw();
    this._sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(this._canvas));
    this._sprite.anchor.x = this._sprite.anchor.y = 0.5;
    this.pos.r = Planet.RADIUS + (this.height / 2);
    this.pos.theta = 0;//Math.random() * Math.PI * 2;
    this.pos.mirror(this._sprite);
    container.addChild(this._sprite);
  }

  public update(game: Game): void {
    super.update(game);
    // Handle turning due to user input
    let speed = 5 / this.pos.r;
    let leftArrow = game.keyState.isDown('ArrowLeft');
    let rightArrow = game.keyState.isDown('ArrowRight');
    if (leftArrow && !rightArrow) {
      this.vel.theta = -speed;
    } else if (rightArrow && !leftArrow) {
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
      let playerTheta = this.pos.theta;
      while (playerTheta > maxTheta) {
        playerTheta -= Math.PI * 2;
      }
      while (playerTheta < minTheta) {
        playerTheta += Math.PI * 2;
      }
      if (this.pos.r < minR && this.prevPos.r >= minR) {
        if (playerTheta <= maxTheta) {
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
    // Handle jumping due to user input
    let jumpSpeed = 15;
    if (game.keyState.isPressed('ArrowUp') && this._onSolidGround) {
      this._onSolidGround = false;
      this.vel.r = jumpSpeed;
    }
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
