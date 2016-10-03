import { GameInstance } from './game-instance';

export class Debugger extends PIXI.Container {
  private _text: PIXI.Text;
  private _lastTime: number;
  private _frameTimes: number[];

  public constructor(visible: boolean = false) {
    super();
    this._text = new PIXI.Text('', {
      fontFamily: 'Monospace',
      fontSize: '24px',
      lineHeight: 28,
      fill: 'white',
    });
    this._text.position.set(15, 15);
    this._text.visible = visible;
    this.addChild(this._text);
    this._lastTime = Date.now();
    this._frameTimes = [];
  }

  public update(game: GameInstance): void {
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
    // Show time of day/night
    let timeType = game.timeKeeper.isDay ? 'day:    ' : 'night:  ';
    let timePercent = game.timeKeeper.time * 100;
    // Update text display
    this._text.text =
      `FPS:     ${fps.toFixed(0)}\n` +
      `r:       ${game.player.pos.r.toFixed(0)}\n` +
      `θ:       ${(game.player.pos.theta / Math.PI).toFixed(2)}π\n` +
      `health:  ${game.player.health.toFixed(0)}\n` +
      `score:   ${game.score}\n` +
      `${timeType} ${timePercent.toFixed(0)}%\n` +
      `enemies: ${game.enemySpawner.count}\n` +
      `render:  ${game.isWebGL() ? 'WebGL' : 'Canvas'}`;
  }
}