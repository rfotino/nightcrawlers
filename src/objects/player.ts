import { GameObject } from './game-object';
import { KeyState } from '../input/keystate';
import { GameInstance } from '../game-instance';
import * as Terrain from './terrain';
import { Level } from '../level';
import { Polar } from '../math/polar';
import { Collider } from '../math/collider';
import { LagFactor } from '../math/lag-factor';
import { Weapon } from '../weapons/weapon';
import { BaseballBat } from '../weapons/baseball-bat';
import { Pistol } from '../weapons/pistol';
import { Shotgun } from '../weapons/shotgun';
import { AssaultRifle } from '../weapons/assault-rifle';
import { ProximityMine } from '../weapons/proximity-mine';
import { SpriteSheet } from '../graphics/spritesheet';

/**
 * Private spritesheet class for the player's bottom that also exposes the
 * offset that the player's top should be placed at.
 */
class PlayerBottom extends SpriteSheet {
  public getTopOffset(): number {
    if (!this._current) {
      return 0;
    }
    switch (this._current.frames[this._currentFrameIndex]) {
      default:
      case 0:
        return 0;
      case 1:
        return -1;
      case 2:
        return -1;
      case 3:
        return 4;
      case 4:
        return 1;
      case 5:
        return -1;
      case 6:
        return -1;
      case 7:
        return 4;
      case 8:
        return 1;
      case 9:
        return -1;
    }
  }
}

export class Player extends GameObject {
  private _spriteBottom: PlayerBottom;
  private _spriteTop: SpriteSheet;
  protected _baseballBat: BaseballBat;
  protected _armor: number = 0;
  protected _maxArmor: number = 50;
  protected _maxEnergy: number = 100;
  protected _energy: number = this._maxEnergy;
  public facingLeft: boolean = false;
  public score: number = 0;
  public weapons: Weapon[];
  public equippedWeapon: Weapon;

  public get width(): number {
    return 25;
  }

  public get height(): number {
    return 75;
  }

  public get z(): number {
    return 25;
  }

  public get armor(): number {
    return this._armor;
  }

  public get maxArmor(): number {
    return this._maxArmor;
  }

  public get energy(): number {
    return this._energy;
  }

  public get maxEnergy(): number {
    return this._maxEnergy;
  }

  public set armor(armor: number) {
    this._armor = Math.min(this._maxArmor, armor);
  }

  public constructor(game: GameInstance) {
    super(game);
    this._maxHealth = 100;
    this._health = this._maxHealth;
    // Set up weapons
    this.weapons = [
      new BaseballBat(),
      new Pistol(8),
      new Shotgun(5),
      new AssaultRifle(10),
      new ProximityMine(3),
    ];
    this._baseballBat = this.equippedWeapon = this.weapons[0];
    // Add spritesheet
    this._spriteBottom = new PlayerBottom(
      PIXI.loader.resources['game/player-bottom'].texture,
      10, // images wide
      1, // images high
      'idle', // default anim
      {
        idle: {
          frames: [0],
          ticksPerFrame: 0,
        },
        jump: {
          frames: [1],
          ticksPerFrame: 0,
        },
        walk: {
          frames: [2, 3, 4, 5, 6, 7, 8, 9],
          ticksPerFrame: 7,
        },
        run: {
          frames: [2, 3, 4, 5, 6, 7, 8, 9],
          ticksPerFrame: 3,
        },
      }
    );
    this._spriteTop = new SpriteSheet(
      PIXI.loader.resources['game/player-top'].texture,
      8, // images wide
      5, // images high
      'baseball-bat-idle', // default anim
      {
        'baseball-bat-idle': {
          frames: [0, 1, 2, 3],
          ticksPerFrame: 10,
        },
        'baseball-bat-attack': {
          frames: [4, 4, 5, 6, 7, 7, 7, 7, 7],
          ticksPerFrame: 1,
        },
        'pistol-idle': {
          frames: [8, 9, 10, 11],
          ticksPerFrame: 10,
        },
        'pistol-attack': {
          frames: [12, 13, 14, 15],
          ticksPerFrame: 1,
        },
        'shotgun-idle': {
          frames: [16, 17, 18, 19],
          ticksPerFrame: 10,
        },
        'shotgun-attack': {
          frames: [20, 21, 22, 23],
          ticksPerFrame: 1,
        },
        'assault-idle': {
          frames: [24, 25, 26, 27],
          ticksPerFrame: 10,
        },
        'assault-attack': {
          frames: [28, 29, 30, 31],
          ticksPerFrame: 1,
        },
        'mine-idle': {
          frames: [32, 33, 34, 35],
          ticksPerFrame: 10,
        },
        'mine-attack': {
          frames: [36, 37, 38, 39],
          ticksPerFrame: 1,
        }
      }
    );
    this._spriteBottom.anchor.set(0.39, 0.5);
    this._spriteTop.anchor.set(0.39, 0.5);
    this._mirrorList.push(this);
    this.addChild(this._spriteBottom);
    this.addChild(this._spriteTop);
    // Spawn the player at a random spawn point
    const spawnPoint = game.level.getPlayerSpawn();
    this.pos.r = spawnPoint.r;
    this.pos.theta = spawnPoint.theta;
  }

