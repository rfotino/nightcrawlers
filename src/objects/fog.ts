import { GameObject } from './game-object';
import { Polar } from '../math/polar';
import { Color } from '../graphics/color';
import { GameInstance } from '../game-instance';

export class Fog extends GameObject {
  protected _sprite: PIXI.Sprite;

  public get z(): number { return 3; };

  public constructor(scale: number = 5) {
    super();
    this._sprite = new PIXI.Sprite(
      PIXI.loader.resources[`game/clouds`].texture
    );
    this._sprite.anchor.set(0.5);
    this._sprite.scale.set(scale);
    this._sprite.alpha = 0.75;
    this._mirrorList.push(this._sprite);
    this.addChild(this._sprite);
    this.vel.theta = 0.001;
  }

  public type(): string { return 'fog'; }

  public getPolarBounds(): Polar.Rect {
    return new Polar.Rect();
  }

  public update(game: GameInstance): void {
    super.update(game);
    // Update the fog to be the appropriate color based on time of day
    var fogColor: Color;
    let dayColor = new Color(255, 255, 255);
    let nightColor = new Color(0, 0, 0);
    let transition = game.timeKeeper.transition;
    if (game.timeKeeper.isDay) {
      fogColor = dayColor.clone();
      fogColor.blend(nightColor, transition);
    } else {
      fogColor = nightColor.clone();
      fogColor.blend(dayColor, transition);
    }
    this._sprite.tint = fogColor.toPixi();
  }
}
