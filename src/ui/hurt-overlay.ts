import { Game } from '../game';
import { GameInstance } from '../game-instance';
import { LagFactor } from '../math/lag-factor';
import { UIContainer } from './container';

export class HurtOverlay extends UIContainer {
  protected _gameInst: GameInstance;
  protected _sprite: PIXI.Sprite;
  protected _heartTimer: number = 0;

  public constructor(game: Game, gameInst: GameInstance) {
    super(game);
    this._gameInst = gameInst;
    this._sprite = new PIXI.Sprite(
      PIXI.loader.resources['ui/hurt-overlay'].texture
    );
    this.addChild(this._sprite);
  }

  /**
   * Stretch the sprite to fill the game screen.
   */
  public doLayout(): void {
    super.doLayout();
    this._sprite.width = this._game.view.width;
    this._sprite.height = this._game.view.height;
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
    // Tweak the constant here to make the heartbeat faster or slower
    this._heartTimer += 0.04 * LagFactor.get();
    const healthPercent = (
      this._gameInst.player.health / this._gameInst.player.maxHealth
    );
    // If the player has more than half health, don't show any hurt overlay.
    // Otherwise show it linearly more opaque as the the player loses health.
    let alpha = 0;
    if (healthPercent < 0.5) {
      alpha = 1 - (healthPercent * 2);
      // Get a heartbeat pattern going
      /*
      alpha *= Math.abs(
        Math.sin(this._heartTimer) *
        Math.sin(this._heartTimer * 2)
      );
      */
    }
    this.alpha = alpha;
  }
}
