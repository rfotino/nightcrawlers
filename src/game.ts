/// <reference path="../typings/pixi.d.ts" />
/// <reference path="../typings/howler.d.ts" />
/// <reference path="../typings/require.d.ts" />

import { GameInstance } from './game-instance';
import { KeyState } from './input/keystate';
import { MouseState } from './input/mousestate';
import { TouchState } from './input/touchstate';
import { UIContainer } from './ui/container';
import { MainMenu } from './ui/menu';
import { MainProgressScreen } from './ui/progress';
import { LagFactor } from './math/lag-factor';

enum TransitionState {
  NONE,
  IN,
  OUT,
}

export class Game {
  protected _renderer: PIXI.CanvasRenderer | PIXI.WebGLRenderer;
  protected _activeScreen: UIContainer;
  protected _nextScreen: UIContainer;
  protected _mainMenu: MainMenu;
  protected _progressBar: MainProgressScreen;
  protected _keyState: KeyState;
  protected _mouseState: MouseState;
  protected _touchState: TouchState;
  protected _transitionState: TransitionState = TransitionState.NONE;
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

  public setActiveScreen(screen: UIContainer) {
    screen.doLayout();
    this._activeScreen.startTransition(false);
    this._transitionState = TransitionState.OUT;
    this._nextScreen = screen;
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
    this._progressBar = new MainProgressScreen(this);
    this._activeScreen = this._progressBar;
    // Preload assets - figure out which audio extension the browser supports,
    // then read the asset manifest (which contains file sizes), add the files
    // we want to load to the PIXI loader, then wait for progress/load events
    const audioExt = Howler.codecs('mp3') ? 'mp3' : 'm4a';
    const assetManifest = <Object[]>require('../assets/manifest.json');
    let resourceSizes: {[key: string]: number} = {};
    assetManifest.forEach(obj => {
      let fileName: string, fileSize: number;
      switch (obj['type']) {
        default:
        case 'image':
        case 'level':
          const file = obj['files'][0];
          fileName = file['src'];
          fileSize = file['size'];
          break;
        case 'audio':
          obj['files'].forEach(file => {
            if (new RegExp(`.+\.${audioExt}$`).test(file['src'])) {
              fileName = file['src'];
              fileSize = file['size'];
            }
          });
          break;
      }
      resourceSizes[obj['name']] = fileSize;
      PIXI.loader.add(obj['name'], fileName);
    });
    PIXI.loader.on('progress', loader => {
      // Count total bytes loaded over total bytes expected,
      // and update the progress bar
      let bytesLoaded = 0, bytesTotal = 0;
      for (let name in resourceSizes) {
        if (!resourceSizes.hasOwnProperty(name)) {
          continue;
        }
        bytesTotal += resourceSizes[name];
        if (loader.resources[name].isComplete) {
          bytesLoaded += resourceSizes[name];
        }
      }
      const progress = 100 * bytesLoaded / bytesTotal;
      this._progressBar.progress = progress;
    });
    PIXI.loader.load(() => {
      this._mainMenu = new MainMenu(this);
      this.setActiveScreen(this._mainMenu);
    });
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
    // Handle transitioning and screen switching logic
    if (this._transitionState === TransitionState.OUT) {
      if (this._activeScreen.isTransitionDone()) {
        this._activeScreen = this._nextScreen;
        this._nextScreen = null;
        this._activeScreen.startTransition(true);
        this._transitionState = TransitionState.IN;
      }
    } else if (this._transitionState === TransitionState.IN) {
      if (this._activeScreen.isTransitionDone) {
        this._transitionState = TransitionState.NONE;
      }
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
