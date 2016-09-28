import { GameObject } from './game-object';
import { Planet } from './planet';
import { Game } from '../game';
import { Polar } from '../math/polar';
import { Collider } from '../math/collider';

export class Platform extends GameObject {
  private _sprite: PIXI.Sprite;
  private _canvas: HTMLCanvasElement;
  private _size: Polar.Coord;

  public get size() {
    return this._size;
  }

  public constructor(r: number, theta: number, width: number) {
    super();
    this.pos.r = r;
    this.pos.theta = theta;
    this._size = new Polar.Coord(10, width);
    this._canvas = document.createElement('canvas');
    this._draw();
    this._sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(this._canvas));
    this._sprite.anchor.x = 1 - (0.5 * this._size.r / this._canvas.width);
    this._sprite.anchor.y = this._size.r / this._canvas.height;
    this.pos.mirror(this._sprite);
    this.addChild(this._sprite);
  }

  private _draw(): void {
    // Resize canvas
    let w = this.pos.r * (1 - Math.cos(this._size.theta));
    let h = this.pos.r * Math.sin(this._size.theta);
    this._canvas.width = w + (2 * this._size.r);
    this._canvas.height = h + (2 * this._size.r);
    // Draw platform
    let ctx = this._canvas.getContext('2d');
    ctx.save();
    ctx.translate(this._size.r, this._size.r);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = this._size.r;
    ctx.beginPath();
    ctx.arc(-this.pos.r + w, 0, this.pos.r, 0, this._size.theta);
    ctx.stroke();
    ctx.restore();
  }

  public type(): string { return 'platform'; }

  public update(game: Game): void {
    super.update(game);
    this._sprite.rotation = this.pos.theta;
  }

  public collide(other: GameObject, result: Collider.Result): void {
    if (result.top) {
      other.pos.r = this.pos.r + (other.getPolarBounds().height / 2);
      other.vel.r = 0;
    }
  }

  public getPolarBounds(): Polar.Rect {
    return new Polar.Rect(
      this.pos.r, this.pos.theta,
      this._size.r, this._size.theta
    );
  }
}