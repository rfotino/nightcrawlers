import { UIContainer } from './container';
import { Player } from '../objects/player';
import { Game } from '../game';
import { Color } from '../graphics/color';

/**
 * A meter next to the health bar that shows the amount of run energy that the
 * player currently has.
 */
export class EnergyBar extends UIContainer {
  protected _player: Player;
  protected _energySprite: PIXI.Sprite;

  public constructor(game: Game, player: Player) {
    super(game);
    this._player = player;
    this._energySprite = new PIXI.Sprite(new Color(0, 255, 100).genTexture());
    this.addChild(this._energySprite);
    this.bgcolor = new Color(125, 125, 125);
  }

  public update(): void {
    super.update();
    // Position the energy sprite so that the width is proportional to the
    // current energy divided by the maximum energy
    const energyRatio = this._player.energy / this._player.maxEnergy;
    this._energySprite.x = 0;
    this._energySprite.y = 0;
    this._energySprite.width = energyRatio * this.width;
    this._energySprite.height = this.height;
  }
}
