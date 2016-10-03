import { GameObject } from './game-object';
import { GameInstance } from '../game-instance';
import { Polar } from '../math/polar';
import { Collider } from '../math/collider';

abstract class Terrain extends GameObject {
  protected _size: Polar.Coord;
  protected _solidLeft: boolean;
  protected _solidRight: boolean;
  protected _solidTop: boolean;
  protected _solidBottom: boolean;

  public get size(): Polar.Coord {
    return this._size;
  }
  
  public get movable(): boolean { return false; }

  public collide(other: GameObject, result: Collider.Result): void {
    // Do nothing if the other object is not movable
    if (!other.movable) {
      return;
    }
    // Otherwise move the other object out of this terrain object and
    // stop it from moving
    let bounds = other.getPolarBounds();
    if (result.left && this._solidLeft) {
      let prevMin = this.pos.theta - (bounds.width / 2);
      let closest = Polar.closestTheta(prevMin, other.pos.theta);
      other.pos.theta = closest;
      other.vel.theta = Math.min(0, other.vel.theta);
    }
    if (result.right && this._solidRight) {
      let prevMax = this.pos.theta + this.size.theta + (bounds.width / 2);
      let closest = Polar.closestTheta(prevMax, other.pos.theta);
      other.pos.theta = closest;
      other.vel.theta = Math.max(0, other.vel.theta);
    }
    if (result.top && this._solidTop) {
      let prevMin = this.pos.r + (bounds.height / 2);
      other.pos.r = prevMin;
      other.vel.r = Math.max(0, other.vel.r);
    }
    if (result.bottom && this._solidBottom) {
      let prevMax = this.pos.r - this.size.r - (bounds.height / 2);
      other.pos.r = prevMax;
      other.vel.r = Math.min(0, other.vel.r);
    }
  }

  public getPolarBounds(): Polar.Rect {
    return new Polar.Rect(
      this.pos.r, this.pos.theta,
      this._size.r, this._size.theta
    );
  }
}

export class Platform extends Terrain {
  protected _sprite: PIXI.Sprite;
  protected _canvas: HTMLCanvasElement;

  public constructor(r: number, theta: number, width: number) {
    super();
    this.pos.r = r;
    this.pos.theta = theta;
    this._size = new Polar.Coord(10, width);
    this._canvas = document.createElement('canvas');
    this._draw();
    this._sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(this._canvas));
    this._sprite.anchor.x = 1 - (this._size.r / this._canvas.width);
    this._sprite.anchor.y = this._size.r / this._canvas.height;
    this.pos.mirror(this._sprite);
    this.addChild(this._sprite);
    // By default, platforms only have a solid top
    this._solidLeft = this._solidRight = this._solidBottom = false;
    this._solidTop = true;
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
    ctx.arc(
      -this.pos.r + w, 0,
      this.pos.r - (this._size.r / 2), 0,
      this._size.theta
    );
    ctx.stroke();
    ctx.restore();
  }

  public type(): string { return 'platform'; }

  public update(game: GameInstance): void {
    super.update(game);
    this._sprite.rotation = this.pos.theta;
  }
}

export class Block extends Terrain {
  protected _sprite: PIXI.Sprite;
  protected _canvas: HTMLCanvasElement;

  public constructor(r: number, theta: number, height: number, width: number) {
    super();
    this.pos.r = r;
    this.pos.theta = theta;
    this._size = new Polar.Coord(height, width);
    this._canvas = document.createElement('canvas');
    this._draw();
    this._sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(this._canvas));
    this._sprite.anchor.x = 1 - (this._size.r / this._canvas.width);
    this._sprite.anchor.y = this._size.r / this._canvas.height;
    this.pos.mirror(this._sprite);
    this.addChild(this._sprite);
    // Blocks can't be entered from any side, unlike platforms
    this._solidLeft = true;
    this._solidRight = true;
    this._solidBottom = true;
    this._solidTop = true;
  }

  private _draw(): void {
    // Resize canvas
    let w = this.pos.r * (1 - Math.cos(this._size.theta));
    let h = this.pos.r * Math.sin(this._size.theta);
    this._canvas.width = w + (2 * this._size.r);
    this._canvas.height = h + (2 * this._size.r);
    // Draw block
    let ctx = this._canvas.getContext('2d');
    ctx.save();
    ctx.translate(this._size.r, this._size.r);
    ctx.strokeStyle = 'rgb(220, 220, 220)';
    ctx.lineWidth = this._size.r;
    ctx.beginPath();
    ctx.arc(
      -this.pos.r + w, 0,
      this.pos.r - (this._size.r / 2), 0,
      this._size.theta
    );
    ctx.stroke();
    ctx.restore();
  }

  public type(): string { return 'block'; }

  public update(game: GameInstance): void {
    super.update(game);
    this._sprite.rotation = this.pos.theta;
  }
}

export const GRAVITY: number = -1;
