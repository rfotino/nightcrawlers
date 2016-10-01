import { Game } from '../game';
import { UILabel } from './label';
import { UIContainer } from './container';
import { MouseState } from '../input/mousestate';

export class UIButton extends UILabel {
  private _actions: (() => void)[] = [];

  public get title(): string { return this._title; }

  public addActionListener(action: () => void): UIButton {
    this._actions.push(action);
    return this;
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
      if (this.mouseState.isClicked(MouseState.LEFT)) {
        // Mouse clicked
        this._actions.forEach(action => action());
      }
    } else {
      this._text.style.fill = 'white';
    }
  }
}
