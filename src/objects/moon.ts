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
  protected _moonlight: Moonlight;
  protected _sprite: PIXI.Sprite;
  protected _state: MoonState = MoonState.WAITING_DAY;

  public get z(): number { return -1; }

  public constructor(game: GameInstance, moonlight: Moonlight) {
    super(game);
    this._moonlight = moonlight;
    this._sprite = new PIXI.Sprite(
      PIXI.loader.resources['game/moon'].texture
    );
    this._sprite.anchor.set(0.5);
    this.addChild(this._sprite);
  }

  public collidesWith(otherType: string): boolean { return false; }
  public collidable(): boolean { return false; }

  /**
   * Make the moon rise and set.
   */
  public updatePreCollision(): void {
    super.updatePreCollision();
    // Update state machine for handling moonrise and moonset
    const FAST_TANGENTIAL_SPEED = 0.01;
    const SLOW_TANGENTIAL_SPEED = 0.0005;
    const THETA_OFFSET = -0.5;
    const MIN_R = this._game.level.getCoreRadius() - this._moonlight.radius;
    const MAX_R = this._game.level.getOuterRadius();
    const timeKeeper = this._game.timeKeeper;
    switch (this._state) {
      case MoonState.WAITING_DAY:
        if (timeKeeper.transitioning) {
          this.pos.theta = this._game.player.pos.theta + THETA_OFFSET;
          this.vel.theta = FAST_TANGENTIAL_SPEED;
          this._state = MoonState.RISING;
        }
        break;
      case MoonState.RISING:
        if (timeKeeper.transitioning) {
          this.pos.r = MIN_R + ((MAX_R - MIN_R) * timeKeeper.transition);
        } else {
          this.vel.set(0, SLOW_TANGENTIAL_SPEED);
          this._state = MoonState.WAITING_NIGHT;
        }
        break;
      case MoonState.WAITING_NIGHT:
        if (timeKeeper.transitioning) {
          this.vel.theta = FAST_TANGENTIAL_SPEED;
          this._state = MoonState.SETTING;
        }
        break;
      case MoonState.SETTING:
        if (timeKeeper.transitioning) {
          this.pos.r = MAX_R + ((MIN_R - MAX_R) * timeKeeper.transition);
        } else {
          this.pos.r = 0;
          this.vel.set(0, 0);
          this._state = MoonState.WAITING_DAY;
        }
        break;
    }
    // Update the position of the moon and moonlight sprites, with parallax
    // so that the moon seems to follow the player
    let parallaxR = 0.25;
    let parallaxTheta = 0.5;
    let r = this.pos.r + (parallaxR * (this._game.playerView.r - this.pos.r));
    let theta = (
      this.pos.theta +
      (parallaxTheta * (this._game.playerView.theta - this.pos.theta))
    );
    this._sprite.position.x = r * Math.cos(theta);
    this._sprite.position.y = r * Math.sin(theta);
    this._sprite.rotation = (Math.PI / 2) + theta;
    this._moonlight.pos.r = r;
    this._moonlight.pos.theta = theta;
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
  protected _sprite: PIXI.Sprite;

  public get z(): number { return 4; }

  public get radius(): number {
    return Math.max(this._sprite.width, this._sprite.height) / 2;
  }

  public constructor(game: GameInstance) {
    super(game);
    this._sprite = new PIXI.Sprite(
      PIXI.loader.resources['game/moonlight'].texture
    );
    this._sprite.anchor.set(0.5);
    this._mirrorList.push(this._sprite);
    this.addChild(this._sprite);
  }

  public collidesWith(otherType: string): boolean { return false; }
  public collidable(): boolean { return false; }

  public type(): string { return 'moonlight'; }

  public getPolarBounds(): Polar.Rect {
    return new Polar.Rect(this.pos.r, this.pos.theta);
  }
}
