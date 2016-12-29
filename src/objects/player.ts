import { GameObject } from './game-object';
import { KeyState } from '../input/keystate';
import { GameInstance } from '../game-instance';
import * as Terrain from './terrain';
import { Level } from '../level';
import { Polar } from '../math/polar';
import { Collider } from '../math/collider';
import { LagFactor } from '../math/lag-factor';
import { Counter } from '../math/counter';
import { Weapon } from '../weapons/weapon';
import { BaseballBat } from '../weapons/baseball-bat';
import { Pistol } from '../weapons/pistol';
import { Shotgun } from '../weapons/shotgun';
import { AssaultRifle } from '../weapons/assault-rifle';
import { FadingText } from './fading-text';
import { ProximityMine } from './proximity-mine';
import { SpriteSheet } from '../graphics/spritesheet';
import { HealthBar } from '../ui/health-bar';
import { Color } from '../graphics/color';
import { Config } from '../config';

/**
 * Fills in the player sprite starting from the bottom, first colorizing a
 * mirrored top/bottom half sprite with a filter and then showing part of
 * that with a graphics mask.
 */
class PlayerArmorMeter extends PIXI.Sprite {
  protected _graphicsMask: PIXI.Graphics;
  protected _spriteTop: PIXI.Sprite;
  protected _spriteBottom: PIXI.Sprite;
  protected _spriteTopMirror: PIXI.Sprite;
  protected _spriteBottomMirror: PIXI.Sprite;
  protected _spriteFullMirror: PIXI.Sprite;

  public constructor(spriteTop: PIXI.Sprite, spriteBottom: PIXI.Sprite) {
    super();
    this._spriteTop = spriteTop;
    this._spriteBottom = spriteBottom;
    // Set up mirror sprite
    this._spriteTopMirror = new PIXI.Sprite();
    this._spriteBottomMirror = new PIXI.Sprite();
    this._spriteTopMirror.anchor.set(spriteTop.anchor.x, spriteTop.anchor.y);
    this._spriteBottomMirror.anchor.set(spriteBottom.anchor.x, spriteBottom.anchor.y);
    this._spriteFullMirror = new PIXI.Sprite();
    this._spriteFullMirror.addChild(this._spriteTopMirror);
    this._spriteFullMirror.addChild(this._spriteBottomMirror);
    this.addChild(this._spriteFullMirror);
    // Add filter to mirror sprite
    const colorizeFilter = new PIXI.Filter(
      // Vertex shader
      PIXI.Filter.defaultVertexSrc,
      // Fragment shader
      `
      uniform sampler2D uSampler;
      varying vec2 vTextureCoord;
      void main(void) {
        vec4 sample = texture2D(uSampler, vTextureCoord);
        vec4 color = vec4(0.0, 0.75, 1.0, 1.0);
        float blend = 0.75;
        gl_FragColor = ((color * blend) + (sample * (1.0 - blend))) * sample.a;
      }
      `
    );
    this._spriteFullMirror.filters = [ colorizeFilter ];
    // Add mask one step above mirror sprite
    this._graphicsMask = new PIXI.Graphics();
    this.addChild(this._graphicsMask);
    this.mask = this._graphicsMask;
  }

  public update(player: Player) {
    // Update mask
    this._spriteTopMirror.texture = this._spriteTop.texture;
    this._spriteTopMirror.position = this._spriteTop.position;
    this._spriteTopMirror.scale.x = this._spriteTop.scale.x;
    this._spriteBottomMirror.texture = this._spriteBottom.texture;
    this._spriteBottomMirror.position = this._spriteBottom.position;
    this._spriteBottomMirror.scale.x = this._spriteBottom.scale.x;
    // Update fill percent
    const percent = 1 - player.armor / player.maxArmor;
    const width = 120;
    const height = 80;
    this._graphicsMask.clear();
    this._graphicsMask.beginFill(Color.white.toPixi());
    this._graphicsMask.drawRect(-width / 2, height * (percent - 0.5), width, height);
    this._graphicsMask.endFill();
  }
}

/**
 * Private class for a weapon cooldown bar that floats above the player's head.
 */
class PlayerCooldownBar extends PIXI.Container {
  protected _sprite: PIXI.Sprite;
  protected _spriteMask: PIXI.Graphics;
  protected static _barTexture: PIXI.Texture = null;

  protected static get WIDTH(): number { return 50; }
  protected static get HEIGHT(): number { return 5; }
  protected static get MARGIN(): number { return 11; }

