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

  public constructor(game: GameInstance,
                     r: number, theta: number, height: number, width: number,
                     pattern: ImageData,
                     topPadding: number = 0) {
    super(game);
    // Set up dimensions
    this.pos.r = r;
    this.pos.theta = theta;
    this._size = new Polar.Coord(height, width);
    // Generate curved block from rectangular pattern:
    // Increase visual height and width by 1 pixel to prevent seams between
    // adjacent terrain elements.
    r += topPadding;
    height += topPadding + 1.5;
    width += 1.5 / r;
    // Create canvas to use as sprite texture
    const canvas = document.createElement('canvas');
    const w = 2 * r * Math.sin(width / 2);
    const h = r - ((r - height) * Math.cos(width / 2));
    canvas.width = w + 2;
    canvas.height = h + 2;
    // Draw platform, mapping rectangular textures to curved platforms one
    // pixel at a time
    const ctx = canvas.getContext('2d');
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // Min/max r and theta for telling if we are inside the polar rectangle
    const minR = r - height;
    const maxR = r;
    const minTheta = -(Math.PI / 2) - (width / 2);
    const maxTheta = minTheta + width;
    // Center of circles we are drawing
    const cx = 1 + (w / 2);
    const cy = 1 + r;
    for (let x = 0; x < pixels.width; x++) {
      for (let y = 0; y < pixels.height; y++) {
        // Coordinates of position we are drawing in cartesian circle space
        const px = x - cx;
        const py = y - cy;
        // Coordinates of position we are drawing in polar circle space
        const pr = Math.sqrt(px*px + py*py);
        const ptheta = Math.atan2(py, px);
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
          const qx = Math.floor((dtheta * maxR) % pattern.width);
          const qy = Math.floor(dr);
          // Copy pattern color over to image data
          let pixelIdx = (y*pixels.width + x)*4;
          let patternIdx = (qy*pattern.width + qx)*4;
          for (let i = 0; i < 4; i++, pixelIdx++, patternIdx++) {
            pixels.data[pixelIdx] += pattern.data[patternIdx];
          }
        }
      }
    }
    ctx.putImageData(pixels, 0, 0);
    // Create sprite from canvas
    this._sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(canvas));
    this._sprite.anchor.x = 0.5;
    this._sprite.anchor.y = (1 + topPadding) / canvas.height;
    // Add newly created sprite to the scene
    this._mirrorList.push(this._sprite);
    this.addChild(this._sprite);
    this.rotation = width / 2;
  }

  public collide(other: GameObject, result: Collider.Result): void {
    // Do nothing if the other object is not movable
    if (!other.movable()) {
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

/**
 * Possibly mobile platform that prevents objects from penetrating it through
 * the top surface only.
 */
export class Platform extends Terrain {
  private _thetaMin: number;
  private _thetaMax: number;
  private _thetaSpeed: number;

  public constructor(game: GameInstance,
                     r: number, theta: number, height: number, width: number,
                     moves: boolean = false,
                     rate: number = 0,
                     thetaPrime: number = theta) {
    super(
      game, r, theta, height, width,
      getImageData('game/platform'), GRASS_PADDING
    );
    // Assign animation characteristics for moving between theta and thetaPrime
    // every rate frames
    if (moves && rate > 0) {
      this.vel.theta = this._thetaSpeed = Math.abs((thetaPrime - theta) / rate);
    }
    this._thetaMin = Math.min(theta, thetaPrime);
    this._thetaMax = Math.max(theta, thetaPrime);
    // By default, platforms only have a solid top
    this._solidLeft = this._solidRight = this._solidBottom = false;
    this._solidTop = true;
  }

  public type(): string { return 'platform'; }

  public update(): void {
    super.update();
    if (this.pos.theta <= this._thetaMin) {
      this.vel.theta = this._thetaSpeed;
    } else if (this.pos.theta >= this._thetaMax) {
      this.vel.theta = -this._thetaSpeed;
    }
  }
}

/**
 * Immobile block that stops things from penetrating it from any side.
 */
export class Block extends Terrain {
  public constructor(game: GameInstance,
                     r: number, theta: number, height: number, width: number,
                     blockType: string) {
    super(
      game, r, theta, height, width,
      Block._getImageData(blockType), Block._getTopPadding(blockType)
    );
    // Blocks can't be entered from any side, unlike platforms
    this._solidLeft = true;
    this._solidRight = true;
    this._solidBottom = true;
    this._solidTop = true;
  }

  public movable(): boolean { return false; }

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

/**
 * Curved blocks with polar rectangle shapes, but in the background and do not
 * collide with the player. For example, the background of caves.
 */
export class BackgroundBlock extends Terrain {
  public get z(): number { return 5; }

  public constructor(game: GameInstance,
                     r: number, theta: number, height: number, width: number,
                     blockType: string) {
    super(game, r, theta, height, width, getImageData(`game/${blockType}`), 0);
    // Blocks can't be collided with from any side
    this._solidLeft = false;
    this._solidRight = false;
    this._solidBottom = false;
    this._solidTop = false;
  }

  public collidable(): boolean { return false; }

  public movable(): boolean { return false; }

  public type(): string { return 'background-block'; }
}

/**
 * Transition types for decorations.
 */
const enum TransitionType {
  FADE,
  POPUP,
}

/**
 * Decorative objects that don't interact with the player but fade between two
 * different images, one for day and one for night.
 */
export class Decoration extends GameObject {
  protected _daySprite: PIXI.Sprite;
  protected _nightSprite: PIXI.Sprite;
  protected _transitionType: TransitionType;

  public get z(): number { return 0; }

  public constructor(game: GameInstance,
                     r: number, theta: number, blockType: string) {
    super(game);
    // Initialize sprites with different textures
    this._daySprite = new PIXI.Sprite(
      PIXI.loader.resources[`game/day/${blockType}`].texture
    );
    this._nightSprite = new PIXI.Sprite(
      PIXI.loader.resources[`game/night/${blockType}`].texture
    );
    // Get maximum dimensions of day/night sprites
    let width = Math.max(this._daySprite.width, this._nightSprite.width);
    let height = Math.max(this._nightSprite.height, this._nightSprite.height);
    // Position the sprite 5% lower than requested since there's some
    // transparency on the bottom and we don't want floating sprites
    this.pos.set(r - (height * 0.05), theta);
    this._daySprite.anchor.set(0.5, 1);
    this._nightSprite.anchor.set(0.5, 1);
    // Add sprites to mirrorlist for (x, y) positioning
    this._mirrorList.push(this._daySprite);
    this._mirrorList.push(this._nightSprite);
    // Add sprites to this container
    this.addChild(this._daySprite);
    this.addChild(this._nightSprite);
    // Use different transition types for different block types
    switch (blockType) {
      case 'gravestone1':
      case 'gravestone2':
        this._transitionType = TransitionType.POPUP;
        break;
      case 'tree1':
      case 'tree2':
        this._transitionType = TransitionType.FADE;
        break;
    }
    // Set up some masking so that you can't see sprites that are hidden
    // outside of the container (like gravestones/flower patches when they
    // slide down into the ground)
    let mask = new PIXI.Graphics();
    mask.beginFill(0xffffff);
    mask.drawRect(-width / 2, -height, width, height);
    mask.endFill();
    this._mirrorList.push(mask);
    this.addChild(mask);
    this.mask = mask;
  }

  /**
   * Linearly interpolate between day and night sprites based on the
   * decoration's transition type.
   */
  public update(): void {
    super.update();
    let day: number, night: number;
    if (this._game.timeKeeper.isDay) {
      // Put night sprite in front because it is out of sight during day so it
      // doesn't matter but it is in front during dusk transition
      if (this.children[0] === this._nightSprite) {
        this.swapChildren(this._daySprite, this._nightSprite);
      }
      // Get % day, % night
      if (this._game.timeKeeper.transitioning) {
        day = 1 - this._game.timeKeeper.transition;
        night = this._game.timeKeeper.transition;
      } else {
        day = 1;
        night = 0;
      }
    } else {
      // Put day sprite in front because it is out of sight during night so it
      // doesn't matter but it is in front during dawn transition
      if (this.children[0] === this._daySprite) {
        this.swapChildren(this._daySprite, this._nightSprite);
      }
      // Get % day, % night
      if (this._game.timeKeeper.transitioning) {
        day = this._game.timeKeeper.transition;
        night = 1 - this._game.timeKeeper.transition;
      } else {
        day = 0;
        night = 1;
      }
    }
    switch (this._transitionType) {
      default:
      case TransitionType.FADE:
        this._daySprite.alpha = day;
        this._nightSprite.alpha = night;
        break;
      case TransitionType.POPUP:
        this._daySprite.anchor.y = day;
        this._nightSprite.anchor.y = night;
        break;
    }
  }

  public collidable(): boolean { return false; }

  public movable(): boolean { return false; }

  public getPolarBounds(): Polar.Rect { return new Polar.Rect(); }

  public type(): string { return 'decoration'; }
}

export const GRAVITY: number = -1;
