import { GameObject } from './game-object';
import { GameInstance } from '../game-instance';
import { Polar } from '../math/polar';
import { Color } from '../graphics/color';
import { PolarRectMesh } from '../graphics/polar-rect-mesh';
import { Collider } from '../math/collider';

/**
 * Number of extra pixels at the top of the grass texture, where there is
 * texture but should be no collision.
 */
const GRASS_PADDING = 8;

/**
 * Function for getting top padding amount based on the type of terrain block.
 */
function getTopPadding(blockType: string): number {
  switch (blockType) {
    case 'grass':
    case 'platform':
      return GRASS_PADDING;
    default:
      return 0;
  }
}

/**
 * Get the main texture for a given terrain block type.
 */
function getTexture(blockType: string): PIXI.Texture {
  switch (blockType) {
    case 'grass':
    case 'platform':
      return PIXI.loader.resources['game/stone'].texture;
    default:
      return PIXI.loader.resources[`game/${blockType}`].texture;
  }
}

/**
 * Get the top texture for a given terrain block type.
 */
function getTopTexture(blockType: string): PIXI.Texture {
  switch (blockType) {
    case 'grass':
    case 'platform':
      return PIXI.loader.resources['game/grass'].texture;
    default:
      return null;
  }
}

/**
 * Terrain class used to map rectangular textures to rounded blocks and
 * platforms, also used for shared collision/bounds functionality.
 */
abstract class Terrain extends GameObject {
  public texture: PIXI.Texture;
  public topTexture: PIXI.Texture;
  protected _solidLeft: boolean;
  protected _solidRight: boolean;
  protected _solidTop: boolean;
  protected _solidBottom: boolean;
  private _size: Polar.Coord;
  private _meshes: PolarRectMesh[];
  private _padding: number;
  private _cachedTotalMeshBounds: Polar.Rect;

  public get z(): number {
    return 10;
  }

  public get size(): Polar.Coord {
    return this._size;
  }

  public constructor(game: GameInstance,
                     r: number, theta: number, height: number, width: number,
                     padding: number, texture: PIXI.Texture,
                     topTexture?: PIXI.Texture) {
    super(game);
    // Set up dimensions
    this.pos.r = r;
    this.pos.theta = theta;
    this._size = new Polar.Coord(height, width);
    this._padding = padding
    // Create the mesh. Have a "top texture" for things like blocks topped with
    // grass, where you want a grassy top with dirt tiled below
    this.texture = texture;
    this.topTexture = topTexture;
    this._refreshMeshes();
  }

  /**
   * The bounds of the polar-rectangular mesh are not quite the same as the
   * bounds used for collision returned by getPolarBounds(). This utility
   * function accounts for padding and margins.
   */
  private _getTotalMeshBounds(): Polar.Rect {
    const bounds = this.getPolarBounds();

    // Add a bit to the top to account for padding, e.g. for grass
    bounds.r += this._padding;
    bounds.height += this._padding;

    return bounds;
  }

  protected _refreshMeshes(): void {
    // Destroy previous meshes
    if (this._meshes) {
      this._meshes.forEach(mesh => {
        mesh.destroy();
      })
    }

    this._meshes = [];
    const remainingBounds = this._getTotalMeshBounds();
    // Slight padding to add to each mesh to make adjacent meshes flush
    const OVERLAP = 1.5;
    // Amount that the meshes can be off from the actual bounds of the terrain
    const EPSILON = 0.1;

    // Carve a chunk off the remaining rect for the topTexture, if set
    if (this.topTexture && remainingBounds.height > EPSILON) {
      const rect = new Polar.Rect(
        remainingBounds.r, remainingBounds.theta,
        Math.min(this.topTexture.height - OVERLAP, remainingBounds.height),
        remainingBounds.width
      );
      remainingBounds.r -= rect.height;
      remainingBounds.height -= rect.height;
      // Add some overlap so that there aren't tiny lines along adjacent meshes
      rect.width += OVERLAP / rect.r;
      rect.height += OVERLAP;
      // Create the mesh and store it
      const mesh = new PolarRectMesh(this.topTexture, rect);
      this.addChild(mesh);
      this._meshes.push(mesh);
    }

    // If there is need for it, add a rectangle for the remaining bounds
    if (remainingBounds.height > EPSILON) {
      const rect = remainingBounds.clone();
      // Add some overlap so that there aren't tiny lines along adjacent meshes
      rect.width += OVERLAP / rect.r;
      rect.height += OVERLAP;
      // Create the mesh and store it
      const mesh = new PolarRectMesh(this.texture, rect);
      this.addChild(mesh);
      this._meshes.push(mesh);
    }

    // Reset cached total rect bounds
    this._cachedTotalMeshBounds = this._getTotalMeshBounds();
  }