  protected static _getBarTexture(): PIXI.Texture {
    if (!PlayerCooldownBar._barTexture) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = PlayerCooldownBar.WIDTH + 2;
      canvas.height = PlayerCooldownBar.HEIGHT + 2;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
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
      PlayerCooldownBar._barTexture = PIXI.Texture.fromCanvas(canvas);
    }
    return PlayerCooldownBar._barTexture;
  }

  public constructor(player: Player) {
    super();
    const texture = PlayerCooldownBar._getBarTexture();
    const margin = PlayerCooldownBar.MARGIN;
    const height = PlayerCooldownBar.HEIGHT;
    const x = -texture.width / 2;
    const y = -margin - (0.5 * (player.height + height));
    // Overlay full sprite on top
    this._sprite = new PIXI.Sprite(texture);
    this._sprite.tint = new Color(255, 255, 255).toPixi();
    this._sprite.position.set(x, y);
    this.addChild(this._sprite);
    // Add clipping mask to full sprite
    this._spriteMask = new PIXI.Graphics();
    this._sprite.mask = this._spriteMask;
    this._sprite.addChild(this._spriteMask);
  }

  // Update size of sprite to be proportional to player cooldown
  public update(player: Player): void {
    const maskWidth = (
      (this._sprite.width - 2) * (1 - player.weaponCooldownCounter.percent())
    );
    this._spriteMask.clear();
    this._spriteMask.beginFill(0xffffff);
    this._spriteMask.drawRect(
      (this._sprite.width - maskWidth) / 2,
      0,
      maskWidth,
      this._sprite.height
    );
    if (player.weaponCooldownCounter.done()) {
      this._sprite.alpha = 0;
    } else {
      this._sprite.alpha = 0.5;
    }
  }
}

/**
 * Private class for an energy bar that floats below the player's feet.
 */
class PlayerEnergyBar extends PIXI.Container {
  protected _sprite: PIXI.Sprite;
  protected _spriteMask: PIXI.Graphics;
  protected static _barTexture: PIXI.Texture = null;

  protected static get WIDTH(): number { return 40; }
  protected static get HEIGHT(): number { return 10; }
  protected static get MARGIN(): number { return -3; }

  protected static _getBarTexture(): PIXI.Texture {
    if (!PlayerEnergyBar._barTexture) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = PlayerEnergyBar.WIDTH + 2;
      canvas.height = PlayerEnergyBar.HEIGHT + 2;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const radius = 400;
      const theta = canvas.width / radius;
      ctx.arc(
        canvas.width / 2,
        radius + (canvas.height / 2),
        radius,
        (-theta / 2) - (Math.PI / 2),
        (theta / 2) - (Math.PI / 2)
      );
      ctx.stroke();
      PlayerEnergyBar._barTexture = PIXI.Texture.fromCanvas(canvas);
    }
    return PlayerEnergyBar._barTexture;
  }

  public constructor(player: Player) {
    super();
    const texture = PlayerEnergyBar._getBarTexture();
    const margin = PlayerEnergyBar.MARGIN;
    const height = PlayerEnergyBar.HEIGHT;
    const x = -texture.width / 2;
    const y = margin + (0.5 * (player.height + height));
    // Overlay full sprite on top
    this._sprite = new PIXI.Sprite(texture);
    this._sprite.tint = new Color(0, 100, 255).toPixi();
    this._sprite.position.set(x, y);
    this.addChild(this._sprite);
    // Add clipping mask to full sprite
    this._spriteMask = new PIXI.Graphics();
    this._sprite.mask = this._spriteMask;
    this._sprite.addChild(this._spriteMask);
  }

  // Update size of sprite to be proportional to player energy
  public update(player: Player): void {
    const maskWidth = (
      (this._sprite.width - 2) * (player.energy / player.maxEnergy)
    );
    this._spriteMask.clear();
    this._spriteMask.beginFill(0xffffff);
    this._spriteMask.drawRect(
      (this._sprite.width - maskWidth) / 2,
      0,
      maskWidth,
      this._sprite.height
    );
    if (player.energy <= 0) {
      this._sprite.alpha = 0;
    } else {
      this._sprite.alpha = 1;
    }
  }
}

/**
 * Player class; handles input, animation, etc for the player.
 */
