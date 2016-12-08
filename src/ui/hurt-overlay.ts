import { Game } from '../game';
import { GameInstance } from '../game-instance';
import { LagFactor } from '../math/lag-factor';
import { UIContainer } from './container';

export class HurtOverlay extends UIContainer {
  protected _gameInst: GameInstance;
  protected _badlyHurtSprite: PIXI.Sprite;
  protected _recentlyHurtSprite: PIXI.Sprite;
  protected _heartTimer: number = 0;

  public constructor(game: Game, gameInst: GameInstance) {
    super(game);
    this._gameInst = gameInst;
    this._badlyHurtSprite = new PIXI.Sprite(
      PIXI.loader.resources['ui/hurt-overlay'].texture
    );
    this._recentlyHurtSprite = new PIXI.Sprite(
      PIXI.loader.resources['ui/hurt-overlay'].texture
    );
    this.addChild(this._badlyHurtSprite);
    this.addChild(this._recentlyHurtSprite);
  }

  /**
   * Stretch the sprite to fill the game screen.
   */
  public doLayout(): void {
    super.doLayout();
    this._badlyHurtSprite.width = this._recentlyHurtSprite.width = this._game.view.width;
    this._badlyHurtSprite.height = this._recentlyHurtSprite.height = this._game.view.height;
  }

  /**
   * Make the sprite more or less transparent.
   */
  public update(): void {
    super.update();
    // Don't update if we're paused
    if (this._gameInst.isPaused()) {
      return;
    }
    // If the player has more than half health, don't show any badly hurt overlay.
    // Otherwise show it linearly more opaque as the the player loses health.
    const healthPercent = (
      this._gameInst.player.health / this._gameInst.player.maxHealth
    );
    let badlyHurtAlpha = 0;
    if (healthPercent < 0.5) {
      badlyHurtAlpha = 1 - (healthPercent * 2);
    }
    this._badlyHurtSprite.alpha = badlyHurtAlpha;
    // Mimic the player's fade % for the recently hurt sprite
    this._recentlyHurtSprite.alpha = this._gameInst.player.hurtFadePercent;
  }
}
