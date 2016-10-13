/// <reference path="../typings/pixi.d.ts" />
/// <reference path="../typings/howler.d.ts" />

import { GameInstance } from './game-instance';
import { KeyState } from './input/keystate';
import { MouseState } from './input/mousestate';
import { TouchState } from './input/touchstate';
import { UIContainer } from './ui/container';
import { MainMenu } from './ui/menu';

export class Game {
  protected _renderer: PIXI.CanvasRenderer | PIXI.WebGLRenderer;
  protected _activeScreen: UIContainer;
  protected _mainMenu: MainMenu;
  protected _keyState: KeyState;
  protected _mouseState: MouseState;
  protected _touchState: TouchState;

  public get mainMenu(): MainMenu { return this._mainMenu; }
  public get keyState(): KeyState { return this._keyState; }
  public get mouseState(): MouseState { return this._mouseState; }
  public get touchState(): TouchState { return this._touchState; }

  public get view(): HTMLCanvasElement {
    return this._renderer.view;
  }

  public set activeScreen(screen: UIContainer) {
    screen.doLayout();
    this._activeScreen = screen;
  }

  public constructor() {
    this._renderer = PIXI.autoDetectRenderer(
      window.innerWidth,
      window.innerHeight,
      {
        antialias: true,
        backgroundColor: 0x000000,
      }
    );
    // Add mouse/key/touch listeners
    this._keyState = new KeyState();
    this._mouseState = new MouseState();
    this._touchState = new TouchState();
    this._keyState.addListeners(
      this._renderer.view,
      (event: string, mouseX: number, mouseY: number) => {
        this._activeScreen.trigger(event, mouseX, mouseY);
      }
    );
    this._mouseState.addListeners(
      this._renderer.view,
      (event: string, mouseX: number, mouseY: number) => {
        this._activeScreen.trigger(event, mouseX, mouseY);
      }
    );
    this._touchState.addListeners(
      this._renderer.view,
      (event: string, touchX: number, touchY: number) => {
        this._activeScreen.trigger(event, touchX, touchY);
      }
    )
    this._renderer.view.tabIndex = -1;
    this._renderer.view.oncontextmenu = () => false;
    // Set the active view to be a game instance
    this._mainMenu = new MainMenu(this);
    this._activeScreen = this._mainMenu;
    // Preload assets
    PIXI.loader.add('planet', 'assets/images/planet.png');
    PIXI.loader.add('player', 'assets/images/player.png');
    PIXI.loader.load(() => this._updateDrawLoop());
  }

  public isWebGL(): boolean {
    return this._renderer instanceof PIXI.WebGLRenderer;
  }

  private _updateDrawLoop(): void {
    // Request the next frame
    window.requestAnimationFrame(() => this._updateDrawLoop());
    // Resize the canvas to fit the screen
    if (this.view.width !== window.innerWidth ||
        this.view.height !== window.innerHeight) {
      this.view.width = window.innerWidth;
      this.view.height = window.innerHeight;
      this._renderer.resize(window.innerWidth, window.innerHeight);
    }
    // Update the layout of the active screen and then update whatever is
    // happening on that screen
    this._activeScreen.doLayout();
    this._activeScreen.update();
    // Roll over input states
    this._keyState.rollOver();
    this._mouseState.rollOver();
    // Draw everything
    this._renderer.render(this._activeScreen);
  }
}
