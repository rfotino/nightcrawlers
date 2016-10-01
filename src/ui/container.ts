import { Game } from '../game';
import { KeyState } from '../input/keystate';
import { MouseState } from '../input/mousestate';

export abstract class UIContainer extends PIXI.Container {
  protected _game: Game;
  protected _sizer: PIXI.Sprite;
  protected _childComponents: UIContainer[];

  public get keyState(): KeyState {
    return this._game.keyState;
  }

  public get mouseState(): MouseState {
    return this._game.mouseState;
  }

  public get view(): HTMLCanvasElement {
    return this._game.view;
  }

  public get width(): number {
    return this._sizer.width;
  }

  public get height(): number {
    return this._sizer.height;
  }

  public constructor(game: Game) {
    super();
    this._game = game;
    this._sizer = new PIXI.Sprite();
    this._childComponents = [];
    this.addChild(this._sizer);
  }

  public set width(width: number) {
    this._sizer.width = width;
  }

  public set height(height: number) {
    this._sizer.height = height;
  }

  public addComponent(child: UIContainer) {
    this._childComponents.push(child);
    this.addChild(child);
  }

  public doLayout(): void {
    this._childComponents.forEach(child => child.doLayout());
  }

  public update(): void {
    this._childComponents.forEach(child => child.update());
  }
}
