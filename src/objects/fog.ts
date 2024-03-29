import { GameObject } from './game-object';
import { Polar } from '../math/polar';
import { Color } from '../graphics/color';
import { GameInstance } from '../game-instance';

export class Fog extends GameObject {
  protected _daySprite: PIXI.Sprite;
  protected _nightSprite: PIXI.Sprite;

  public get z(): number { return 3; };

  public constructor(game: GameInstance, scale: number = 5) {
    super(game);
    const texture = PIXI.loader.resources['game/clouds'].texture;
    this._daySprite = new PIXI.Sprite(texture);
    this._nightSprite = new PIXI.Sprite(texture);
    this._daySprite.anchor.set(0.5);
    this._nightSprite.anchor.set(0.5);
    this._daySprite.scale.set(scale);
    this._nightSprite.scale.set(scale);
    this._daySprite.alpha = 0.75;
    this._nightSprite.alpha = 0;
    this._nightSprite.tint = new Color(0, 0, 0).toPixi();
    this._mirrorList.push(this._daySprite);
    this._mirrorList.push(this._nightSprite);
    this.addChild(this._daySprite);
    this.addChild(this._nightSprite);
    this.vel.theta = 0.001;
  }

  public collidesWith(otherType: string): boolean { return false; }
  public collidable(): boolean { return false; }

  public type(): string { return 'fog'; }

  public getPolarBounds(): Polar.Rect {
    return new Polar.Rect();
  }

  public updatePreCollision(): void {
    super.updatePreCollision();
    // Update the fog to be the appropriate color based on time of day
    if (this._game.timeKeeper.isDay) {
      this._daySprite.alpha = 0.75 * (1 - this._game.timeKeeper.transition);
      this._nightSprite.alpha = 0.75 * this._game.timeKeeper.transition;
    } else {
      this._daySprite.alpha = 0.75 * this._game.timeKeeper.transition;
      this._nightSprite.alpha = 0.75 * (1 - this._game.timeKeeper.transition);
    }
  }
}
