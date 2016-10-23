import { UIContainer } from './container';
import { Player } from '../objects/player';
import { Game } from '../game';
import { Color } from '../graphics/color';

export class HealthBar extends UIContainer {
  protected _player: Player;
  protected _armorSprite: PIXI.Sprite;
  protected _redSprite: PIXI.Sprite;
  protected _healthSprite: PIXI.Sprite;

  public constructor(game: Game, player: Player) {
    super(game);
    this._player = player;
    this._armorSprite = new PIXI.Sprite(new Color(0, 255, 255).genTexture());
    this._redSprite = new PIXI.Sprite(new Color(255, 50, 50).genTexture());
    this._healthSprite = new PIXI.Sprite(new Color(0, 200, 75).genTexture());
    this.addChild(this._armorSprite);
    this.addChild(this._redSprite);
    this.addChild(this._healthSprite);
    this.bgcolor = new Color(150, 150, 150);
  }

  public update(): void {
    super.update();
    // Position the armor sprite so that the width is proportional to the
    // current armor divided by the maximum armor
    let armorRatio = this._player.armor / this._player.maxArmor;
    this._armorSprite.x = 0;
    this._armorSprite.y = 0;
    this._armorSprite.width = armorRatio * this.width;
    this._armorSprite.height = this.height;
    // Position the health and red sprites so that the ratio is proportional
    // to the current health divided by maximum health
    let healthRatio = this._player.health / this._player.maxHealth;
    let margin = this.height / 5;
    this._healthSprite.x = margin;
    this._healthSprite.y = margin;
    this._healthSprite.width = healthRatio * (this.width - (margin * 2));
    this._healthSprite.height = this.height - (margin * 2);
    this._redSprite.x = margin + this._healthSprite.width;
    this._redSprite.y = margin;
    this._redSprite.width = (1 - healthRatio) * (this.width - (margin * 2));
    this._redSprite.height = this.height - (margin * 2);
  }
}
