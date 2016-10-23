import { UIContainer } from './container';
import { Player } from '../objects/player';
import { Game } from '../game';
import { Color } from '../graphics/color';

export class CurrentWeaponIndicator extends UIContainer {
  protected _player: Player;
  protected _weaponSprite: PIXI.Sprite;
  protected _ammoText: PIXI.Text;

  public constructor(game: Game, player: Player) {
    super(game);
    this._player = player;
    this._weaponSprite = new PIXI.Sprite();
    this._ammoText = new PIXI.Text('', {
      fontFamily: 'sans-serif',
      fontSize: '36px',
      fill: 'white',
    });
    this._ammoText.anchor.y = 0.5;
    this.addChild(this._weaponSprite);
    this.addChild(this._ammoText);
  }

  public doLayout(): void {
    super.doLayout();
    // Change the texture of the weapon sprite based on the currently equipped
    // weapon type
    let weapon = this._player.equippedWeapon;
    this._weaponSprite.texture = PIXI.loader.resources[weapon.type()].texture;
    // Update the ammo text
    if (weapon.ammo === Infinity) {
      this._ammoText.text = '';
    } else {
      this._ammoText.text = `(${weapon.ammo})`;
    }
    // Position the ammo to the right of the weapon sprite
    this._ammoText.x = this._weaponSprite.width;
    this._ammoText.y = this._weaponSprite.height / 2;
    // Update width and height of container to fit contained items
    this.width = this._weaponSprite.width + this._ammoText.width;
    this.height = this._weaponSprite.height;
  }
}
