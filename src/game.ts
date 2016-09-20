/// <reference path="../typings/pixi.js/pixi.js.d.ts" />

import { GameObject } from './objects/game-object';
import { Planet } from './objects/planet';
import { Player } from './objects/player';
import { KeyState } from './input/keystate';

export class Game {
  private _renderer: PIXI.CanvasRenderer | PIXI.WebGLRenderer;
  private _outerStage: PIXI.Container;
  private _innerStage: PIXI.Container;
  private _planet: Planet;
  private _player: Player;
  private _gameObjects: GameObject[];
  private _keyState: KeyState;

  public get view(): HTMLCanvasElement {
    return this._renderer.view;
  }

  public constructor() {
    this._renderer = PIXI.autoDetectRenderer(
      800, // width
      600, // height
      {    // options
        antialias: true,
        backgroundColor: 0x000000,
      }
    );
    this._outerStage = new PIXI.Container();
    this._innerStage = new PIXI.Container();
    this._outerStage.addChild(this._innerStage);
    // Add key listeners
    this._keyState = new KeyState();
    this._keyState.addListeners(this._renderer.view);
    this._renderer.view.tabIndex = -1;
    // Preload assets
    PIXI.loader.add('planet', 'assets/planet.png');
    PIXI.loader.add('player', 'assets/player.png');
    PIXI.loader.load(() => this._onAssetsLoaded());
  }

  private _onAssetsLoaded(): void {
    // Construct game objects
    this._planet = new Planet(this._innerStage);
    this._player = new Player(this._innerStage);
    this._gameObjects = [
      this._planet,
      this._player,
    ];
    // Start the update/draw loop
    this._updateDrawLoop();
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
    this._update();
    // Center the view on the player
    this._outerStage.x = this._renderer.view.width / 2;
    this._outerStage.y = this._renderer.view.height / 2;
    this._innerStage.rotation = -(Math.PI / 2) - this._player.pos.theta;
    this._innerStage.y = this._player.pos.r;
    // Draw everything
    this._renderer.render(this._outerStage);
  }

  // The main update function for the game
  private _update(): void {
    this._gameObjects.forEach(obj => {
      obj.update(this._keyState);
    });
    this._gameObjects.forEach(obj => {
      obj.rollOver();
    })
    this._keyState.rollOver();
  }
}
