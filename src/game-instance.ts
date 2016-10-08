import { Game } from './game';
import { Level } from './level';
import { Options } from './options';
import { GameObject } from './objects/game-object';
import { Player } from './objects/player';
import * as Terrain from './objects/terrain';
import { Enemy } from './objects/enemy';
import { EnemySpawner } from './objects/enemy-spawner';
import { ItemSpawner } from './objects/item-spawner';
import { Background } from './objects/background';
import { TimeKeeper } from './timekeeper';
import { KeyState } from './input/keystate';
import { Polar } from './math/polar';
import { Debugger } from './debug';
import { Collider } from './math/collider';
import { UIContainer } from './ui/container';
import { PauseMenu } from './ui/menu';

export class GameInstance extends UIContainer {
  public player: Player;
  public background: Background;
  public timeKeeper: TimeKeeper;
  public enemySpawner: EnemySpawner;
  public itemSpawners: ItemSpawner[];
  protected _level: Level;
  protected _options: Options;
  protected _outerViewStage: PIXI.Container;
  protected _innerViewStage: PIXI.Container;
  protected _gameObjects: GameObject[];
  protected _playerView: Polar.Coord;
  protected _debugger: Debugger;
  protected _previousCollisions: Collider.Previous;
  protected _pauseMenu: PauseMenu;
  protected _paused: boolean;

  public get score(): number {
    return this.player.score;
  }

  public constructor(game: Game, options: Options) {
    super(game);
    this._options = options;
    this._level = this._options.level;
    this._outerViewStage = new PIXI.Container();
    this._innerViewStage = new PIXI.Container();
    this.addChild(this._outerViewStage);
    this._outerViewStage.addChild(this._innerViewStage);
    // Construct game objects
    this.player = new Player(this._level);
    this.timeKeeper = new TimeKeeper();
    this.enemySpawner = new EnemySpawner();
    this.itemSpawners = this._level.getItemSpawners();
    this.background = new Background();
    this._gameObjects = [].concat(
      [
        this.player,
      ],
      this._level.getObjects()
    );
    // Debugger
    this._debugger = new Debugger(this._options.debug);
    // Empty previous collisions tracker
    this._previousCollisions = new Collider.Previous();
    // Add game objects to scene
    this._innerViewStage.addChild(this.player);
    this._level.getObjects().forEach(obj => {
      this._innerViewStage.addChild(obj);
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
   * Returns true if the renderer we're using is WebGL based.
   */
  public isWebGL(): boolean {
    return this._game.isWebGL();
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
        if (!obj1.movable && !obj2.movable) {
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
    let viewableTheta = this.view.width / (this.player.pos.r * 2);
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
      this._level.getCoreRadius() + (this.view.height / 4),
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
    if (this.keyState.isPressed(KeyState.ESCAPE)) {
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
    // Maybe spawn some items
    this.itemSpawners.forEach(spawner => spawner.update(this));
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
    // Sort game objects by depth
    this._gameObjects.sort((a, b) => a.z - b.z || a.id - b.id);
    this._gameObjects.forEach((obj, index) => {
      this._innerViewStage.setChildIndex(obj, index);
    });
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
