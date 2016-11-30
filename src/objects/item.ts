import { GameInstance } from '../game-instance';
import { GameObject } from './game-object';
import { Player } from './player';
import { FadingText } from './fading-text';
import { Polar } from '../math/polar';
import { Collider } from '../math/collider';
import * as Terrain from './terrain';

export class Item extends GameObject {
  protected _type: string;
  protected _sprite: PIXI.Sprite;

  public get width(): number { return 40; }
  public get height(): number { return 40; }

  public get z(): number { return 25; }
  
  public constructor(game: GameInstance, type: string,
                     r: number = 0, theta: number = 0) {
    super(game);
    this._type = type;
    this.pos.r = r;
    this.pos.theta = theta;
    this.accel.r = Terrain.GRAVITY;
    // Create a canvas for the sprite's texture
    let canvas = document.createElement('canvas');
    canvas.width = this.width + 2;
    canvas.height = this.height + 2;
    // Draw a purple circle on the canvas
    let radius = this.width / 2;
    let ctx = canvas.getContext('2d');
    ctx.fillStyle = 'purple';
    ctx.beginPath();
    ctx.arc(1 + radius, 1 + radius, radius, 0, Math.PI * 2);
    ctx.fill();
    // Add the type of the weapon in black text on top of the circle
    ctx.fillStyle = 'black';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this._type, canvas.width / 2, canvas.height / 2, this.width);
    // Create a sprite with this texture
    this._sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(canvas));
    this._sprite.anchor.x = this._sprite.anchor.y = 0.5;
    this.addChild(this._sprite);
    this._mirrorList.push(this._sprite);
  }

  public type(): string { return 'item'; }

  public getPolarBounds(): Polar.Rect {
    let widthTheta = this.width / this.pos.r;
    return new Polar.Rect(
      this.pos.r + (this.height / 2),
      this.pos.theta - (widthTheta / 2),
      this.height,
      widthTheta
    );
  }

  public collide(other: GameObject, result: Collider.Result): void {
    super.collide(other, result);
    if ('player' === other.type()) {
      this._addToPlayer(<Player>other);
      this.kill();
    }
  }

  protected _addToPlayer(player: Player): void {
    let text: string = null;
    let color: string = null;
    switch (this._type) {
      case 'health':
        const originalHealth = player.health;
        player.health += 20;
        const healthAmount = Math.round(player.health - originalHealth);
        text = `+${healthAmount}`;
        color = 'rgb(0, 255, 0)';
        break;
      case 'armor':
        player.armor = player.maxArmor;
        text = 'SHIELDED';
        color = 'rgb(0, 255, 150)';
        break;
      case 'pistol':
        player.weapons.forEach(weapon => {
          if (weapon.type() === 'pistol') {
            const ammoAmount = 8;
            weapon.ammo += ammoAmount;
            text = `+${ammoAmount} ROUNDS`
            color = 'white';
          }
        });
        break;
      case 'shotgun':
        player.weapons.forEach(weapon => {
          if (weapon.type() === 'shotgun') {
            const ammoAmount = 5;
            weapon.ammo += ammoAmount;
            text = `+${ammoAmount} SHELLS`;
            color = 'white';
          }
        });
        break;
      case 'assault':
        player.weapons.forEach(weapon => {
          if (weapon.type() === 'assault') {
            const ammoAmount = 10;
            weapon.ammo += ammoAmount;
            text = `+${ammoAmount} ROUNDS`;
            color = 'white';
          }
        });
        break;
      case 'mine':
        const ammoAmount = 3;
        player.numMines += ammoAmount;
        text = `+${ammoAmount} MINES`;
        color = 'white';
        break;
    }
    if (text !== null && color !== null) {
      this._game.addGameObject(new FadingText(
        this._game,
        text,
        player.pos,
        {
          fontSize: 30,
          fill: color,
        },
        60 // timer
      ));
    }
  }
}
