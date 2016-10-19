import { GameObject } from './game-object';
import { KeyState } from '../input/keystate';
import { GameInstance } from '../game-instance';
import * as Terrain from './terrain';
import { Level } from '../level';
import { Bullet } from './bullet';
import { Polar } from '../math/polar';
import { Collider } from '../math/collider';
import { Weapon } from '../weapons/weapon';
import { BaseballBat } from '../weapons/baseball-bat';
import { Pistol } from '../weapons/pistol';
import { Shotgun } from '../weapons/shotgun';
import { AssaultRifle } from '../weapons/assault-rifle';
import { SpriteSheet } from '../graphics/spritesheet';

export class Player extends GameObject {
  private _sprite: SpriteSheet;
  private _onSolidGround: boolean = false;
  private _ground: GameObject = null;
  protected _baseballBat: BaseballBat;
  public facingLeft: boolean = false;
  public score: number = 0;
  public weapons: Weapon[];
  public equippedWeapon: Weapon;

  public get width(): number {
    return 18;
  }

  public get height(): number {
    return 32;
  }

  public get z(): number {
    return 30;
  }

  public constructor(level: Level) {
    super();
    this._maxHealth = 100;
    this._health = this._maxHealth;
    // Set up weapons
    this.weapons = [
      new BaseballBat(),
      new Pistol(),
      new Shotgun(),
      new AssaultRifle(),
    ];
    this._baseballBat = this.equippedWeapon = this.weapons[0];
    // Add spritesheet
    this._sprite = new SpriteSheet(
      PIXI.loader.resources['player'].texture,
      4, // images wide
      1, // images high
      0, // default frame
      {
        walk: {
          frames: [1, 2, 3, 0],
          speed: 10,
        }
      }
    );
    this._sprite.anchor.x = this._sprite.anchor.y = 0.5;
    this._mirrorList.push(this._sprite);
    this.addChild(this._sprite);
    // Spawn the player at a random spawn point
    let spawnPoint = level.getPlayerSpawn();
    this.pos.r = spawnPoint.r;
    this.pos.theta = spawnPoint.theta;
  }

  public type(): string { return 'player'; }

  public team(): string { return 'player'; }

  public heal(amount: number): void {
    this._health = Math.min(this._maxHealth, this._health + amount);
  }

  public update(game: GameInstance): void {
    super.update(game);
    // Update sprite animation
    this._sprite.nextFrame();
    // Add relative velocity from the ground
    this.vel.theta = this._ground ? this._ground.vel.theta : 0;
    // Handle turning due to user input
    let speed = 7 / this.pos.r;
    let leftArrow = game.keyState.isDown(KeyState.LEFTARROW);
    let rightArrow = game.keyState.isDown(KeyState.RIGHTARROW);
    if (leftArrow && !rightArrow) {
      this.vel.theta -= speed;
      this.facingLeft = true;
      if (this._sprite.nowPlaying() !== 'walk') {
        this._sprite.playAnim('walk');
      }
      this._sprite.scale.x = -1;
    } else if (rightArrow && !leftArrow) {
      this.vel.theta += speed;
      this.facingLeft = false;
      if (this._sprite.nowPlaying() !== 'walk') {
        this._sprite.playAnim('walk');
      }
      this._sprite.scale.x = 1;
    } else {
      this._sprite.stopAnim();
    }
    // Set acceleration due to gravity
    this.accel.r = Terrain.GRAVITY;
    // Handle jumping due to user input
    let jumpSpeed = 17;
    if (game.keyState.isPressed(KeyState.UPARROW) && this._onSolidGround) {
      this._onSolidGround = false;
      this.vel.r = jumpSpeed;
    }
    // Change weapons if we pressed the button to do so and the corresponding
    // weapon has ammo left
    for (let i = 0; i < this.weapons.length; i++) {
      let key = KeyState.ONE + i;
      if (game.keyState.isPressed(key)) {
        let weapon = this.weapons[i];
        if (weapon.ammo > 0) {
          this.equippedWeapon = weapon;
        }
      }
    }
    // Check if the currently equipped weapon is out of ammo, and if so default
    // back to the baseball bat
    if (this.equippedWeapon.ammo <= 0) {
      this.equippedWeapon = this._baseballBat;
    }
    // Try to fire the equipped weapon if the user pressed the space bar
    this.equippedWeapon.maybeFire(game);
    // Not on solid ground unless we collide with something this frame
    this._onSolidGround = false;
    this._ground = null;
  }

  public collide(other: GameObject, result: Collider.Result): void {
    switch (other.type()) {
      case 'planet':
      case 'platform':
      case 'block':
        if (result.bottom) {
          this._onSolidGround = true;
          this._ground = other;
        }
        break;
    }
  }

  public getPolarBounds(): Polar.Rect {
    let widthTheta = this.width / this.pos.r;
    return new Polar.Rect(
      this.pos.r + (this.height / 2),
      this.pos.theta - (widthTheta / 2),
      this.height,
      widthTheta
    );
  }
}
