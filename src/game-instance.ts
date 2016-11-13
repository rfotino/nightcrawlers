import { Game } from './game';
import { Level } from './level';
import { Options } from './options';
import { GameObject } from './objects/game-object';
import { Player } from './objects/player';
import { Fog } from './objects/fog';
import { Moon, Moonlight} from './objects/moon';
import { Sun } from './objects/sun';
import * as Terrain from './objects/terrain';
import { Enemy } from './objects/enemy';
import { EnemySpawner } from './objects/enemy-spawner';
import { ItemSpawner } from './objects/item-spawner';
import { TimeKeeper } from './timekeeper';
import { KeyState } from './input/keystate';
import { Polar } from './math/polar';
import { Counter } from './math/counter';
import { Color } from './graphics/color';
import { Debugger } from './debug';
import { Collider } from './math/collider';
import { UIContainer } from './ui/container';
import { UILabel } from './ui/label';
import { PauseMenu, GameOverMenu } from './ui/menu';
import { UIPortrait } from './ui/portrait';
import { CurrentWeaponIndicator } from './ui/current-weapon';
import { EnemyIndicator } from './ui/enemy-indicator';

export class GameInstance extends UIContainer {
  public player: Player;
  public timeKeeper: TimeKeeper;
  public enemySpawner: EnemySpawner;
  public itemSpawners: ItemSpawner[];
  public fog: Fog;
  public moon: Moon;
  public sun: Sun;
  public level: Level;
  public gameObjects: GameObject[];
  public playerView: Polar.Coord;
  protected _options: Options;
  protected _outerViewStage: PIXI.Container;
  protected _innerViewStage: PIXI.Container;
  protected _debugger: Debugger;
  protected _previousCollisions: Collider.Previous;
  protected _gameOverMenu: GameOverMenu;
  protected _pauseMenu: PauseMenu;
  protected _paused: boolean;
  protected _enemyIndicator: EnemyIndicator;
  protected _playerPortrait: UIPortrait;
  protected _currentWeaponIndicator: CurrentWeaponIndicator;
  protected _scoreLabel: UILabel;
  protected _waveIndex: number;
  protected _nightMusic: Howl;
  protected _nightMusicId: number;
  protected _fadeTransitioningIn: boolean = false;
  protected _fadeTransitioningOut: boolean = false;
  protected _fadeTransitionCounter: Counter = new Counter();
  protected _fader: PIXI.Sprite;

  public get options(): Options {
    return this._options;
  }

  public get score(): number {
    return this.player.score;
  }

  public constructor(game: Game, options: Options) {
    super(game);
    this._options = options;
    this.level = this._options.getLevel(this);
    this._outerViewStage = new PIXI.Container();
    this._innerViewStage = new PIXI.Container();
    this.addChild(this._outerViewStage);
    this._outerViewStage.addChild(this._innerViewStage);
    // Construct game objects
    this.player = new Player(this);
    this.timeKeeper = new TimeKeeper();
    this.enemySpawner = new EnemySpawner();
    this.itemSpawners = this.level.getItemSpawners();
    this.fog = new Fog(this, 6);
    const moonlight = new Moonlight(this);
    this.moon = new Moon(this, moonlight);
    this.sun = new Sun(this);
    this.gameObjects = [].concat(
      [
        this.player,
        this.fog,
        this.moon,
        moonlight,
        this.sun,
      ],
      this.level.getObjects()
    );
    // Debugger
    this._debugger = new Debugger(game, this, this._options.debug);
    this.addComponent(this._debugger);
    // Empty previous collisions tracker
    this._previousCollisions = new Collider.Previous();
    // Add game objects to scene
    this.gameObjects.forEach(obj => {
      this._innerViewStage.addChild(obj);
    });
    this.addChild(this._debugger);
    // Initialize the player view
    this.playerView = this.player.pos.clone();
    // Create the game over menu for later
    this._gameOverMenu = new GameOverMenu(game, this);
    // Create the pause menu for later
    this._pauseMenu = new PauseMenu(game, this);
    this._paused = false;
    // Add enemy indicator
    this._enemyIndicator = new EnemyIndicator(game, this);
    this.addComponent(this._enemyIndicator);
    // Add the player portrait, which comes with health and energy bars
    this._playerPortrait = new UIPortrait(game, this.player);
    this.addComponent(this._playerPortrait);
    // Add current weapon indicator
    this._currentWeaponIndicator = new CurrentWeaponIndicator(
      game, this.player
    );
    this.addComponent(this._currentWeaponIndicator);
    // Add score label
    this._scoreLabel = new UILabel(game, '0');
    this.addComponent(this._scoreLabel);
    // Set initial wave index to zero and seed initial wave of monsters
    this._waveIndex = 0;
    this.enemySpawner.addWave(this.level.getWave(0));
    // Load background music
    this._nightMusic = new Howl({
      src: ['assets/music/night.mp3', 'assets/music/night.m4a'],
      autoplay: false,
      loop: true,
    });
    this._nightMusicId = this._nightMusic.play();
    this._nightMusic.pause(this._nightMusicId);
    // Add audio triggers to timekeeper
    this.timeKeeper.on('dayend', () => {
      this._nightMusic.play(this._nightMusicId);
      this._nightMusic.fade(0, 1, 1000, this._nightMusicId);
    });
    this.timeKeeper.on('nightend', () => {
      this._nightMusic.fade(1, 0, 1000, this._nightMusicId);
      this._nightMusic.once('fade', () => {
        this._nightMusic.pause(this._nightMusicId);
      });
    });
    // Add transparent black sprite for fading in and out
    this._fader = new PIXI.Sprite(new Color(0, 0, 0).genTexture());
    this._fader.alpha = 0;
    this.addChild(this._fader);
  }

