import { GameInstance } from '../game-instance';
import { Color } from '../math/color';

export class Background extends PIXI.Container {
  private _sprite: PIXI.Sprite;
  private _canvas: HTMLCanvasElement;

  public constructor() {
    super();
    this._draw();
    this._sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(this._canvas));
    this.addChild(this._sprite);
  }

  public update(game: GameInstance): void {
    this._sprite.scale.set(window.innerWidth, window.innerHeight);
    // Update the background to be the appropriate colors based on time of day
    var bgColor: Color;
    let dayColor = new Color(135, 206, 250);
    let nightColor = new Color(0, 0, 50);
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

  private _draw(): void {
    this._canvas = document.createElement('canvas');
    this._canvas.width = this._canvas.height = 1;
    let ctx = this._canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 1, 1);
  }
}
