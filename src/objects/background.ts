import { Game } from '../game';
import { GameObject } from './game-object';

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
    let a = game.timeKeeper.isDay ? game.timeKeeper.time : 1 - game.timeKeeper.time;
    let b = Math.round(a * 255);
    this._sprite.tint = (b << 16) | (b << 8) | b;
  }

  private _draw(): void {
    this._canvas = document.createElement('canvas');
    this._canvas.width = this._canvas.height = 1;
    let ctx = this._canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 1, 1);
  }
}
