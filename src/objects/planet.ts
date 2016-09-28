import { GameObject } from './game-object';
import { Game } from '../game';
import { Polar } from '../math/polar';
import { Collider } from '../math/collider';

export class Planet extends GameObject {
  public static get RADIUS(): number { return 1500; }
  public static get GRAVITY(): number { return -1; }
  private _sprite: PIXI.Sprite;
  private _canvas: HTMLCanvasElement;

  public constructor() {
    super();
    this._canvas = document.createElement('canvas');
    this._draw();
    this._sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(this._canvas));
    this._sprite.anchor.x = this._sprite.anchor.y = 0.5;
    this.addChild(this._sprite);
  }

  public get radius() {
    return Planet.RADIUS;
  }

  private _draw(): void {
    // Resize canvas
    this._canvas.width = this._canvas.height = this.radius * 2;
    // Draw circle with spokes
    let ctx = this._canvas.getContext('2d');
    ctx.save();
    ctx.translate(this.radius, this.radius);
    ctx.fillStyle = 'white';
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (var i = 0; i < 20; i++) {
      let theta = (i / 20) * Math.PI * 2;
      ctx.moveTo(0, 0);
      ctx.lineTo(this.radius * Math.cos(theta), this.radius * Math.sin(theta));
    }
    ctx.stroke();
    ctx.restore();
  }

  public type(): string { return 'planet'; }

  /**
   * Planet pushes colliding objects out of itself.
   */
  public collide(other: GameObject, result: Collider.Result): void {
    if (result.top) {
      other.pos.r = this.radius + (other.getPolarBounds().height / 2);
      other.vel.r = 0;
    }
  }

  /**
   * Planet is just a big circle, which is a polar rectangle.
   */
  public getPolarBounds(): Polar.Rect {
    return new Polar.Rect(this.radius, 0, this.radius, Math.PI * 2);
  }
}
