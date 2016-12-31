import { GameObject } from './game-object';
import { GameInstance } from '../game-instance';
import { Polar } from '../math/polar';
import { LagFactor } from '../math/lag-factor';
import { Color } from '../graphics/color';
import { PolarRectMesh } from '../graphics/polar-rect-mesh';
import { Collider } from '../math/collider';
/**
 * Private interface for a padding object.
 */
interface IPadding {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Function for getting padding amount based on the type of terrain block.
 */
function getTerrainPadding(blockType: string): IPadding {
  switch (blockType) {
    case 'grass':
      return { left: 0, right: 0, top: 8, bottom: 11 };
    case 'platform':
      return { left: 0, right: 0, top: 8, bottom: 0 };
    default:
      return { left: 0, right: 0, top: 0, bottom: 0 };
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
  private _padding: IPadding;
  private _cachedTotalMeshBounds: Polar.Rect;
  protected _daySpawnNum: number;
  protected _spawnTransition: number;

  public get z(): number {
    return 10;
  }

  public get size(): Polar.Coord {
    return this._size;
  }

  public constructor(
    game: GameInstance,
    r: number, theta: number, height: number, width: number,
    daySpawn: number,
    padding: IPadding, texture: PIXI.Texture,
    topTexture?: PIXI.Texture
  ) {
    super(game);
    // Set up dimensions
    this.pos.r = r;
    this.pos.theta = theta;
    this._size = new Polar.Coord(height, width);
    this._padding = padding;
    // Wait to spawn until the given day
    this._daySpawnNum = daySpawn;
    this._spawnTransition = 1;
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

    // Account for padding, where we want to show more of the texture but don't
    // want it to count towards collision bounds
    bounds.r += this._padding.top;
    bounds.height += this._padding.top + this._padding.bottom;
    bounds.theta -= this._padding.left / bounds.r;
    bounds.width += (this._padding.left + this._padding.right) / bounds.r;

    // Make sure bounds doesn't extend into negative space, clip it if so
    if (bounds.height > bounds.r) {
      bounds.height = bounds.r;
    }

    return bounds;
  }

  protected _refreshMeshes(): void {
    // Destroy previous meshes. Would be more memory efficient to reuse old
    // meshes, but uploading new vertex indices causes crazy WebGL errors
    // (possibly due to a bug in PIXI).
    if (this._meshes) {
      this._meshes.forEach(mesh => {
        mesh.destroy({ children: true });
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

  /**
   * Don't show this block unless it has at least started to spawn.
   */
  public updatePreCollision(): void {
    super.updatePreCollision();
    const SPAWN_SPEED = 0.05;
    if (this._game.timeKeeper.dayNum < this._daySpawnNum) {
      this._spawnTransition = 0;
      this.alpha = 0;
    } else if (this._game.timeKeeper.dayNum > this._daySpawnNum) {
      this._spawnTransition = 1;
      this.alpha = 1;
    } else {
      this._spawnTransition += SPAWN_SPEED * LagFactor.get();
      if (this._spawnTransition > 1) {
        this._spawnTransition = 1;
      }
      this.alpha = 1;
    }
  }

  public collide(other: GameObject, result: Collider.Result): void {
    // If this block has not yet spawned, do nothing`
    if (this._game.timeKeeper.dayNum < this._daySpawnNum) {
      return;
    }
    // Otherwise move the other object out of this terrain object and
    // stop it from moving
    const thisBounds = this.getPolarBounds();
    const otherBounds = other.getPolarBounds();
    if (result.left && this._solidLeft) {
      const prevMin = thisBounds.theta - (otherBounds.width / 2);
      const closest = Polar.closestTheta(prevMin, other.pos.theta);
      other.pos.theta = closest;
      other.vel.theta = Math.min(0, other.vel.theta);
    }
    if (result.right && this._solidRight) {
      const prevMax = thisBounds.theta + thisBounds.width + (otherBounds.width / 2);
      const closest = Polar.closestTheta(prevMax, other.pos.theta);
      other.pos.theta = closest;
      other.vel.theta = Math.max(0, other.vel.theta);
    }
    if (result.top && this._solidTop) {
      const prevMin = thisBounds.r + (otherBounds.height / 2);
      other.pos.r = prevMin;
      other.vel.r = Math.max(0, other.vel.r);
    }
    if (result.bottom && this._solidBottom) {
      const prevMax = thisBounds.r - thisBounds.height - (otherBounds.height / 2);
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

  /**
   * Get the collision bounds of this terrain object, factoring in how far
   * we have spawned since the bounds grows up from the ground as it spawns.
   */
  public getPolarBounds(): Polar.Rect {
    const rect = new Polar.Rect(
      this.pos.r, this.pos.theta,
      this._size.r, this._size.theta
    );
    rect.r -= rect.height * (1 - this._spawnTransition);
    rect.height *= this._spawnTransition;
    return rect;
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

  public constructor(
    game: GameInstance,
    r: number, theta: number, height: number, width: number,
    daySpawn: number,
    moves: boolean = false,
    rate: number = 0,
    thetaPrime: number = theta
  ) {
    super(
      game, r, theta, height, width, daySpawn,
      getTerrainPadding('platform'),
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
  public constructor(
    game: GameInstance,
    r: number, theta: number, height: number, width: number,
    daySpawn: number, blockType: string
  ) {
    super(
      game, r, theta, height, width, daySpawn,
      getTerrainPadding(blockType),
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

  public constructor(
    game: GameInstance,
    r: number, theta: number, height: number, width: number,
    dayNum: number, blockType: string
  ) {
    super(
      game, r, theta, height, width, dayNum,
      getTerrainPadding(blockType),
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
