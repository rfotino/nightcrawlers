import { GameObject } from './game-object';
import { Planet } from './planet';
import { KeyState } from '../input/keystate';

export class Player extends GameObject {
  private _sprite: PIXI.Sprite;
  private _canvas: HTMLCanvasElement;

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
    this.pos.theta = Math.random() * Math.PI * 2;
    this.pos.mirror(this._sprite);
    container.addChild(this._sprite);
  }

  public update(keyState: KeyState): void {
    super.update(keyState);
    // Handle turning due to user input
    let speed = 5 / this.pos.r;
    if (keyState.isDown('ArrowLeft') && !keyState.isDown('ArrowRight')) {
      this.vel.theta = -speed;
    } else if (keyState.isDown('ArrowRight')) {
      this.vel.theta = speed;
    } else {
      this.vel.theta = 0;
    }
  }

  private _draw(): void {
    // Resize the canvas
    this._canvas.width = this.width;
    this._canvas.height = this.height;
    // Draw a rectangle
    let ctx = this._canvas.getContext('2d');
    ctx.save();
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }
}