  /**
   * Override mirror to not affect position, only rotation
   */
  public mirror(): void {
    this._mirrorList.forEach(obj => {
      obj.rotation = this.pos.theta;
    });
  }

  public collidesWith(otherType: string): boolean {
    switch (otherType) {
      case 'block':
      case 'platform':
        return false;
      default:
        return true;
    }
  }

  public collide(other: GameObject, result: Collider.Result): void {
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

  /**
   * Update the terrain block's meshes if their bounds have changed.
   */
  public updatePostCollision(): void {
    super.updatePostCollision();
    if (!this._cachedTotalMeshBounds.equals(this._getTotalMeshBounds())) {
      this._refreshMeshes();
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
      getTopPadding('platform'),
      getTexture('platform'),
      getTopTexture('platform')
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

  public updatePreCollision(): void {
    super.updatePreCollision();
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
      getTopPadding(blockType),
      getTexture(blockType),
      getTopTexture(blockType)
    );
    // Blocks can't be entered from any side, unlike platforms
    this._solidLeft = true;
    this._solidRight = true;
    this._solidBottom = true;
    this._solidTop = true;
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
    super(game, r, theta, height, width,
      getTopPadding(blockType),
      getTexture(blockType),
      getTopTexture(blockType)
    );
    // Blocks can't be collided with from any side
    this._solidLeft = false;
    this._solidRight = false;
    this._solidBottom = false;
    this._solidTop = false;
  }

  public collidesWith(otherType: string): boolean { return false; }
  public collidable(): boolean { return false; }
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

  public get width(): number {
    return Math.max(this._daySprite.width, this._nightSprite.width);
  }

  public get height(): number {
    return Math.max(this._daySprite.height, this._nightSprite.height);
  }

  public constructor(game: GameInstance,
                     r: number, theta: number, blockType: string) {
    super(game);
    // Decorations are affected by gravity
    this.accel.r = GRAVITY;
    // Initialize sprites with different textures
    this._daySprite = new PIXI.Sprite(
      PIXI.loader.resources[`game/day/${blockType}`].texture
    );
    this._nightSprite = new PIXI.Sprite(
      PIXI.loader.resources[`game/night/${blockType}`].texture
    );
    // The r position fed in is where the bottom of the decoration should go,
    // since it's not easy in the level editor to know how tall a sprite is.
    // Add extra 5px so that the sprite starts about slightly above ground and
    // falls to earth rather than clipping through the earth.
    this.pos.set(r + (this.height / 2) + 5, theta);
    this._daySprite.anchor.set(0.5, 0.5);
    this._nightSprite.anchor.set(0.5, 0.5);
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
    const mask = new PIXI.Graphics();
    mask.beginFill(0xffffff);
    mask.drawRect(-this.width / 2, -this.height / 2, this.width, this.height);
    mask.endFill();
    this._mirrorList.push(mask);
    this.addChild(mask);
    this.mask = mask;
  }

  /**
   * Linearly interpolate between day and night sprites based on the
   * decoration's transition type.
   */
  public updatePreCollision(): void {
    super.updatePreCollision();
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
        this._daySprite.anchor.y = day - 0.5;
        this._nightSprite.anchor.y = night - 0.5;
        break;
    }
  }

  public getPolarBounds(): Polar.Rect {
    const widthTheta = this._daySprite.width / this.pos.r;
    const boundsHeight = 0.9 * this.height;
    return new Polar.Rect(
      this.pos.r + (boundsHeight / 2),
      this.pos.theta - (widthTheta / 2),
      boundsHeight,
      widthTheta
    );
  }

  public collidesWith(otherType: string): boolean {
    switch (otherType) {
      case 'block':
      case 'platform':
        return true;
      default:
        return false;
    }
  }

  public type(): string { return 'decoration'; }
}

export const GRAVITY: number = -1;
