import { GameInstance } from '../game-instance';
import { Color } from '../graphics/color';

export class Background extends PIXI.Container {
  private _sprite: PIXI.Sprite;

  public constructor() {
    super();
    this._sprite = new PIXI.Sprite(Color.white.genTexture());
    this.addChild(this._sprite);
  }

  public update(game: GameInstance): void {
    this._sprite.scale.set(window.innerWidth, window.innerHeight);
    // Update the background to be the appropriate colors based on time of day
    var bgColor: Color;
    let dayColor = new Color(135, 206, 250);
    let nightColor = new Color(100, 160, 200);
    let transition = game.timeKeeper.transition;
    if (game.timeKeeper.isDay) {
      bgColor = dayColor.clone();
      bgColor.blend(nightColor, transition);
    } else {
      bgColor = nightColor.clone();
      bgColor.blend(dayColor, transition);
    }
    this._sprite.tint = bgColor.toPixi();
  }
}
