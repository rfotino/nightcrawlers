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
    let fogColor: Color;
    const dayColor = new Color(255, 255, 255);
    const nightColor = new Color(0, 0, 0);
    if (game.timeKeeper.isDay) {
      fogColor = dayColor.blend(nightColor, game.timeKeeper.transition);
    } else {
      fogColor = nightColor.blend(dayColor, game.timeKeeper.transition);
    }
    this._sprite.tint = fogColor.toPixi();
  }
}
