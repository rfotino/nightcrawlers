/// <reference path="../typings/pixi.d.ts" />
/// <reference path="../typings/howler.d.ts" />

import { GameInstance } from './game-instance';
import { KeyState } from './input/keystate';
import { MouseState } from './input/mousestate';
import { TouchState } from './input/touchstate';
import { UIContainer } from './ui/container';
import { MainMenu } from './ui/menu';
import { MainProgressScreen } from './ui/progress';
import { LagFactor } from './math/lag-factor';

export class Game {
  protected _renderer: PIXI.CanvasRenderer | PIXI.WebGLRenderer;
  protected _activeScreen: UIContainer;
  protected _mainMenu: MainMenu;
  protected _progressBar: MainProgressScreen;
  protected _keyState: KeyState;
  protected _mouseState: MouseState;
  protected _touchState: TouchState;
  private _prevTime: number;
  private _currentTime: number;
  private _prevLagFactors: number[] = [];

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
    // Create top level UI containers and set the initial active screen to
    // be a progress bar.
    this._mainMenu = new MainMenu(this);
    this._progressBar = new MainProgressScreen(this);
    this._activeScreen = this._progressBar;
    // Preload assets
    let audioExt = Howler.codecs('mp3') ? 'mp3' : 'm4a';
    PIXI.loader
      .add('game/player', 'assets/images/game/lucy.png')
      .add('game/bullet', 'assets/images/game/bullet.png')
      .add('game/mine', 'assets/images/game/mine.png')
      .add('game/platform', 'assets/images/game/platform.png')
      .add('game/grass', 'assets/images/game/grass.png')
      .add('game/stone', 'assets/images/game/stone.png')
      .add('game/underground', 'assets/images/game/underground.png')
      .add('game/flying-bat', 'assets/images/game/flying-bat.png')
      .add('game/day/gravestone1', 'assets/images/game/gravestone1-day.png')
      .add('game/day/gravestone2', 'assets/images/game/gravestone2-day.png')
      .add('game/day/tree1', 'assets/images/game/tree1-day.png')
      .add('game/day/tree2', 'assets/images/game/tree2-day.png')
      .add('game/night/gravestone1', 'assets/images/game/gravestone1-night.png')
      .add('game/night/gravestone2', 'assets/images/game/gravestone2-night.png')
      .add('game/night/tree1', 'assets/images/game/tree1-night.png')
      .add('game/night/tree2', 'assets/images/game/tree2-night.png')
      .add('game/clouds', 'assets/images/game/clouds.png')
      .add('game/moon', 'assets/images/game/moon.png')
      .add('game/moonlight', 'assets/images/game/moonlight.png')
      .add('game/sun', 'assets/images/game/sun.png')
      .add('ui/baseball-bat', 'assets/images/ui/baseball-bat.png')
      .add('ui/pistol', 'assets/images/ui/pistol.png')
      .add('ui/shotgun', 'assets/images/ui/shotgun.png')
      .add('ui/assault', 'assets/images/ui/assault.png')
      .add('ui/mine', 'assets/images/ui/mine.png')
      .add('music/night', `assets/music/night.${audioExt}`)
      .load(() => this.activeScreen = this._mainMenu)
      .on('progress', loader => this._progressBar.progress = loader.progress);
    // Initialize timing logic
    this._currentTime = Date.now();
    this._prevTime = this._currentTime - 16;
    // Start update/draw loop
    this._updateDrawLoop();
  }

  public isWebGL(): boolean {
    return this._renderer instanceof PIXI.WebGLRenderer;
  }

  private _updateDrawLoop(): void {
    // Request the next frame
    window.requestAnimationFrame(() => this._updateDrawLoop());
    // Get the lag factor between this frame and the previous frame. We should
    // be running at 60 frames per second, but if we are running at e.g.
    // 30 FPS then the lag factor will be 2, or if we are running at 45 FPS
    // the lag factor will be 1.5, etc. Cap lag factor at some reasonable
    // maximum.
    this._currentTime = Date.now();
    let lagFactor = (this._currentTime - this._prevTime) * 60 / 1000;
    if (lagFactor > 5) {
      lagFactor = 5;
    }
    this._prevTime = this._currentTime;
    // Do some smoothing of the lag factor by using a rolling average.
    this._prevLagFactors.push(lagFactor);
    if (this._prevLagFactors.length > 10) {
      this._prevLagFactors.shift();
    }
    let avgLagFactor = this._prevLagFactors.reduce((p, c) => {
      return p + c;
    }, 0) / this._prevLagFactors.length;
    LagFactor.set(avgLagFactor);
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
    this._touchState.rollOver();
    // Draw everything
    this._renderer.render(this._activeScreen);
  }
}
