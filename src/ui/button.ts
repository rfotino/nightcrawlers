import { Game } from '../game';
import { UIContainer } from './container';
import { MouseState } from '../input/mousestate';

export class UIButton extends UIContainer {
  private _text: PIXI.Text;
  private _title: string;
  private _actions: (() => void)[];

  public get title(): string { return this._title; }

  public constructor(game: Game, title: string) {
    super(game);
    this._title = title;
    this._text = new PIXI.Text(this._title, {
      align: 'center',
      fontFamily: 'sans-serif',
    });
    this._actions = [];
    this._text.anchor.x = this._text.anchor.y = 0.5;
    this.addChild(this._text);
  }

  public addActionListener(action: () => void): UIButton {
    this._actions.push(action);
    return this;
  }

  public doLayout(): void {
    super.doLayout();
    this._text.style.fontSize = this.height * 0.8;
    this._text.x = this.width / 2;
    this._text.y = this.height / 2;
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
