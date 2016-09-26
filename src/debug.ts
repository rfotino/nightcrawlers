import { GameObject } from './objects/game-object';
import { Game } from './game';

export class Debugger extends GameObject {
  private _text: PIXI.Text;
  private _lastTime: number;
  private _frameTimes: number[];

  public constructor(container: PIXI.Container, visible: boolean = false) {
    super();
    this._text = new PIXI.Text('', {
      fontFamily: 'Arial',
      fontSize: '50px',
      fill: 'white',
    });
    this._text.visible = visible;
    container.addChild(this._text);
    this._lastTime = Date.now();
    this._frameTimes = [];
  }

  public update(game: Game) {
    // Get time taken between frames
    let curTime = Date.now();
    this._frameTimes.push(curTime - this._lastTime);
    if (this._frameTimes.length > 60) {
      this._frameTimes.shift();
    }
    this._lastTime = curTime;
    let frameTimeSum = this._frameTimes.reduce((p, c) => p + c);
    let frameAvg = frameTimeSum / this._frameTimes.length;
    let fps = frameAvg === 0 ? 0 : 1000 / frameAvg;
    // Update text display
    this._text.text =
      `Theta: ${(game.player.pos.theta / Math.PI).toFixed(2)}π\n` +
      `FPS: ${fps.toFixed(0)}`;
  }
}