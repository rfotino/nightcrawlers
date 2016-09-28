/// <reference path="../typings/pixi.js/pixi.js.d.ts" />

import { GameObject } from './objects/game-object';
import { Planet } from './objects/planet';
import { Player } from './objects/player';
import { Platform } from './objects/platform';
import { Enemy } from './objects/enemy';
import { EnemySpawner } from './objects/enemy-spawner';
import { Background } from './objects/background';
import { TimeKeeper } from './timekeeper';
import { KeyState } from './input/keystate';
import { Polar } from './math/polar';
import { Debugger } from './debug';
import { Collider } from './math/collider';

export class Game {
  public planet: Planet;
  public player: Player;
  public platforms: Platform[];
  public background: Background;
  public keyState: KeyState;
  public timeKeeper: TimeKeeper;
  public enemySpawner: EnemySpawner;
  private _renderer: PIXI.CanvasRenderer | PIXI.WebGLRenderer;
  private _rootStage: PIXI.Container;
  private _outerViewStage: PIXI.Container;
  private _innerViewStage: PIXI.Container;
  private _gameObjects: GameObject[];
  private _playerView: Polar.Coord;
  private _debugger: Debugger;

  public get view(): HTMLCanvasElement {
    return this._renderer.view;
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
    this._rootStage = new PIXI.Container();
    this._outerViewStage = new PIXI.Container();
    this._innerViewStage = new PIXI.Container();
    this._rootStage.addChild(this._outerViewStage);
    this._outerViewStage.addChild(this._innerViewStage);
    // Debugger
    this._debugger = new Debugger(true);
    // Add key listeners
    this.keyState = new KeyState();
    this.keyState.addListeners(this._renderer.view);
    this._renderer.view.tabIndex = -1;
    // Preload assets
    PIXI.loader.add('planet', 'assets/planet.png');
    PIXI.loader.add('player', 'assets/player.png');
    PIXI.loader.load(() => this._onAssetsLoaded());
  }

  private _onAssetsLoaded(): void {
    // Construct game objects
    this.planet = new Planet();
    this.player = new Player();
    this.platforms = [
      // Stairs
      new Platform(Planet.RADIUS + 100, 0.00, 0.25),
      new Platform(Planet.RADIUS + 200, 0.25, 0.25),
      new Platform(Planet.RADIUS + 300, 0.50, 0.25),
      new Platform(Planet.RADIUS + 400, 0.75, 0.25),
      new Platform(Planet.RADIUS + 500, 1.00, 0.25),
      // Moving platforms
      new Platform(Planet.RADIUS + 75, 0, 0.35),
      new Platform(Planet.RADIUS + 150, 0, 0.5),
    ];
    this.platforms[5].vel.theta = 0.001;
    this.platforms[6].vel.theta = -0.005;
    this.timeKeeper = new TimeKeeper();
    this.enemySpawner = new EnemySpawner();
    this.background = new Background();
    this._gameObjects = [].concat(
      [
        this.planet,
        this.player,
      ],
      this.platforms
    );
    // Add game objects to scene
    this._innerViewStage.addChild(this.planet);
    this._innerViewStage.addChild(this.player);
    this.platforms.forEach(platform => {
      this._innerViewStage.addChild(platform);
    });
    this._rootStage.addChildAt(this.background, 0);
    this._rootStage.addChild(this._debugger);
    // Initialize the player view
    this._playerView = this.player.pos.clone();
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
    this._outerViewStage.x = this._renderer.view.width / 2;
    this._outerViewStage.y = this._renderer.view.height / 2;
    this._innerViewStage.rotation = -(Math.PI / 2) - this._playerView.theta;
    this._innerViewStage.y = this._playerView.r;
    // Draw everything
    this._renderer.render(this._rootStage);
  }

  // The main update function for the game
  private _update(): void {
    // Update time of day
    this.timeKeeper.update();
    // Maybe spawn an enemy
    this.enemySpawner.update(this);
    // Update the background for the time of day
    this.background.update(this);
    // Call each game object's update function
    this._gameObjects.forEach(obj => {
      if (obj.alive) {
        obj.update(this);
      }
    });
    // Collide objects
    for (let i = 0; i < this._gameObjects.length; i++) {
      let obj1 = this._gameObjects[i];
      if (!obj1.alive) {
        continue;
      }
      for (let j = i + 1; j < this._gameObjects.length; j++) {
        let obj2 = this._gameObjects[j];
        if (!obj2.alive) {
          continue;
        }
        let result = Collider.test(obj1, obj2);
        if (result.any) {
          obj1.collide(obj2, result);
          obj2.collide(obj1, result.reverse());
        }
      }
    }
    // Remove dead game objects
    this._gameObjects.forEach(obj => {
      if (!obj.alive) {
        this._innerViewStage.removeChild(obj);
      }
    });
    this._gameObjects = this._gameObjects.filter(obj => obj.alive);
    // Roll over previous game object positions key states
    this._gameObjects.forEach(obj => {
      obj.rollOver();
    });
    this.keyState.rollOver();
    // Update the view if the player has moved
    let viewableTheta = this.view.width / (this.planet.radius * 2);
    let diffTheta = viewableTheta / 3;
    let minTheta = this.player.pos.theta - diffTheta;
    let maxTheta = this.player.pos.theta + diffTheta;
    if (this._playerView.theta < minTheta) {
      this._playerView.theta = minTheta;
    } else if (this._playerView.theta > maxTheta) {
      this._playerView.theta = maxTheta;
    }
    this._playerView.r = Math.max(
      // Minimum view height
      Planet.RADIUS + (this.view.height / 4),
      // Weighted average of current view height and current player height
      (this.player.pos.r + (5 * this._playerView.r)) / 6
    );
    // Update the debug text
    this._debugger.update(this);
  }

  public addGameObject(obj: GameObject): void {
    this._innerViewStage.addChild(obj);
    this._gameObjects.push(obj);
  }
}
