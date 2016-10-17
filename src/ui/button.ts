import { Game } from '../game';
import { UILabel } from './label';
import { UIContainer } from './container';
import { MouseState } from '../input/mousestate';

export class UIButton extends UILabel {
  protected _mouseDown = false;

  public constructor(game: Game, title: string) {
    super(game, title);
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
      this._text.style.fill = 'gray';
      if (this.mouseState.isDown(MouseState.LEFT) ||
          this.touchState.isDown()) {
        // Mouse pressed
        this._text.y += this.height * 0.05;
      }
    } else {
      this._text.style.fill = 'white';
    }
    // If there is no mouse/touch down, clear the mouse down flag
    if (!this.mouseState.isDown(MouseState.LEFT) && !this.touchState.isDown()) {
      this._mouseDown = false;
    }
  }
}
