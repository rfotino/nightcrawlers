import { GameObject } from './game-object';
import { GameInstance } from '../game-instance';
import { Polar } from '../math/polar';
import { Color } from '../graphics/color';
import { Collider } from '../math/collider';

/**
 * Draws resource on a canvas and returns an ImageData object representing the
 * pixel data, memoizing the result for later.
 */
let cachedImageData: {[key: string]: ImageData} = {};
function getImageData(resourceName: string): ImageData {
  if (!cachedImageData[resourceName]) {
    let texture = PIXI.loader.resources[resourceName].texture;
    let canvas = document.createElement('canvas');
    canvas.width = texture.width;
    canvas.height = texture.height;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(texture.baseTexture.source, 0, 0);
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    cachedImageData[resourceName] = imageData;
  }
  return cachedImageData[resourceName];
}

/**
 * Number of extra pixels at the top of the grass texture, where there is
 * texture but should be no collision.
 */
const GRASS_PADDING = 8;

/**
 * Terrain class used to map rectangular textures to rounded blocks and
 * platforms, also used for shared collision/bounds functionality.
 */
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
                     pattern: ImageData, topPadding: number = 0) {
    super();
    // Set up dimensions
    this.pos.r = r;
    this.pos.theta = theta;
    this._size = new Polar.Coord(height, width);
    // Increase visual height and width by 1 pixel to prevent seams between
    // adjacent terrain elements.
    r += topPadding;
    height += topPadding + 1.5;
    width += 1.5 / r;
    // Create canvas to use as sprite texture
    let canvas = document.createElement('canvas');
    let w = 2 * r * Math.sin(width / 2);
    let h = r - ((r - height) * Math.cos(width / 2));
    canvas.width = w + 2;
    canvas.height = h + 2;
    // Draw platform, mapping rectangular textures to curved platforms one
    // pixel at a time
    let ctx = canvas.getContext('2d');
    let pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // Min/max r and theta for telling if we are inside the polar rectangle
    let minR = r - height;
    let maxR = r;
    let minTheta = -(Math.PI / 2) - (width / 2);
    let maxTheta = minTheta + width;
    // Center of circles we are drawing
    let cx = 1 + (w / 2);
    let cy = 1 + r;
    for (let x = 0; x < pixels.width; x++) {
      for (let y = 0; y < pixels.height; y++) {
        // Coordinates of position we are drawing in cartesian circle space
        let px = x - cx;
        let py = y - cy;
        // Coordinates of position we are drawing in polar circle space
        let pr = Math.sqrt(px*px + py*py);
        let ptheta = Math.atan2(py, px);
        // If we are inside the polar rectangle of this terrain piece, draw
        // a pixel from the pattern
        if (Polar.rBetween(pr, minR, maxR) &&
            Polar.thetaBetween(ptheta, minTheta, maxTheta)) {
          // Determine radial and angular offsets into the pattern texture
          let dtheta = (ptheta - minTheta) % (Math.PI * 2);
          if (dtheta < 0) {
            dtheta += Math.PI * 2;
          }
          let dr = (maxR - pr) % pattern.height;
          if (dr < 0) {
            dr += pattern.height;
          }
          // Pattern coordinates
          let qx = Math.floor((dtheta * maxR) % pattern.width);
          let qy = Math.floor(dr);
          // Copy pattern color over to image data
          for (let i = 0; i < 4; i++) {
            let pixelIdx = (y*pixels.width + x)*4 + i;
            let patternIdx = (qy*pattern.width + qx)*4 + i;
            pixels.data[pixelIdx] = pattern.data[patternIdx];
          }
        }
      }
    }
    ctx.putImageData(pixels, 0, 0);
    // Create sprite from canvas
    this._sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(canvas));
    this._sprite.anchor.x = 0.5;
    this._sprite.anchor.y = (1 + topPadding) / canvas.height;
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
    super(
      r, theta, height, width,
      getImageData('game/platform'), GRASS_PADDING
    );
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
    super(
      r, theta, height, width,
      Block._getImageData(blockType), Block._getTopPadding(blockType)
    );
    // Blocks can't be entered from any side, unlike platforms
    this._solidLeft = true;
    this._solidRight = true;
    this._solidBottom = true;
    this._solidTop = true;
  }

  private static _getImageData(type: string): ImageData {
    switch (type) {
      case 'grass':
        return getImageData('game/grass');
      case 'stone':
      default:
        return getImageData('game/stone');
    }
  }

  private static _getTopPadding(type: string): number {
    switch(type) {
      case 'grass':
        return GRASS_PADDING;
      case 'stone':
      default:
        return 0;
    }
  }

  public type(): string { return 'block'; }
}

export class Decoration extends Terrain {
  public get z(): number { return 5; }

  public constructor(r: number, theta: number, height: number, width: number,
                     blockType: string) {
    super(r, theta, height, width, Decoration._getImageData(blockType));
    // Decorations don't collide with other objects
    this._solidLeft = false;
    this._solidRight = false;
    this._solidBottom = false;
    this._solidTop = false;
  }

  private static _getImageData(type: string): ImageData {
    switch(type) {
      case 'underground':
      default:
        return getImageData('game/underground');
    }
  }

  public type(): string { return 'decoration'; }
}

export const GRAVITY: number = -1;
