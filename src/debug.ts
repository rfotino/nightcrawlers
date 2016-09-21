import { GameObject } from './objects/game-object';
import { Game } from './game';

export class Debugger extends GameObject {
  private _text: PIXI.Text;

  public constructor(container: PIXI.Container, visible: boolean = false) {
    super();
    this._text = new PIXI.Text('', {
      fontFamily: 'Arial',
      fontSize: '50px',
      fill: 'white',
    });
    this._text.visible = visible;
    container.addChild(this._text);
  }

  public update(game: Game) {
    this._text.text = `Theta: ${(game.player.pos.theta / Math.PI).toFixed(2)}π`;
  }
}