import { GameObject } from './game-object';
import { GameInstance } from '../game-instance';
import { Polar } from '../math/polar';
import { Color } from '../graphics/color';
import { Collider } from '../math/collider';

/**
 * Draws resource on a canvas and returns an ImageData object representing the
 * pixel data, memoizing the result for later.
 */
const cachedImageData: {[key: string]: ImageData} = {};
function getImageData(resourceName: string): ImageData {
  if (!cachedImageData[resourceName]) {
    const texture = PIXI.loader.resources[resourceName].texture;
    const canvas = document.createElement('canvas');
    canvas.width = texture.width;
    canvas.height = texture.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(texture.baseTexture.source, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    cachedImageData[resourceName] = imageData;
  }
  return cachedImageData[resourceName];
}

/**
 * Cache tiles at a fixed height and width so that blocks can use the same
 * tile multiple times without having to generate it from scratch.
 */
interface PolarTile {
  r: number;
  width: number;
  texture: PIXI.Texture;
}
const TILE_HEIGHT = 75;
const TILE_SIDE_PADDING = 1.5;
const TILE_BOTTOM_PADDING = 3;
const cachedTiles: {[key: string]: PolarTile[]} = {};
function getPolarTile(resourceName: string, r: number): PolarTile {
  // Make sure the resourceName is valid
  if (!PIXI.loader.resources[resourceName]) {
    throw `No texture available for resource ${resourceName}`;
  }
  // Create empty array for resourceName if it doesn't exist
  if (!cachedTiles[resourceName]) {
    cachedTiles[resourceName] = [];
  }
  // Check for existing texture, if not found then create it
  const rIndex = Math.max(0, Math.ceil(r / TILE_HEIGHT) - 1);
  if (!cachedTiles[resourceName][rIndex]) {
    // Get rectangular texture pattern
    const pattern = getImageData(resourceName);
    const topPadding = getTopPadding(resourceName);
    // Lock r to the nearest multiple of TILE_HEIGHT
    r = (rIndex + 1) * TILE_HEIGHT;
    // Get the theta width of this tile, to be stored with the PolarTile obj
    const width_theta = Math.min(Math.PI / 2, 150 / r);
    // Add padding, get image width and height
    r += topPadding;
    const width = width_theta + (TILE_SIDE_PADDING / r);
    const height = topPadding + TILE_HEIGHT + TILE_BOTTOM_PADDING;
    // Create canvas to use as sprite texture
    const canvas = document.createElement('canvas');
    const w = 2 * r * Math.sin(width / 2);
    const h = r - ((r - height) * Math.cos(width / 2));
    canvas.width = w;
    canvas.height = h;
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
    const cx = w / 2;
    const cy = r;
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
    // Create and store texture
    cachedTiles[resourceName][rIndex] = {
      texture: PIXI.Texture.fromCanvas(canvas),
      r: r,
      width: width_theta,
    };
  }
  // Return cached or newly created tile
  return cachedTiles[resourceName][rIndex];
}

/**
 * Number of extra pixels at the top of the grass texture, where there is
 * texture but should be no collision.
 */
const GRASS_PADDING = 8;

/**
 * Function for getting top padding amount based on resource name.
 */
function getTopPadding(resourceName: string): number {
  switch (resourceName) {
    case 'game/grass':
    case 'game/platform':
      return GRASS_PADDING;
    default:
      return 0;
  }
}

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
  protected _spriteMask: PIXI.Graphics;
  protected _spriteContainer: PIXI.Container;

  public get z(): number {
    return 10;
  }

  public get size(): Polar.Coord {
    return this._size;
  }

  public constructor(game: GameInstance,
                     r: number, theta: number, height: number, width: number,
                     resourceName: string) {
    super(game);
    // Set up dimensions
    this.pos.r = r;
    this.pos.theta = theta;
    this._size = new Polar.Coord(height, width);
    // Initialize the sprite container that will hold all the tiles
    this._spriteContainer = new PIXI.Container();
    this._mirrorList.push(this._spriteContainer);
    this.addChild(this._spriteContainer);
    // Add as many tiles as necessary to fill or exceed the terrain width
    let chainHeight = 0;
    let tileResource = resourceName;
    while (chainHeight < height) {
      const desiredTileR = r - chainHeight;
      const tile = getPolarTile(tileResource, desiredTileR);
      const scale = desiredTileR / tile.r;
      let chainWidth = 0;
      while (chainWidth < width) {
        const sprite = new PIXI.Sprite(tile.texture);
        sprite.anchor.x = 0.5;
        sprite.anchor.y = getTopPadding(tileResource) / sprite.height;
        sprite.rotation = (tile.width * scale / 2) + chainWidth;
        sprite.x = desiredTileR * Math.cos(sprite.rotation);
        sprite.y = desiredTileR * Math.sin(sprite.rotation);
        sprite.scale.set(scale);
        sprite.rotation += Math.PI / 2;
        this._spriteContainer.addChild(sprite);
        chainWidth += tile.width * scale;
      }
      chainHeight += TILE_HEIGHT * scale;
      // Hack to switch to stone from grass after first layer of tiles
      if (tileResource === 'game/grass') {
        tileResource = 'game/stone';
      }
    }
    // Add sprite mask to hide excess pieces of tiles
    const topPadding = getTopPadding(resourceName);
    const minR = Math.max(0, r - height - TILE_BOTTOM_PADDING);
    const maxR = r + topPadding;
    const maxTheta = Math.min(Math.PI * 2, width + (TILE_SIDE_PADDING / r));
    this._spriteMask = new PIXI.Graphics();
    // Arc twice (once from 0 to halfway, then from halfway to finished)
    // because PIXI.Graphics draws a segmented circle and we need the segments
    // to be small enough to not be noticable
    this._spriteMask
      .beginFill(Color.white.toPixi())
      .arc(0, 0, maxR, 0, maxTheta / 2)
      .arc(0, 0, maxR, maxTheta / 2, maxTheta)
      .arc(0, 0, minR, maxTheta, maxTheta / 2, true)
      .arc(0, 0, minR, maxTheta / 2, 0, true)
      .endFill();
    this._spriteContainer.mask = this._spriteMask;
    this._spriteContainer.addChild(this._spriteMask);
  }

  /**
   * Override mirror to not affect position, only rotation
   */
  public mirror(): void {
    this._mirrorList.forEach(obj => {
      obj.rotation = this.pos.theta;
    });
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
    super(game, r, theta, height, width, 'game/platform');
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
    super(game, r, theta, height, width, `game/${blockType}`);
    // Blocks can't be entered from any side, unlike platforms
    this._solidLeft = true;
    this._solidRight = true;
    this._solidBottom = true;
    this._solidTop = true;
  }

  public movable(): boolean { return false; }

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
    super(game, r, theta, height, width, `game/${blockType}`);
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