export class Player extends GameObject {
  private _spriteBottom: SpriteSheet;
  private _spriteTop: SpriteSheet;
  protected _sprite: PIXI.Sprite;
  protected _baseballBat: BaseballBat;
  protected _maxArmor: number;
  protected _armor: number;
  protected _maxEnergy: number;
  protected _energy: number;
  protected _healthBar: HealthBar;
  protected _cooldownBar: PlayerCooldownBar;
  protected _energyBar: PlayerEnergyBar;
  protected _hurtFade: number = 0;
  protected _armorMeter: PlayerArmorMeter;
  public facingLeft: boolean = false;
  public score: number = 0;
  public weapons: Weapon[];
  public equippedWeapon: Weapon;
  public weaponCooldownCounter: Counter = new Counter();
  public numMines: number;

  public get hurtFadePercent(): number {
    return this._hurtFade;
  }

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
    // Get player maximums from config
    this._maxHealth = Config.player.maxHealth;
    this._maxArmor = Config.player.maxArmor;
    this._maxEnergy = Config.player.maxEnergy;
    // Set up defaults
    this._health = this._maxHealth;
    this._armor = 0;
    this._energy = this._maxEnergy;
    // Set up weapons
    this.weapons = [
      new BaseballBat(),
      new Pistol(100),
      new Shotgun(100),
      new AssaultRifle(100),
    ];
    this._baseballBat = this.equippedWeapon = this.weapons[0];
    this.numMines = 100;
    // Add spritesheet
    this._spriteBottom = new SpriteSheet(
      PIXI.loader.resources[Config.player.bottomHalf.sprite.resource].texture,
      Config.player.bottomHalf.sprite.frames.width,
      Config.player.bottomHalf.sprite.frames.height,
      Config.player.bottomHalf.defaultAnim,
      Config.player.bottomHalf.animations
    );
    this._spriteTop = new SpriteSheet(
      PIXI.loader.resources[Config.player.topHalf.sprite.resource].texture,
      Config.player.topHalf.sprite.frames.width,
      Config.player.topHalf.sprite.frames.height,
      Config.player.topHalf.defaultAnim,
      Config.player.topHalf.animations
    );
    this._spriteBottom.anchor.set(
      Config.player.bottomHalf.sprite.anchor.x,
      Config.player.bottomHalf.sprite.anchor.y
    );
    this._spriteTop.anchor.set(
      Config.player.topHalf.sprite.anchor.x,
      Config.player.topHalf.sprite.anchor.y
    );
    this._sprite = new PIXI.Sprite();
    this._sprite.addChild(this._spriteBottom);
    this._sprite.addChild(this._spriteTop);
    this._mirrorList.push(this._sprite);
    this.addChild(this._sprite);
    // Add weapon cooldown bar above player's head
    this._cooldownBar = new PlayerCooldownBar(this);
    this._mirrorList.push(this._cooldownBar);
    this.addChild(this._cooldownBar);
    // Add health bar above player's head
    this._healthBar = new HealthBar(this, 15 /* bar/sprite margin */);
    this._mirrorList.push(this._healthBar);
    this.addChild(this._healthBar);
    // Add energy bar below player's feet
    this._energyBar = new PlayerEnergyBar(this);
    this._mirrorList.push(this._energyBar);
    this.addChild(this._energyBar);
    // Add armor level filter
    this._armorMeter = new PlayerArmorMeter(this._spriteTop, this._spriteBottom);
    this._mirrorList.push(this._armorMeter);
    this.addChild(this._armorMeter);
    // Spawn the player at a random spawn point
    const spawnPoint = game.level.getPlayerSpawn();
    this.pos.r = spawnPoint.r;
    this.pos.theta = spawnPoint.theta;
  }

  /**
   * Only collide with terrain and items. May need to be augmented for things
   * like enemy hitboxes or enemy projectiles.
   */
  public collidesWith(otherType: string): boolean {
    switch (otherType) {
      case 'block':
      case 'platform':
      case 'item':
        return true;
      default:
        return false;
    }
  }

  public type(): string { return 'player'; }

  public team(): string { return 'player'; }

  /**
   * Damage armor before health.
   */
  public damage(amount: number): void {
    // Also spawn a red fading text with the amount of damage shown
    this._game.addGameObject(new FadingText(
      this._game,
      `-${amount.toFixed()}`,
      this.pos,
      new PIXI.TextStyle({ fontSize: 24, fill: 'red' })
    ));
    // Reduce the score multiplier
    this._game.scoreMultiplier.decrease(amount);
    // Actually subtract the damage
    if (amount <= this._armor) {
      this.armor -= amount;
    } else {
      const healthDamage = amount - this._armor;
      this.health -= healthDamage;
      this.armor = 0;
      // Add to the percentage of the player's red fade, up to a certain
      // maximum. Taking more damage in a short period makes you more red
      this._hurtFade += Config.player.hurtFadePerDamage * healthDamage;
      if (this._hurtFade > Config.player.hurtFadeMax) {
        this._hurtFade = Config.player.hurtFadeMax;
      }
    }
    // Check if the player is dead
    if (this.health <= 0) {
      this.kill();
    }
  }

  public updatePreCollision(): void {
    super.updatePreCollision();
    // Update sprite animation
    this._spriteBottom.nextFrame();
    this._spriteTop.nextFrame();
    // Drain armor by small amount each tick
    this._armor -= Config.player.armorDrainSpeed * LagFactor.get();
    if (this._armor < 0) {
      this._armor = 0;
    }
    // Decrease hurt fade, also update the tint on the player sprite
    this._hurtFade -= Config.player.hurtFadeSpeed * LagFactor.get();
    if (this._hurtFade < 0) {
      this._hurtFade = 0;
    }
    const hurtColor = Color.white.blend(new Color(255, 0, 0), this._hurtFade);
    this._spriteTop.tint = this._spriteBottom.tint = hurtColor.toPixi();
    // Handle walking and running due to user input
    const walkSpeed = Config.player.walkSpeed / this.pos.r;
    const runSpeed = Config.player.runSpeed / this.pos.r;
    const leftArrow = this._game.keyState.isDown(KeyState.LEFTARROW);
    const rightArrow = this._game.keyState.isDown(KeyState.RIGHTARROW);
    const shift = this._game.keyState.isDown(KeyState.SHIFT);
    const running = shift && (leftArrow !== rightArrow);
    const energyLossRate = Config.player.energyLossRate;
    const energyGainRate = Config.player.energyGainRate;
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
      this._spriteTop.scale.x = this._spriteBottom.scale.x = -1;
    } else if (rightArrow && !leftArrow) {
      this.vel.theta = speed;
      this.facingLeft = false;
      this._spriteBottom.playAnim(anim);
      this._spriteTop.scale.x = this._spriteBottom.scale.x = 1;
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
    const upArrow = this._game.keyState.isPressed(KeyState.UPARROW);
    if (upArrow && this._isOnSolidGround()) {
      this.vel.r = Config.player.jumpSpeed;
    }
    // Offset the sprite top to match the sprite bottom
    const bottomFrame = this._spriteBottom.getVisibleFrame();
    this._spriteTop.y = Config.player.offsetsForBottomHalf[bottomFrame];
  }

  /**
   * Some things, such as spawning objects based on the player's position,
   * need to be done after collision - specificially after collision with the
   * terrain, so that if the player sinks into the terrain during pre-update
   * and is pushed out during collision, bullets/mines/etc still spawn in the
   * appropriate position.
   */
  public updatePostCollision(): void {
    // Update health bar after collision since player can gain/lose health from
    // collision
    this._healthBar.update(this);
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
      this._spriteTop.setDefault(`${this.equippedWeapon.type()}-idle`);
    }
    // If we meet certain conditions, fire the weapon. The weapon cooldown must
    // be complete and the equipped weapon must have ammo, and either the
    // fire key must have just been pressed or it must be held down and the
    // weapon must be fully automatic
    this.weaponCooldownCounter.next();
    if (this.weaponCooldownCounter.done() &&
        this.equippedWeapon.ammo > 0) {
      if (this._game.keyState.isPressed(KeyState.SPACEBAR) ||
          (this._game.keyState.isDown(KeyState.SPACEBAR) &&
           this.equippedWeapon.isFullAuto())) {
        // Decrease weapon ammo
        this.equippedWeapon.ammo--;
        // Make the player wait for the weapon-specific cooldown before firing
        // again
        this.weaponCooldownCounter.max = this.equippedWeapon.cooldown();
        this.weaponCooldownCounter.reset();
        // Add bullets to the scene
        this.equippedWeapon.fire(this._game);
        // Play the firing animation
        this._spriteTop.stopAnim();
        this._spriteTop.playAnimOnce(`${this.equippedWeapon.type()}-attack`);
      }
    }
    // If the player pressed the drop mine button and we have mines left,
    // drop a mine
    if (this._game.keyState.isPressed(KeyState.Q) && this.numMines > 0) {
      this.numMines--;
      this._game.addGameObject(new ProximityMine(this._game));
    }
    // Update weapon cooldown bar
    this._cooldownBar.update(this);
    // Update energy bar
    this._energyBar.update(this);
    // Update the armor meter
    this._armorMeter.update(this);
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
