import { Counter } from '../math/counter';

export interface SpriteSheetAnimation {
  frames: number[];
  speed: number;
}

export class SpriteSheet extends PIXI.Sprite {
  protected _frames: PIXI.Texture[];
  protected _anims: {[key: string]: SpriteSheetAnimation};
  protected _defaultFrame: number;
  protected _current: SpriteSheetAnimation;
  protected _currentName: string;
  protected _currentCounter: Counter;
  protected _currentFrameIndex: number;

  /**
   * Split the sheet up into imagesWidth x imagesHigh different textures.
   * Both numWide and numHigh must be >= 1, and defaultFrame must be >= 0 and
   * < numWide*numHigh. All of the frames in anims must be in the same range
   * of possibilities as defaultFrame.
   */
  public constructor(sheet: PIXI.Texture, numWide: number, numHigh: number,
                     defaultFrame: number = 0,
                     anims: {[key: string]: SpriteSheetAnimation} = {}) {
    super();
    // Split sheet up into different frames
    let frameWidth = sheet.width / numWide;
    let frameHeight = sheet.height / numHigh;
    this._frames = [];
    for (let numX = 0; numX < numWide; numX++) {
      for (let numY = 0; numY < numHigh; numY++) {
        let frameRect = new PIXI.Rectangle(
          Math.floor(numX * frameWidth),
          Math.floor(numY * frameHeight),
          Math.floor(frameWidth),
          Math.floor(frameHeight)
        );
        this._frames.push(new PIXI.Texture(sheet, frameRect));
      }
    }
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
      speed: speed,
    };
  }

  /**
   * Starts playing the named animation, or does nothing if an animation
   * with the given name has not started yet.
   */
  public playAnim(name: string): void {
    let anim = this._anims[name];
    if (!anim) {
      return;
    }
    this._current = anim;
    this._currentName = name;
    this._currentCounter = new Counter(this._current.speed);
    this._currentFrameIndex = 0;
    this.texture = this._frames[this._current.frames[this._currentFrameIndex]];
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
    if (!this._current) {
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
