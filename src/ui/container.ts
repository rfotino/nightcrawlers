import { Game } from '../game';
import { KeyState } from '../input/keystate';
import { MouseState } from '../input/mousestate';
import { TouchState } from '../input/touchstate';
import { Color } from '../math/color';

export abstract class UIContainer extends PIXI.Container {
  protected _game: Game;
  protected _sizer: PIXI.Sprite;
  protected _childComponents: UIContainer[];
  protected _listeners: {[key: string]: Function[]} = {};
  private _background: PIXI.Graphics;
  private _bgcolor: Color;

  public get keyState(): KeyState {
    return this._game.keyState;
  }

  public get mouseState(): MouseState {
    return this._game.mouseState;
  }

  public get touchState(): TouchState {
    return this._game.touchState;
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

  public set bgcolor(color: Color) {
    this._bgcolor = color.clone();
  }

  public constructor(game: Game) {
    super();
    this._game = game;
    this._sizer = new PIXI.Sprite();
    this._childComponents = [];
    this._background = new PIXI.Graphics();
    this._bgcolor = new Color(0, 0, 0, 0);
    this.addChild(this._background);
    this.addChild(this._sizer);
  }

  public addListener(event: string, fn: Function, context?: any): UIContainer {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(fn);
    return this;
  }

  public trigger(event: string, mouseX: number, mouseY: number) {
    if (this._listeners[event]) {
      this._listeners[event].forEach(fn => fn(mouseX, mouseY));
    }
    this._childComponents.forEach(child => {
      let bounds = child.getBounds();
      if (bounds.contains(mouseX, mouseY)) {
        child.trigger(event, mouseX, mouseY);
      }
    });
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

  public removeComponent(child: UIContainer) {
    this._childComponents = this._childComponents.filter(other => {
      return other !== child;
    });
    this.removeChild(child);
  }

  public doLayout(): void {
    this._childComponents.forEach(child => child.doLayout());
  }

  public update(): void {
    this._childComponents.forEach(child => child.update());
    this._background.clear();
    this._background.beginFill(this._bgcolor.toPixi(), this._bgcolor.a);
    this._background.drawRect(0, 0, this.width, this.height);
    this._background.endFill();
  }
}