  /**
   * Do collision between objects after updating them.
   */
  private _collide(): void {
    // Precalculate all starting bounds
    let currentCollisions = new Collider.Previous();
    this.gameObjects.forEach(obj => {
      if (obj.collidable()) {
        currentCollisions.setBounds(obj, obj.getPolarBounds());
      }
    });
    // Do collision against each pair of live and collidable objects
    for (let i = 0; i < this.gameObjects.length; i++) {
      let obj1 = this.gameObjects[i];
      if (!obj1.alive || !obj1.collidable()) {
        continue;
      }
      for (let j = i + 1; j < this.gameObjects.length; j++) {
        let obj2 = this.gameObjects[j];
        if (!obj2.alive || !obj2.collidable()) {
          continue;
        }
        // No use colliding two immobile objects
        if (!obj1.movable() && !obj2.movable()) {
          continue;
        }
        // Grab precalculated bounds, do a quick bounds check before doing
        // anything too heavy
        let bounds1 = currentCollisions.getBounds(obj1);
        let bounds2 = currentCollisions.getBounds(obj2);
        if (!bounds2.intersects(bounds1)) {
          continue;
        }
        // Grab previous bounds and result, we're going to do a full collision
        // test
        let prevBounds1 = this._previousCollisions.getBounds(obj1) || bounds1;
        let prevBounds2 = this._previousCollisions.getBounds(obj2) || bounds2;
        let prevResult = this._previousCollisions.getResult(obj1, obj2);
        let relativeVel = new Polar.Coord(
          obj2.vel.r - obj1.vel.r,
          obj2.vel.theta - obj1.vel.theta
        );
        let result = Collider.test(
          bounds1,
          bounds2,
          prevBounds1,
          prevBounds2,
          prevResult,
          relativeVel
        );
        let reverse = result.reverse();
        // If there was a collision, let individual objects handle the response
        if (result.any) {
          obj1.collide(obj2, result);
          obj2.collide(obj1, reverse);
        }
        // Save the results for the next frame
        currentCollisions.setResult(obj1, obj2, result);
        currentCollisions.setResult(obj2, obj1, reverse);
        // If we've got a dead object, quit while we're ahead
        if (!obj1.alive) {
          break;
        }
      }
    }
    // Do a post-calculation of bounds, just to make sure that the previous
    // bounds for the next frame accurately represent the positions of the
    // objects
    this.gameObjects.forEach(obj => {
      if (obj.collidable() && obj.movable()) {
        currentCollisions.setBounds(obj, obj.getPolarBounds());
      }
    });
    // Roll over the previous collisions
    this._previousCollisions = currentCollisions;
  }

  /**
   * Update the view to be centered on the player.
   */
  public doLayout(): void {
    super.doLayout();
    // Make this component fill the view
    this.width = this.view.width;
    this.height = this.view.height;
    // Scroll the view if the player goes too close to the edge of the screen
    let viewableTheta = this.view.width / (this.player.pos.r * 2);
    let diffTheta = viewableTheta / 3;
    let minTheta = this.player.pos.theta - diffTheta;
    let maxTheta = this.player.pos.theta + diffTheta;
    if (this.playerView.theta < minTheta) {
      this.playerView.theta = minTheta;
    } else if (this.playerView.theta > maxTheta) {
      this.playerView.theta = maxTheta;
    }
    this.playerView.r = Math.max(
      // Minimum view height
      this.level.getCoreRadius() + (this.view.height / 4),
      // Weighted average of current view height and current player height
      (this.player.pos.r + (5 * this.playerView.r)) / 6
    );
    // Center the view on the player
    this._outerViewStage.x = this.view.width / 2;
    this._outerViewStage.y = this.view.height / 2;
    this._innerViewStage.rotation = -(Math.PI / 2) - this.playerView.theta;
    this._innerViewStage.y = this.playerView.r;
    // Update enemy indicator position, should cover the whole game instance
    this._enemyIndicator.x = 0;
    this._enemyIndicator.y = 0;
    this._enemyIndicator.width = this.view.width;
    this._enemyIndicator.height = this.view.height;
    // Update player portrait's position
    this._playerPortrait.x = Math.min(50, 0.05* this.view.width);
    this._playerPortrait.y = Math.min(50, 0.05 * this.view.height);
    // Update score label position
    this._scoreLabel.height = this.view.height * 0.15;
    this._scoreLabel.x = (this.view.width - this._scoreLabel.width) / 2;
    this._scoreLabel.y = Math.min(20, this.view.height * 0.02);
    // Update current weapon indicator position
    this._currentWeaponIndicator.x = this._playerPortrait.x + 20;
    this._currentWeaponIndicator.y = (
      this._playerPortrait.y +
      this._playerPortrait.height +
      20
    );
    // Update debugger position
    this._debugger.x = (this.view.width * 0.95) - this._debugger.width;
    this._debugger.y = (this.view.height * 0.95) - this._debugger.height;
  }

