import { GameObject } from './game-object';
import { GameInstance } from '../game-instance';
import { Polar } from '../math/polar';
import { Color } from '../graphics/color';
import { Collider } from '../math/collider';

abstract class Terrain extends GameObject {
  protected _size: Polar.Coord;
  protected _solidLeft: boolean;
  protected _solidRight: boolean;
  protected _solidTop: boolean;
  protected _solidBottom: boolean;
  protected _sprite: PIXI.Sprite;

  public get z(): number {
    return 10;
  }

  public get size(): Polar.Coord {
    return this._size;
  }
  
  public get movable(): boolean { return false; }

  public constructor(r: number, theta: number, height: number, width: number,
                     color: Color | string) {
    super();
    // Set up dimensions
    this.pos.r = r;
    this.pos.theta = theta;
    this._size = new Polar.Coord(height, width);
    // Increase visual height and width by 1 pixel to prevent seams between
    // adjacent terrain elements.
    height += 1.5;
    width += 1.5 / r;
    // Create canvas to use as sprite texture
    let canvas = document.createElement('canvas');
    // Resize canvas
    let w = 2 * r * Math.sin(width / 2);
    let h = r - ((r - height) * Math.cos(width / 2));
    canvas.width = w + 2;
    canvas.height = h + 2;
    // Draw platform
    let ctx = canvas.getContext('2d');
    ctx.translate(1, 1);
    ctx.strokeStyle = color.toString();
    ctx.lineWidth = height;
    ctx.beginPath();
    let startAngle = -(Math.PI / 2) - (width / 2);
    ctx.arc(
      w / 2, r,
      r - (height / 2),
      startAngle,
      startAngle + width
    );
    ctx.stroke();
    // Create sprite from canvas
    this._sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(canvas));
    this._sprite.anchor.x = 0.5;
    this._sprite.anchor.y = 1 / canvas.height;
    this._mirrorList.push(this._sprite);
    this.addChild(this._sprite);
    this.rotation = width / 2;
  }

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
  private _rMin: number;
  private _rMax: number;
  private _thetaMin: number;
  private _thetaMax: number;

  public constructor(r: number, theta: number, height: number, width: number,
                     moves: boolean = false,
                     rate: number = 0,
                     rPrime: number = r,
                     thetaPrime: number = theta) {
    super(r, theta, height, width, new Color(255, 255, 255));
    // Assign animation characteristics for moving between r and rPrime and
    // theta and thetaPrime every rate frames
    if (moves && rate > 0) {
      this.vel.r = (rPrime - r) / rate;
      this.vel.theta = (thetaPrime - theta) / rate;
    }
    this._rMin = Math.min(r, rPrime);
    this._rMax = Math.max(r, rPrime);
    this._thetaMin = Math.min(theta, thetaPrime);
    this._thetaMax = Math.max(theta, thetaPrime);
    // By default, platforms only have a solid top
    this._solidLeft = this._solidRight = this._solidBottom = false;
    this._solidTop = true;
  }

  public type(): string { return 'platform'; }

  public update(game: GameInstance): void {
    super.update(game);
    if (this.pos.r <= this._rMin || this.pos.r >= this._rMax) {
      this.vel.r *= -1;
    }
    if (this.pos.theta <= this._thetaMin || this.pos.theta >= this._thetaMax) {
      this.vel.theta *= -1;
    }
  }
}

export class Block extends Terrain {
  public constructor(r: number, theta: number, height: number, width: number,
                     blockType: string) {
    super(r, theta, height, width, Block._getColor(blockType));
    // Blocks can't be entered from any side, unlike platforms
    this._solidLeft = true;
    this._solidRight = true;
    this._solidBottom = true;
    this._solidTop = true;
  }

  private static _getColor(type: string): Color {
    switch (type) {
      case 'grass':
        return new Color(50, 255, 100);
      case 'stone':
      default:
        return new Color(150, 150, 150);
    }
  }

  public type(): string { return 'block'; }

  public collide(other: GameObject, result: Collider.Result): void {
    super.collide(other, result);
    if (!other.movable) {
      return;
    } else if (!result.left && !result.right && !result.top && !result.bottom) {
      // If no directional collision, default to pushing to to the top
      let prevMin = this.pos.r + (other.getPolarBounds().height / 2);
      other.pos.r = prevMin;
      other.vel.r = Math.max(0, other.vel.r);
    }
  }
}

export class Decoration extends Terrain {
  public get z(): number { return 5; }

  public constructor(r: number, theta: number, height: number, width: number,
                     blockType: string) {
    super(r, theta, height, width, Decoration._getColor(blockType));
    // Decorations don't collide with other objects
    this._solidLeft = false;
    this._solidRight = false;
    this._solidBottom = false;
    this._solidTop = false;
  }

  private static _getColor(type: string): Color {
    switch(type) {
      case 'underground':
      default:
        return new Color(100, 100, 100);
    }
  }

  public type(): string { return 'decoration'; }
}

export const GRAVITY: number = -1;
