import { Game } from '../game';
import { UILabel, UIImageLabel } from './label';
import { UIContainer } from './container';
import { MouseState } from '../input/mousestate';
import { SpriteSheet } from '../graphics/spritesheet';

export class UIImageButton extends UIContainer {
  protected _sprite: SpriteSheet;
  protected _mouseDown = false;

  public constructor(game: Game, resourceName: string,
                     width?: number, height?: number) {
    super(game);
    // Create sprite sheet and add it to the scene
    const texture = PIXI.loader.resources[resourceName].texture;
    this._sprite = new SpriteSheet(
      texture,
      1, // columns
      3, // rows
      'default',
      {
        'default': {
          frames: [0],
          ticksPerFrame: 0,
        },
        hover: {
          frames: [1],
          ticksPerFrame: 0,
        },
        pressed: {
          frames: [2],
          ticksPerFrame: 0,
        }
      }
    );
    this.addChild(this._sprite);
    this.width = width || this._sprite.width;
    this.height = height || this._sprite.height;
    this._sprite.x = -(this._sprite.width - this.width) / 2;
    this._sprite.y = -(this._sprite.height - this.height) / 2;
    // Add mouse down listeners
    [
      'mousedown',
      'touchstart',
    ].forEach(eventType => {
      this.addListener(eventType, () => {
        if ('touchstart' === eventType ||
            this._game.mouseState.isDown(MouseState.LEFT)) {
          this._mouseDown = true;
        }
      });
    });
    // Add mouse up listeners
    [
      'mouseup',
      'touchend',
    ].forEach(eventType => {
      this.addListener(eventType, (x: number, y: number) => {
        if (this._mouseDown) {
          this.trigger('action', x, y);
        }
      });
    });
  }

  public getBounds(): PIXI.Rectangle {
    return new PIXI.Rectangle(
      this.parent.x + this.x,
      this.parent.y + this.y,
      this.width * this.scale.x,
      this.height * this.scale.y
    );
  }

  public update(): void {
    super.update();
    const bounds = this.getBounds();
    this._sprite.playAnim('default');
    if (bounds.contains(this.mouseState.x, this.mouseState.y) ||
        (bounds.contains(this.touchState.x, this.touchState.y) &&
         this.touchState.isDown())) {
      // Hovering
      this._sprite.playAnim('hover');
      if (this.mouseState.isDown(MouseState.LEFT) ||
          this.touchState.isDown()) {
        // Mouse pressed
        this._sprite.playAnim('pressed');
      }
    }
    // If there is no mouse/touch down, clear the mouse down flag
    if (!this.mouseState.isDown(MouseState.LEFT) && !this.touchState.isDown()) {
      this._mouseDown = false;
    }
  }
}

export class UIButton extends UILabel {
  protected _mouseDown = false;

  public constructor(game: Game, title: string, style?: PIXI.TextStyle) {
    super(game, title, style);
    // Add mouse down listeners
    [
      'mousedown',
      'touchstart',
    ].forEach(eventType => {
      this.addListener(eventType, () => {
        if ('touchstart' === eventType ||
            this._game.mouseState.isDown(MouseState.LEFT)) {
          this._mouseDown = true;
        }
      });
    });
    // Add mouse up listeners
    [
      'mouseup',
      'touchend',
    ].forEach(eventType => {
      this.addListener(eventType, (x: number, y: number) => {
        if (this._mouseDown) {
          this.trigger('action', x, y);
        }
      });
    });
  }

  public update(): void {
    super.update();
    let bounds = this.getBounds();
    if (bounds.contains(this.mouseState.x, this.mouseState.y) ||
        (bounds.contains(this.touchState.x, this.touchState.y) &&
         this.touchState.isDown())) {
      // Hovering
      this._text.tint = 0x999999;
      if (this.mouseState.isDown(MouseState.LEFT) ||
          this.touchState.isDown()) {
        // Mouse pressed
        this._text.y += this.height * 0.05;
      }
    } else {
      this._text.tint = 0xffffff;
    }
    // If there is no mouse/touch down, clear the mouse down flag
    if (!this.mouseState.isDown(MouseState.LEFT) && !this.touchState.isDown()) {
      this._mouseDown = false;
    }
  }
}
