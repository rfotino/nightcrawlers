import { Game } from '../game';
import { UILabel } from './label';
import { UIContainer } from './container';
import { MouseState } from '../input/mousestate';

export class UIButton extends UILabel {
  public constructor(game: Game, title: string) {
    super(game, title);
    this.addListener('mouseup', (x: number, y: number) => {
      this.trigger('action', x, y);
    });
  }

  public update(): void {
    super.update();
    let bounds = this.getBounds();
    if (this.mouseState.x >= bounds.x &&
        this.mouseState.x <= bounds.x + bounds.width &&
        this.mouseState.y >= bounds.y &&
        this.mouseState.y <= bounds.y + bounds.height) {
      // Hovering
      this._text.style.fill = 'gray';
      if (this.mouseState.isDown(MouseState.LEFT)) {
        // Mouse pressed
        this._text.y += this.height * 0.05;
      }
    } else {
      this._text.style.fill = 'white';
    }
  }
}
