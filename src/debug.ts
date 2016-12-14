import { Game } from './game';
import { GameInstance } from './game-instance';
import { UIContainer } from './ui/container';

export class Debugger extends UIContainer {
  protected _gameInstance: GameInstance;
  private _text: PIXI.Text;
  private _lastTime: number;
  private _frameTimes: number[];

  public constructor(game: Game,
                     gameInstance: GameInstance,
                     visible: boolean = false) {
    super(game);
    this._gameInstance = gameInstance;
    this._text = new PIXI.Text('', {
      fontFamily: 'Monospace',
      fontSize: '24px',
      lineHeight: 28,
      fill: 'magenta',
    });
    this._text.position.set(15, 15);
    this._text.visible = visible;
    this.addChild(this._text);
    this._lastTime = Date.now();
    this._frameTimes = [];
  }

  public doLayout(): void {
    super.doLayout();
    this.width = this._text.width;
    this.height = this._text.height;
  }

  public update(): void {
    super.update();
    // Get time taken between frames
    const curTime = Date.now();
    this._frameTimes.push(curTime - this._lastTime);
    if (this._frameTimes.length > 60) {
      this._frameTimes.shift();
    }
    this._lastTime = curTime;
    const frameTimeSum = this._frameTimes.reduce((p, c) => p + c);
    const frameAvg = frameTimeSum / this._frameTimes.length;
    const fps = frameAvg === 0 ? 0 : 1000 / frameAvg;
    // Get number of game objects and number of visible game objects
    const numGameObjs = this._gameInstance.gameObjects.length;
    let numVisibleObjs = 0;
    this._gameInstance.gameObjects.forEach(obj => {
      if (obj.visible) {
        numVisibleObjs++;
      }
    });
    // Update text display
    this._text.text =
      `FPS:     ${fps.toFixed(0)}\n` +
      `r:       ${this._gameInstance.player.pos.r.toFixed(0)}\n` +
      `θ:       ${(this._gameInstance.player.pos.theta / Math.PI).toFixed(2)}π\n` +
      `objects: ${numGameObjs} (${numVisibleObjs})\n` +
      `render:  ${this._game.isWebGL() ? 'WebGL' : 'Canvas'}`;
  }
}