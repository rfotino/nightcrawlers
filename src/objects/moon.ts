import { GameObject } from './game-object';
import { Polar } from '../math/polar';
import { GameInstance } from '../game-instance';

const enum MoonState {
  WAITING_DAY,
  RISING,
  WAITING_NIGHT,
  SETTING,
}

/**
 * A moon behind the fog and decoration objects.
 */
export class Moon extends GameObject {
  protected _sprite: PIXI.Sprite;
  protected _state: MoonState = MoonState.WAITING_DAY;

  public get z(): number { return -1; }

  public get movable(): boolean { return false; }

  public constructor() {
    super();
    this._sprite = new PIXI.Sprite(
      PIXI.loader.resources['game/moon'].texture
    );
    this._sprite.anchor.set(0.5);
    this._mirrorList.push(this._sprite);
    this.addChild(this._sprite);
  }

  /**
   * Make the moon rise and set.
   */
  public update(game: GameInstance): void {
    super.update(game);
    const FAST_TANGENTIAL_SPEED = 0.01;
    const SLOW_TANGENTIAL_SPEED = 0.0005;
    const THETA_OFFSET = -0.5;
    const MIN_R = game.level.getCoreRadius() - Moonlight.RADIUS;
    const MAX_R = game.level.getOuterRadius();
    switch (this._state) {
      case MoonState.WAITING_DAY:
        if (game.timeKeeper.transitioning) {
          this.pos.theta = game.player.pos.theta + THETA_OFFSET;
          this.vel.theta = FAST_TANGENTIAL_SPEED;
          this._state = MoonState.RISING;
        }
        break;
      case MoonState.RISING:
        if (game.timeKeeper.transitioning) {
          this.pos.r = MIN_R + ((MAX_R - MIN_R) * game.timeKeeper.transition);
        } else {
          this.vel.set(0, SLOW_TANGENTIAL_SPEED);
          this._state = MoonState.WAITING_NIGHT;
        }
        break;
      case MoonState.WAITING_NIGHT:
        if (game.timeKeeper.transitioning) {
          this.vel.theta = FAST_TANGENTIAL_SPEED;
          this._state = MoonState.SETTING;
        }
        break;
      case MoonState.SETTING:
        if (game.timeKeeper.transitioning) {
          this.pos.r = MAX_R + ((MIN_R - MAX_R) * game.timeKeeper.transition);
        } else {
          this.pos.r = 0;
          this.vel.set(0, 0);
          this._state = MoonState.WAITING_DAY;
        }
        break;
    }
  }

  public type(): string { return 'moon'; }

  public getPolarBounds(): Polar.Rect {
    return new Polar.Rect(this.pos.r, this.pos.theta);
  }
}

/**
 * A glowy halo that follows the moon, overlayed on top of the fog.
 */
export class Moonlight extends GameObject {
  protected _moon: Moon;
  protected _sprite: PIXI.Sprite;

  public get z(): number { return 4; }

  public get movable(): boolean { return false; }

  public static get RADIUS(): number {
    let texture = PIXI.loader.resources['game/moonlight'].texture.baseTexture;
    return Math.max(texture.width, texture.height) / 2;
  }

  public constructor(moon: Moon) {
    super();
    this._moon = moon;
    this._sprite = new PIXI.Sprite(
      PIXI.loader.resources['game/moonlight'].texture
    );
    this._sprite.anchor.set(0.5);
    this._mirrorList.push(this._sprite);
    this.addChild(this._sprite);
    this.pos.set(1500, 0);
  }

  /**
   * Set position to be the same as the moon's.
   */
  public update(game: GameInstance): void {
    super.update(game);
    this.pos.set(this._moon.pos.r, this._moon.pos.theta);
  }

  public type(): string { return 'moonlight'; }

  public getPolarBounds(): Polar.Rect {
    return new Polar.Rect(this.pos.r, this.pos.theta);
  }
}
