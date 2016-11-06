import { GameObject } from './game-object';
import { Polar } from '../math/polar';
import { GameInstance } from '../game-instance';

const enum SunState {
  INITIAL,
  WAITING_DAY,
  RISING,
  WAITING_NIGHT,
  SETTING,
}

/**
 * A moon behind the fog and decoration objects.
 */
export class Sun extends GameObject {
  protected _sprite: PIXI.Sprite;
  protected _state: SunState = SunState.INITIAL;

  public get z(): number { return -5; }

  public get radius(): number {
    return Math.max(this._sprite.width, this._sprite.height) / 2;
  }

  public constructor(game: GameInstance) {
    super(game);
    this._sprite = new PIXI.Sprite(
      PIXI.loader.resources['game/sun'].texture
    );
    this._sprite.anchor.set(0.5);
    this.addChild(this._sprite);
  }

  public collidable(): boolean { return false; }

  public movable(): boolean { return false; }

  /**
   * Make the moon rise and set.
   */
  public update(): void {
    super.update();
    // Update state machine for handling moonrise and moonset
    const FAST_TANGENTIAL_SPEED = 0.01;
    const SLOW_TANGENTIAL_SPEED = 0.0005;
    const THETA_OFFSET = -0.5;
    const MIN_R = this._game.level.getCoreRadius() - this.radius;
    const MAX_R = this._game.level.getOuterRadius() * 1.15;
    const timeKeeper = this._game.timeKeeper;
    switch (this._state) {
      case SunState.INITIAL:
        this.pos.r = MAX_R;
        this.pos.theta = this._game.player.pos.theta;
        this._state = SunState.WAITING_DAY;
        break;
      case SunState.WAITING_DAY:
        this.pos.r = MAX_R;
        if (timeKeeper.transitioning) {
          this.vel.theta = FAST_TANGENTIAL_SPEED;
          this._state = SunState.SETTING;
        }
        break;
      case SunState.SETTING:
        if (timeKeeper.transitioning) {
          this.pos.r = MAX_R + ((MIN_R - MAX_R) * timeKeeper.transition);
        } else {
          this.pos.r = 0;
          this.vel.set(0, SLOW_TANGENTIAL_SPEED);
          this._state = SunState.WAITING_NIGHT;
        }
        break;
      case SunState.WAITING_NIGHT:
        if (timeKeeper.transitioning) {
          this.pos.theta = this._game.player.pos.theta + THETA_OFFSET;
          this.vel.theta = FAST_TANGENTIAL_SPEED;
          this._state = SunState.RISING;
        }
        break;
      case SunState.RISING:
        if (timeKeeper.transitioning) {
          this.pos.r = MIN_R + ((MAX_R - MIN_R) * timeKeeper.transition);
        } else {
          this.vel.set(0, 0);
          this._state = SunState.WAITING_DAY;
        }
        break;
    }
    // Update the position of the moon and moonlight sprites, with parallax
    // so that the moon seems to follow the player
    let parallaxR = 0.5;
    let parallaxTheta = 0.75;
    let r = this.pos.r + (parallaxR * (this._game.playerView.r - this.pos.r));
    let theta = (
      this.pos.theta +
      (parallaxTheta * (this._game.playerView.theta - this.pos.theta))
    );
    this._sprite.position.x = r * Math.cos(theta);
    this._sprite.position.y = r * Math.sin(theta);
    this._sprite.rotation = (Math.PI / 2) + theta;
  }

  public type(): string { return 'moon'; }

  public getPolarBounds(): Polar.Rect {
    return new Polar.Rect(this.pos.r, this.pos.theta);
  }
}
