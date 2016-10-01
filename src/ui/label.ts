import { Game } from '../game';
import { UIContainer } from './container';
import { MouseState } from '../input/mousestate';

export class UILabel extends UIContainer {
  private _text: PIXI.Text;
  private _title: string;

  public get title(): string { return this._title; }

  public constructor(game: Game, title: string) {
    super(game);
    this._title = title;
    this._text = new PIXI.Text(this._title, {
      align: 'center',
      fontFamily: 'sans-serif',
      fill: 'white',
    });
    this._text.anchor.x = this._text.anchor.y = 0.5;
    this.addChild(this._text);
  }

  public doLayout(): void {
    super.doLayout();
    this._text.style.fontSize = this.height * 0.8;
    this._text.x = this.width / 2;
    this._text.y = this.height / 2;
  }
}
