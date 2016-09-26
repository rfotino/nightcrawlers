import { Game } from '../game';
import { GameObject } from './game-object';
import { Color } from '../math/color';

export class Background extends GameObject {
  private _sprite: PIXI.Sprite;
  private _canvas: HTMLCanvasElement;

  public constructor(container: PIXI.Container) {
    super();
    this._draw();
    this._sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(this._canvas));
    container.addChildAt(this._sprite, 0);
  }

  public update(game: Game): void {
    super.update(game);
    this._sprite.scale.set(window.innerWidth, window.innerHeight);
    // Update the background to be the appropriate colors based on time of day
    var bgColor: Color;
    let dayColor = new Color(135, 206, 250);
    let nightColor = new Color(0, 0, 50);
    let time = game.timeKeeper.time;
    let threshold = 0.8;
    if (game.timeKeeper.isDay) {
      bgColor = dayColor.clone();
      if (time > threshold) {
        bgColor.blend(nightColor, (time - threshold) / (1 - threshold));
      }
    } else {
      bgColor = nightColor.clone();
      if (time > threshold) {
        bgColor.blend(dayColor, (time - threshold) / (1 - threshold));
      }
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
