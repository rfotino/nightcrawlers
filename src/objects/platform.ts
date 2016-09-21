import { GameObject } from './game-object';
import { Planet } from './planet';
import { Game } from '../game';
import { PolarCoord } from '../math/polar-coord';

export class Platform extends GameObject {
  private _sprite: PIXI.Sprite;
  private _canvas: HTMLCanvasElement;
  private _width: number;

  public get width() {
    return this._width;
  }

  public get height() {
    return 10;
  }

  public constructor(container: PIXI.Container,
                     r: number, theta: number, width: number) {
    super();
    this.pos.r = r;
    this.pos.theta = theta;
    this._width = width;
    this._canvas = document.createElement('canvas');
    this._draw();
    this._sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(this._canvas));
    this._sprite.anchor.x = 1 - (0.5 * this.height / this._canvas.width);
    this._sprite.anchor.y = this.height / this._canvas.height;
    this.pos.mirror(this._sprite);
    container.addChild(this._sprite);
  }

  private _draw(): void {
    // Resize canvas
    let w = this.pos.r * (1 - Math.cos(this.width));
    let h = this.pos.r * Math.sin(this.width);
    this._canvas.width = w + (2 * this.height);
    this._canvas.height = h + (2 * this.height);
    // Draw platform
    let ctx = this._canvas.getContext('2d');
    ctx.save();
    ctx.translate(this.height, this.height);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = this.height;
    ctx.beginPath();
    ctx.arc(-this.pos.r + w, 0, this.pos.r, 0, this.width);
    ctx.stroke();
    ctx.restore();
  }

  public update(game: Game): void {
    super.update(game);
    this._sprite.rotation = this.pos.theta;
  }
}