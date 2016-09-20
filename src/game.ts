/// <reference path="../typings/pixi.js/pixi.js.d.ts" />

import { GameObject } from './gameobject';
import { Planet } from './planet';
import { Player } from './player';

export class Game {
  private _renderer: PIXI.CanvasRenderer | PIXI.WebGLRenderer;
  private _stage: PIXI.Container;
  private _planet: Planet;
  private _player: Player;
  private _gameObjects: GameObject[];

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
    this._stage = new PIXI.Container();
    // Preload assets
    let self = this;
    PIXI.loader.add('planet', 'assets/planet.png');
    PIXI.loader.add('player', 'assets/player.png');
    PIXI.loader.load(() => self._onAssetsLoaded());
  }

  private _onAssetsLoaded(): void {
    // Construct game objects
    this._planet = new Planet(this._stage);
    this._player = new Player(this._stage);
    this._gameObjects = [
      this._planet,
      this._player,
    ];
    // Start the update/draw loop
    this._updateDrawLoop();
  }

  private _updateDrawLoop(): void {
    // Request the next frame
    let self = this;
    window.requestAnimationFrame(() => self._updateDrawLoop());
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
    this._stage.x = -this._player.pos.x;
    this._stage.y = -this._player.pos.y;
    // Draw everything
    this._renderer.render(this._stage);
  }

  // The main update function for the game
  private _update(): void {
    this._gameObjects.forEach((obj) => obj.update());
  }
}