  /**
   * Returns true if we are neither fading in nor out.
   */
  public isTransitionDone(): boolean {
    return !this._fadeTransitioningIn && !this._fadeTransitioningOut;
  }

  /**
   * Starts transitioning in or out.
   */
  public startTransition(isIn: boolean): void {
    this._fadeTransitionCounter.reset();
    this._fadeTransitionCounter.max = isIn ? 60 : 20;
    this._fadeTransitioningIn = isIn;
    this._fadeTransitioningOut = !isIn;
  }

  /**
   * The main update function for the game.
   */
  public update(): void {
    super.update();
    // Update fader size and opacity for fading in and out
    if (this._fadeTransitioningIn || this._fadeTransitioningOut) {
      this.setChildIndex(this._fader, this.children.length - 1);
      this._fader.scale.set(this.width, this.height);
      this._fadeTransitionCounter.next();
      if (this._fadeTransitionCounter.done()) {
        this._fadeTransitioningIn = this._fadeTransitioningOut = false;
      } else {
        if (this._fadeTransitioningIn) {
          this._fader.alpha = 1 - this._fadeTransitionCounter.percent();
        } else {
          this._fader.alpha = this._fadeTransitionCounter.percent();
        }
      }
    } else {
      this._fader.alpha = 0;
    }
    // Do not update anything else if paused
    if (this._paused) {
      return;
    }
    // Pause if the player hit escape
    if (this.keyState.isPressed(KeyState.ESCAPE)) {
      this.addComponent(this._pauseMenu);
      this.pause();
      return;
    }
    // Show the game over screen if the player has died
    if (!this.player.alive) {
      this.addComponent(this._gameOverMenu);
      this.pause();
      return;
    }
    // Update time of day
    this.timeKeeper.update();
    // Maybe spawn an enemy
    this.enemySpawner.update(this);
    // Maybe spawn some items
    this.itemSpawners.forEach(spawner => spawner.update(this));
    // Update background color based on time of day
    const dayColor = new Color(135, 206, 250);
    const nightColor = new Color(100, 160, 200);
    if (this.timeKeeper.isDay) {
      this.bgcolor = dayColor.blend(nightColor, this.timeKeeper.transition);
    } else {
      this.bgcolor = nightColor.blend(dayColor, this.timeKeeper.transition);
    }
    // Call each game object's update function
    this.gameObjects.forEach(obj => obj.update());
    // Collide objects
    this._collide();
    // Remove dead game objects
    this.gameObjects.forEach(obj => {
      if (!obj.alive) {
        this._innerViewStage.removeChild(obj);
      }
    });
    this.gameObjects = this.gameObjects.filter(obj => obj.alive);
    // End the night if all enemies in the wave were defeated
    if (this.timeKeeper.isNight &&
        this.enemySpawner.numAlive === 0 &&
        this.enemySpawner.numToSpawn === 0) {
      this.timeKeeper.endNight();
      this._waveIndex++;
      this.enemySpawner.addWave(this.level.getWave(this._waveIndex));
    }
    // Sort game objects by depth, then radial position so that lower objects
    // are on top of higher objects of the same type, then sort by ID so that
    // the sorting is deterministic
    this.gameObjects.sort((a, b) => {
      return a.z - b.z || b.pos.r - a.pos.r || a.id - b.id;
    });
    this.gameObjects.forEach((obj, index) => {
      this._innerViewStage.setChildIndex(obj, index);
    });
    // Mirror sprite positions of game objects
    this.gameObjects.forEach(obj => obj.mirror());
    // Roll over previous game object positions
    this.gameObjects.forEach(obj => obj.rollOver());
    // Update the score label
    this._scoreLabel.title = `${this.score}`;
  }

  /**
   * Adds a new game object to the collision, updating, and drawing subsystems.
   */
  public addGameObject(obj: GameObject): void {
    this._innerViewStage.addChild(obj);
    this.gameObjects.push(obj);
  }

  /**
   * Pause gameplay, or do nothing if already paused.
   */
  public pause(): void {
    if (!this._paused) {
      if (this.timeKeeper.isNight) {
        this._nightMusic.pause(this._nightMusicId);
      }
      this._paused = true;
    }
  }

  /**
   * Resume gameplay, or do nothing if not paused.
   */
  public resume(): void {
    if (this._paused) {
      if (this.timeKeeper.isNight) {
        this._nightMusic.play(this._nightMusicId);
      }
      this._paused = false;
      this.removeComponent(this._pauseMenu);
    }
  }

  /**
   * Clean up resources from game instance.
   */
  public cleanup(): void {
    this._nightMusic.stop();
  }
}
