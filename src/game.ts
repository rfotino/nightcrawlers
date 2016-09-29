/// <reference path="../typings/pixi.js/pixi.js.d.ts" />

import { GameInstance } from './game-instance';
import { KeyState } from './input/keystate';
import { Screen } from './ui/screen.ts';

export class Game {
  private _renderer: PIXI.CanvasRenderer | PIXI.WebGLRenderer;
  private _activeScreen: Screen;
  public keyState: KeyState;

  public get view(): HTMLCanvasElement {
    return this._renderer.view;
  }

  public set activeScreen(screen: Screen) {
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
    // Add key listeners
    this.keyState = new KeyState();
    this.keyState.addListeners(this._renderer.view);
    this._renderer.view.tabIndex = -1;
    // Set the active view to be a game instance
    this._activeScreen = new GameInstance(this.keyState);
    // Preload assets
    PIXI.loader.add('planet', 'assets/planet.png');
    PIXI.loader.add('player', 'assets/player.png');
    PIXI.loader.load(() => this._updateDrawLoop());
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
    // Update all of the game objects
    this._activeScreen.update(this.view.width, this.view.height);
    // Draw everything
    this._renderer.render(this._activeScreen);
  }
}