  public type(): string { return 'player'; }

  public team(): string { return 'player'; }

  /**
   * Damage armor before health.
   */
  public damage(amount: number): void {
    if (amount <= this._armor) {
      this.armor -= amount;
    } else {
      this.health -= amount - this._armor;
      this.armor = 0;
    }
    if (this.health <= 0) {
      this.kill();
    }
  }

  public update(): void {
    super.update();
    // Update sprite animation
    this._spriteBottom.nextFrame();
    this._spriteTop.nextFrame();
    // Handle walking and running due to user input
    const walkSpeed = 7 / this.pos.r;
    const runSpeed = 10 / this.pos.r;
    const leftArrow = this._game.keyState.isDown(KeyState.LEFTARROW);
    const rightArrow = this._game.keyState.isDown(KeyState.RIGHTARROW);
    const shift = this._game.keyState.isDown(KeyState.SHIFT);
    const running = shift && (leftArrow !== rightArrow);
    const energyLossRate = 0.5;
    const energyGainRate = 0.2;
    const speed = running && this.energy > 0 ? runSpeed : walkSpeed;
    const anim = running && this.energy > 0 ? 'run' : 'walk';
    if (running) {
      this._energy -= energyLossRate * LagFactor.get();
      if (this._energy < 0) {
        this._energy = 0;
      }
    } else {
      this._energy += energyGainRate * LagFactor.get();
      if (this._energy > this._maxEnergy) {
        this._energy = this._maxEnergy;
      }
    }
    if (leftArrow && !rightArrow) {
      this.vel.theta = -speed;
      this.facingLeft = true;
      this._spriteBottom.playAnim(anim);
      this.scale.x = -1;
    } else if (rightArrow && !leftArrow) {
      this.vel.theta = speed;
      this.facingLeft = false;
      this._spriteBottom.playAnim(anim);
      this.scale.x = 1;
    } else {
      this.vel.theta = 0;
      this._spriteBottom.stopAnim();
    }
    // Play jump animation if we're in the air
    if (!this._isOnSolidGround()) {
      this._spriteBottom.playAnim('jump');
    }
    // Set acceleration due to gravity
    this.accel.r = Terrain.GRAVITY;
    // Handle jumping due to user input
    const jumpSpeed = 20;
    const upArrow = this._game.keyState.isPressed(KeyState.UPARROW);
    if (upArrow && this._isOnSolidGround()) {
      this.vel.r = jumpSpeed;
    }
    // Change weapons if we pressed the button to do so and the corresponding
    // weapon has ammo left. Switch the default idle animation as we switch
    // weapons.
    for (let i = 0; i < this.weapons.length; i++) {
      let key = KeyState.ONE + i;
      if (this._game.keyState.isPressed(key)) {
        let weapon = this.weapons[i];
        if (weapon.ammo > 0) {
          this.equippedWeapon = weapon;
          this._spriteTop.setDefault(`${this.equippedWeapon.type()}-idle`, true);
        }
      }
    }
    // Check if the currently equipped weapon is out of ammo, and if so default
    // back to the baseball bat
    if (this.equippedWeapon.ammo <= 0) {
      this.equippedWeapon = this._baseballBat;
    }
    // Try to fire the equipped weapon, and play the appropriate attack
    // animation if we actually fired
    if (this.equippedWeapon.maybeFire(this._game)) {
      this._spriteTop.stopAnim();
      this._spriteTop.playAnimOnce(`${this.equippedWeapon.type()}-attack`);
    }
    // Offset the sprite top to match the sprite bottom
    this._spriteTop.y = this._spriteBottom.getTopOffset();
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
