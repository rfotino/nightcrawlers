import { Game } from '../game';
import { UILabel, UIImageLabel } from './label';
import { UIContainer } from './container';
import { MouseState } from '../input/mousestate';

export class UIImageButton extends UIImageLabel {
  protected _mouseDown = false;

  public constructor(game: Game, resourceName: string) {
    super(game, resourceName);
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
    const bounds = this.getBounds();
    this._sprite.y = 0;
    if (bounds.contains(this.mouseState.x, this.mouseState.y) ||
        (bounds.contains(this.touchState.x, this.touchState.y) &&
         this.touchState.isDown())) {
      // Hovering
      this._sprite.tint = 0x999999;
      if (this.mouseState.isDown(MouseState.LEFT) ||
          this.touchState.isDown()) {
        // Mouse pressed
        this._sprite.y = this.height * 0.05;
      }
    } else {
      this._sprite.tint = 0xffffff;
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
