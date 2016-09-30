import { Game } from '../game';
import { KeyState } from '../input/keystate';
import { MouseState } from '../input/mousestate';

export abstract class Screen extends PIXI.Container {
  private _game: Game;

  public get keyState(): KeyState {
    return this._game.keyState;
  }

  public get mouseState(): MouseState {
    return this._game.mouseState;
  }

  public get view(): HTMLCanvasElement {
    return this._game.view;
  }

  public constructor(game: Game) {
    super();
    this._game = game;
  }

  public abstract update(): void;
}
