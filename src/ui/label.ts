import { Game } from '../game';
import { UIContainer } from './container';
import { MouseState } from '../input/mousestate';

export class UIImageLabel extends UIContainer {
  protected _sprite: PIXI.Sprite;

  public constructor(game: Game, resourceName: string,
                     width?: number, height?: number) {
    super(game);
    this._sprite = new PIXI.Sprite(PIXI.loader.resources[resourceName].texture);
    this.addChild(this._sprite);
    this.width = width || this._sprite.width;
    this.height = height || this._sprite.height;
    this._sprite.x = -(this._sprite.width - this.width) / 2;
    this._sprite.y = -(this._sprite.height - this.height) / 2;
  }

  public getBounds(): PIXI.Rectangle {
    return new PIXI.Rectangle(
      this.parent.x + this.x,
      this.parent.y + this.y,
      this.width,
      this.height
    );
  }
}

export class UILabel extends UIContainer {
  protected _text: PIXI.Text;
  protected _title: string;

  public get title(): string { return this._title; }

  public get width(): number {
    return Math.max(this._sizer.width, this._text.width);
  }

  public get height(): number {
    return Math.max(this._sizer.height, this._text.height);
  }

  public set title(title: string) {
    this._title = title;
    this._text.text = title;
  }

  public set width(width: number) {
    this._sizer.width = width;
  }

  public set height(height: number) {
    this._sizer.height = height;
  }

  public constructor(game: Game, title: string, style: PIXI.TextStyle = {}) {
    super(game);
    this._title = title;
    style.align = style.align || 'center';
    style.fontFamily = style.fontFamily || 'sans-serif';
    style.fontSize = style.fontSize || 90;
    style.fill = style.fill || 'white';
    this._text = new PIXI.Text(this._title, style);
    this._text.anchor.x = this._text.anchor.y = 0.5;
    this.addChild(this._text);
  }

  public doLayout(): void {
    super.doLayout();
    this._text.x = this.width / 2;
    this._text.y = this.height / 2;
  }
}
