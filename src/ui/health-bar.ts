import { GameObject } from '../objects/game-object';
import { Color } from '../graphics/color';

/**
 * Miniature health bar that floats above the top of the GameObject.
 */
export class HealthBar extends PIXI.Sprite {
  protected _cachedPercent: number = -1;
  protected _emptySprite: PIXI.Sprite;
  protected _fullSprite: PIXI.Sprite;
  protected _fullSpriteMask: PIXI.Graphics;
  protected static _barTexture: PIXI.Texture = null;

  protected static get WIDTH(): number { return 45; }
  protected static get HEIGHT(): number { return 8; }

  protected static _getBarTexture(): PIXI.Texture {
    if (!HealthBar._barTexture) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = HealthBar.WIDTH + 2;
      canvas.height = HealthBar.HEIGHT + 2;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = HealthBar.HEIGHT - 2;
      ctx.beginPath();
      const radius = 350;
      const theta = canvas.width / radius;
      ctx.arc(
        canvas.width / 2,
        radius + (canvas.height / 2),
        radius,
        (-theta / 2) - (Math.PI / 2),
        (theta / 2) - (Math.PI / 2)
      );
      ctx.stroke();
      HealthBar._barTexture = PIXI.Texture.fromCanvas(canvas);
    }
    return HealthBar._barTexture;
  }

  public constructor(obj: GameObject, margin: number) {
    super();
    const texture = HealthBar._getBarTexture();
    const height = HealthBar.HEIGHT;
    const x = -texture.width / 2;
    const y = -margin - (0.5 * (obj.height + height));
    // Have empty sprite on the bottom
    this._emptySprite = new PIXI.Sprite(texture);
    this._emptySprite.tint = new Color(255, 50, 50).toPixi();
    this._emptySprite.position.set(x, y);
    this.addChild(this._emptySprite);
    // Overlay full sprite on top
    this._fullSprite = new PIXI.Sprite(texture);
    this._fullSprite.tint = new Color(0, 255, 100).toPixi();
    this._fullSprite.position.set(x, y);
    this.addChild(this._fullSprite);
    // Add clipping mask to full sprite
    this._fullSpriteMask = new PIXI.Graphics();
    this._fullSprite.mask = this._fullSpriteMask;
    this._fullSprite.addChild(this._fullSpriteMask);
  }

  // Update size of green sprite to be proportional to object's health
  public update(obj: GameObject): void {
    const percent = obj.health / obj.maxHealth;
    if (percent !== this._cachedPercent) {
      this._fullSpriteMask.clear();
      this._fullSpriteMask.beginFill(0xffffff);
      this._fullSpriteMask.drawRect(
        0, 0,
        1 + this._fullSprite.width * obj.health / obj.maxHealth,
        this._fullSprite.height
      );
      this._cachedPercent = percent;
    }
  }
}