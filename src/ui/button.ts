import { Game } from '../game';
import { UILabel } from './label';
import { UIContainer } from './container';
import { MouseState } from '../input/mousestate';

export class UIButton extends UILabel {
  public constructor(game: Game, title: string) {
    super(game, title);
    [
      'mouseup',
      'touchend',
    ].forEach(eventType => {
      this.addListener(eventType, (x: number, y: number) => {
        this.trigger('action', x, y);
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
  }
}
