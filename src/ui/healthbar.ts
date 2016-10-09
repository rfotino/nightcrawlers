import { UIContainer } from './container';
import { Player } from '../objects/player';
import { Game } from '../game';
import { Color } from '../math/color';

// Returns a 1x1 pixel sprite of a particular color
function getPixelSprite(color: Color): PIXI.Sprite {
  let canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  let ctx = canvas.getContext('2d');
  ctx.fillStyle = color.toString();
  ctx.fillRect(0, 0, 1, 1);
  let sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(canvas));
  return sprite;
}

export class HealthBar extends UIContainer {
  protected _player: Player;
  protected _greenSprite: PIXI.Sprite;
  protected _redSprite: PIXI.Sprite;

  public constructor(game: Game, player: Player) {
    super(game);
    this._player = player;
    this._greenSprite = getPixelSprite(new Color(0, 200, 75));
    this._redSprite = getPixelSprite(new Color(255, 50, 50));
    this.addChild(this._greenSprite);
    this.addChild(this._redSprite);
    this.bgcolor = new Color(150, 150, 150);
  }

  public update(): void {
    super.update();
    let ratio = this._player.health / this._player.maxHealth;
    let margin = this.height / 5;
    this._greenSprite.x = margin;
    this._greenSprite.y = margin;
    this._greenSprite.width = ratio * (this.width - (margin * 2));
    this._greenSprite.height = this.height - (margin * 2);
    this._redSprite.x = margin + this._greenSprite.width;
    this._redSprite.y = margin;
    this._redSprite.width = (1 - ratio) * (this.width - (margin * 2));
    this._redSprite.height = this.height - (margin * 2);
  }
}
