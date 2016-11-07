import { Counter } from '../math/counter';

/**
 * A cache of texture frames so that we don't have to split the same texture
 * up for each e.g. zombie that uses its animations.
 */
let textureFramesCache: {[key: string]: PIXI.Texture[]} = {};

/**
 * Helper function for splitting a texture into frames when we don't have it
 * in the cache.
 */
function getTextureFrames(texture: PIXI.Texture,
                          cols: number, rows: number): PIXI.Texture[] {
  let frames = [];
  let frameWidth = texture.width / cols;
  let frameHeight = texture.height / rows;
  for (let numX = 0; numX < cols; numX++) {
    for (let numY = 0; numY < rows; numY++) {
      let frameRect = new PIXI.Rectangle(
        Math.floor(numX * frameWidth),
        Math.floor(numY * frameHeight),
        Math.floor(frameWidth),
        Math.floor(frameHeight)
      );
      frames.push(new PIXI.Texture(texture, frameRect));
    }
  }
  return frames;
}

/**
 * Memoizes textures of the same name previously split up into the same number
 * of rows and columns. Returns a cached version of the split up texture or
 * splits the texture up if called for the first time.
 */
function getCachedTextureFrames(texture: string | PIXI.Texture,
                                cols: number, rows: number): PIXI.Texture[] {
  // Can't use cache unless we have a string name
  if (texture instanceof PIXI.Texture) {
    return getTextureFrames(texture, cols, rows);
  }
  // Try to get cached version
  let textureKey = `${texture}@${cols}x${rows}`;
  if (!textureFramesCache[textureKey]) {
    textureFramesCache[textureKey] = getTextureFrames(
      PIXI.loader.resources[texture].texture,
      cols, rows
    );
  }
  return textureFramesCache[textureKey];
}

/**
 * A simple animation that loops through the given frame indices with each
 * index lasting ticksPerFrame ticks.
 */
export interface SpriteSheetAnimation {
  frames: number[];
  ticksPerFrame: number;
}

/**
 * Generalized class for supporting spritesheet animations while retaining
 * all of the functionality of a PIXI sprite.
 */
export class SpriteSheet extends PIXI.Sprite {
  protected _frames: PIXI.Texture[];
  protected _anims: {[key: string]: SpriteSheetAnimation};
  protected _defaultFrame: number;
  protected _current: SpriteSheetAnimation;
  protected _currentName: string;
  protected _currentCounter: Counter;
  protected _currentFrameIndex: number;
  protected _paused: boolean = false;

  /**
   * Split the sheet up into imagesWidth x imagesHigh different textures.
   * Both numWide and numHigh must be >= 1, and defaultFrame must be >= 0 and
   * < numWide*numHigh. All of the frames in anims must be in the same range
   * of possibilities as defaultFrame.
   */
  public constructor(texture: string | PIXI.Texture,
                     cols: number = 1,
                     rows: number = 1,
                     defaultFrame: number = 0,
                     anims: {[key: string]: SpriteSheetAnimation} = {}) {
    super();
    // Split sheet up into different frames
    this._frames = getCachedTextureFrames(texture, cols, rows);
    // Add animations
    this._anims = anims;
    // Set default frame
    this._defaultFrame = defaultFrame;
    this.texture = this._frames[this._defaultFrame];
  }

  /**
   * Adds an animation to the list of possible animations. After adding
   * an animation, it can be played by name.
   */
  public addAnim(name: string, frames: number[], speed: number): void {
    this._anims[name] = {
      frames: frames,
      ticksPerFrame: speed,
    };
  }

  /**
   * Starts playing the named animation, or does nothing if an animation
   * with the given name is already playing or is not found.
   */
  public playAnim(name: string): void {
    let anim = this._anims[name];
    this._paused = false;
    if (!anim || this._current === anim) {
      return;
    }
    this._current = anim;
    this._currentName = name;
    this._currentCounter = new Counter(this._current.ticksPerFrame);
    this._currentFrameIndex = 0;
    this.texture = this._frames[this._current.frames[this._currentFrameIndex]];
  }

  /**
   * Pauses the currently playing animation, if any.
   */
  public pauseAnim(): void {
    this._paused = true;
  }

  /**
   * Stops the currently playing animation, if any.
   */
  public stopAnim(): void {
    this._current = null;
    this._currentName = null;
    this.texture = this._frames[this._defaultFrame];
  }

  /**
   * Gets the name of the currently playing animation.
   */
  public nowPlaying(): string {
    return this._currentName;
  }

  /**
   * Updates to the next frame in the animation.
   */
  public nextFrame(): void {
    if (!this._current || this._paused) {
      return;
    }
    this._currentCounter.next();
    if (this._currentCounter.done()) {
      this._currentFrameIndex++;
      if (this._currentFrameIndex >= this._current.frames.length) {
        this._currentFrameIndex = 0;
      }
      this._currentCounter.reset();
    }
    this.texture = this._frames[this._current.frames[this._currentFrameIndex]];
  }
}
