import { UIContainer } from './container';
import { Game } from '../game';
import { Player } from '../objects/player';
import { Color } from '../graphics/color';

/**
 * Player's armor bar.
 */

class ArmorBar extends UIContainer {
  protected _player: Player;
  protected _fullSprite: PIXI.Sprite;
  protected _fullMask: PIXI.Graphics;

  public constructor(game: Game, player: Player) {
    super(game);
    this._player = player;
    this._fullSprite = new PIXI.Sprite(
      PIXI.loader.resources['ui/full-armor'].texture
    );
    this.addChild(this._fullSprite);
    this.width = this._fullSprite.width;
    this.height = this._fullSprite.height;
    this._fullMask = new PIXI.Graphics();
    this._fullSprite.mask = this._fullMask;
    this._fullSprite.addChild(this._fullMask);
  }

  public update(): void {
    super.update();
    const percent = this._player.armor / this._player.maxArmor;
    this._fullMask.clear();
    this._fullMask.beginFill(0xffffff);
    this._fullMask.drawRect(0, 0, this.width * percent, this.height);
  }
}

/**
 * Player's health bar.
 */
class HealthBar extends UIContainer {
  protected _player: Player;
  protected _emptySprite: PIXI.Sprite;
  protected _fullSprite: PIXI.Sprite;
  protected _fullMask: PIXI.Graphics;

  public constructor(game: Game, player: Player) {
    super(game);
    this._player = player;
    this._emptySprite = new PIXI.Sprite(
      PIXI.loader.resources['ui/empty-health'].texture
    );
    this._fullSprite = new PIXI.Sprite(
      PIXI.loader.resources['ui/full-health'].texture
    );
    this.addChild(this._emptySprite);
    this.addChild(this._fullSprite);
    this.width = this._emptySprite.width;
    this.height = this._emptySprite.height;
    this._fullMask = new PIXI.Graphics();
    this._fullSprite.mask = this._fullMask;
    this._fullSprite.addChild(this._fullMask);
  }

  public update(): void {
    super.update();
    const percent = this._player.health / this._player.maxHealth;
    this._fullMask.clear();
    this._fullMask.beginFill(0xffffff);
    this._fullMask.drawRect(0, 0, this.width * percent, this.height);
  }
}

/**
 * A meter next to the health bar that shows the amount of run energy that the
 * player currently has.
 */
class EnergyBar extends UIContainer {
  protected _player: Player;
  protected _emptySprite: PIXI.Sprite;
  protected _fullSprite: PIXI.Sprite;
  protected _fullMask: PIXI.Graphics;

  public constructor(game: Game, player: Player) {
    super(game);
    this._player = player;
    this._emptySprite = new PIXI.Sprite(
      PIXI.loader.resources['ui/empty-energy'].texture
    );
    this._fullSprite = new PIXI.Sprite(
      PIXI.loader.resources['ui/full-energy'].texture
    );
    this.addChild(this._emptySprite);
    this.addChild(this._fullSprite);
    this.width = this._emptySprite.width;
    this.height = this._emptySprite.height;
    this._fullMask = new PIXI.Graphics();
    this._fullSprite.mask = this._fullMask;
    this._fullSprite.addChild(this._fullMask);
  }

  public update(): void {
    super.update();
    const percent = this._player.energy / this._player.maxEnergy;
    this._fullMask.clear();
    this._fullMask.beginFill(0xffffff);
    this._fullMask.drawRect(0, 0, this.width * percent, this.height);
  }
}

/**
 * Class that shows the user portrait and has health and energy bars as its
 * child components.
 */
export class UIPortrait extends UIContainer {
  protected _portrait: PIXI.Sprite;
  protected _healthBar: HealthBar;
  protected _energyBar: EnergyBar;
  protected _armorBar: ArmorBar;

  public constructor(game: Game, player: Player) {
    super(game);
    // Add health and energy bar on the bottom
    this._healthBar = new HealthBar(game, player);
    this._energyBar = new EnergyBar(game, player);
    this.addComponent(this._healthBar);
    this.addComponent(this._energyBar);
    // Add portrait on top
    const portraitTexture = PIXI.loader.resources['ui/portrait'].texture;
    this._portrait = new PIXI.Sprite(portraitTexture);
    this.addChild(this._portrait);
    // Add armor bar on top of everything
    this._armorBar = new ArmorBar(game, player);
    this.addComponent(this._armorBar);
    // Set width and height based on portrait sprite
    this.width = this._portrait.width;
    this.height = this._portrait.height;
  }

  public doLayout(): void {
    this._armorBar.x = 0;
    this._armorBar.y = 0;
    this._healthBar.x = 80;
    this._healthBar.y = 23;
    this._energyBar.x = 80;
    this._energyBar.y = 68;
  }
}
