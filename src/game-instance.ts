import { Game } from './game';
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
import { UIContainer } from './ui/container';
import { PauseMenu } from './ui/menu';

export class GameInstance extends UIContainer {
  public planet: Planet;
  public player: Player;
  public platforms: Platform[];
  public background: Background;
  public timeKeeper: TimeKeeper;
  public enemySpawner: EnemySpawner;
  private _outerViewStage: PIXI.Container;
  private _innerViewStage: PIXI.Container;
  private _gameObjects: GameObject[];
  private _playerView: Polar.Coord;
  private _debugger: Debugger;
  private _previousCollisions: Collider.Previous;
  private _pauseMenu: PauseMenu;
  private _paused: boolean;

  public get score(): number {
    return this.player.score;
  }

  public constructor(game: Game) {
    super(game);
    this._outerViewStage = new PIXI.Container();
    this._innerViewStage = new PIXI.Container();
    this.addChild(this._outerViewStage);
    this._outerViewStage.addChild(this._innerViewStage);
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
    // Debugger
    this._debugger = new Debugger(true);
    // Empty previous collisions tracker
    this._previousCollisions = new Collider.Previous();
    // Add game objects to scene
    this._innerViewStage.addChild(this.planet);
    this._innerViewStage.addChild(this.player);
    this.platforms.forEach(platform => {
      this._innerViewStage.addChild(platform);
    });
    this.addChildAt(this.background, 0);
    this.addChild(this._debugger);
    // Initialize the player view
    this._playerView = this.player.pos.clone();
    // Create the pause menu for later
    this._pauseMenu = new PauseMenu(game, this);
    this._paused = false;
  }

  /**
   * Do collision between objects after updating them.
   */
  private _collide(): void {
    let currentCollisions = new Collider.Previous();
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
        let bounds1 = obj1.getPolarBounds();
        let bounds2 = obj2.getPolarBounds();
        let prevBounds1 = this._previousCollisions.getBounds(obj1) || bounds1;
        let prevBounds2 = this._previousCollisions.getBounds(obj2) || bounds2;
        let prevResult = this._previousCollisions.getResult(obj1, obj2);
        let relativeVel = obj2.vel.add(obj1.vel.mul(-1));
        let result = Collider.test(
          bounds1,
          bounds2,
          prevBounds1,
          prevBounds2,
          prevResult,
          relativeVel
        );
        let reverse = result.reverse();
        if (result.any) {
          obj1.collide(obj2, result);
          obj2.collide(obj1, reverse);
        }
        currentCollisions.setBounds(obj1, bounds1);
        currentCollisions.setBounds(obj2, bounds2);
        currentCollisions.setResult(obj1, obj2, result);
        currentCollisions.setResult(obj2, obj1, reverse);
      }
    }
    this._previousCollisions = currentCollisions;
  }

  /**
   * Update the view to be centered on the player.
   */
  public doLayout(): void {
    super.doLayout();
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
    // Center the view on the player
    this._outerViewStage.x = this.view.width / 2;
    this._outerViewStage.y = this.view.height / 2;
    this._innerViewStage.rotation = -(Math.PI / 2) - this._playerView.theta;
    this._innerViewStage.y = this._playerView.r;
  }

  /**
   * The main update function for the game.
   */
  public update(): void {
    super.update();
    // Pause if the player hit escape
    if (this.keyState.isPressed('Escape')) {
      this.pause();
    }
    // Do not update anything if paused
    if (this._paused) {
      return;
    }
    // Update time of day
    this.timeKeeper.update();
    // Maybe spawn an enemy
    this.enemySpawner.update(this);
    // Update the background for the time of day
    this.background.update(this);
    // Call each game object's update function
    this._gameObjects.forEach(obj => obj.update(this));
    // Collide objects
    this._collide();
    // Remove dead game objects
    this._gameObjects.forEach(obj => {
      if (!obj.alive) {
        this._innerViewStage.removeChild(obj);
      }
    });
    this._gameObjects = this._gameObjects.filter(obj => obj.alive);
    // Roll over previous game object positions
    this._gameObjects.forEach(obj => obj.rollOver());
    // Update the debug text
    this._debugger.update(this);
  }

  public addGameObject(obj: GameObject): void {
    this._innerViewStage.addChild(obj);
    this._gameObjects.push(obj);
  }

  public pause(): void {
    if (!this._paused) {
      this._paused = true;
      this.addComponent(this._pauseMenu);
    }
  }

  public resume(): void {
    if (this._paused) {
      this._paused = false;
      this.removeComponent(this._pauseMenu);
    }
  }
}
