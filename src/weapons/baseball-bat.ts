import { Weapon } from './weapon';
import { GameObject } from '../objects/game-object';
import { Player } from '../objects/player';
import { Enemy } from '../objects/enemy';
import { GameInstance } from '../game-instance';
import { KeyState } from '../input/keystate';
import { Counter } from '../math/counter';
import { Polar } from '../math/polar';
import { Collider } from '../math/collider';
import { Config } from '../config';

class BaseballBatBullet extends GameObject {
  // Bat swings last a short amount of time
  protected _lifespanCounter: Counter = new Counter(10);

  public get width(): number { return Config.weapons.bat.hitbox.width; }
  public get height(): number { return Config.weapons.bat.hitbox.height; }

  // Bat knocks back enemies more than other weapons
  protected get _knockbackVel(): number {
    const speed = Config.weapons.bat.knockbackVel / this.pos.r;
    return this._game.player.facingLeft ? -speed : speed;
  }
  protected get _knockbackTime(): number { return Config.weapons.bat.knockbackTime; }
  protected get _stunTime(): number { return Config.weapons.bat.stunTime; }

  protected get _damageAmount(): number { return Config.weapons.bat.damage; }

  public collidable(): boolean {
    // Short delay before baseball bat hitbox becomes collidable (have to
    // account for the windup)
    return this._lifespanCounter.count > 3;
  }

  public type(): string { return 'bat-swing'; }
  public team(): string { return 'player'; }

  /**
   * Approximate this Cartesian rectangle as a polar rectangle.
   */
  public getPolarBounds(): Polar.Rect {
    const widthTheta = this.width / this.pos.r;
    return new Polar.Rect(
      this.pos.r + (this.height / 2),
      this.pos.theta - (widthTheta / 2),
      this.height,
      widthTheta
    );
  }

  public update(): void {
    super.update();
    // If the lifespan has run out, remove this object from the scene
    if (this._lifespanCounter.done()) {
      this.kill();
      return;
    } else {
      this._lifespanCounter.next();
    }
    // Position the hitbox inside the player bounds but sticking out to the
    // left or right depending on where the player is facing
    const ownerBounds = this._game.player.getPolarBounds();
    const thisBounds = this.getPolarBounds();
    const thetaOffset = (
      (thisBounds.width / 2) +
      (Config.weapons.bat.offset.x / this.pos.r)
    );
    this.pos.theta = (
      ownerBounds.theta +
      (ownerBounds.width / 2) +
      ((this._game.player.facingLeft ? -1 : 1) * thetaOffset)
    );
    this.pos.r = (
      ownerBounds.r -
      (ownerBounds.height / 2) +
      Config.weapons.bat.offset.y
    );
  }

  public collide(other: GameObject, result: Collider.Result): void {
    super.collide(other, result);
    if (other.team() === 'enemy') {
      const enemy = <Enemy>other;
      // Damage has to be after knockback, otherwise blood splatter won't have
      // the correct velocity if damage() ends up killing the enemy
      enemy.knockback(this._knockbackVel, this._knockbackTime, this._stunTime);
      enemy.damage(this._damageAmount);
      this.kill();
    }
  }
}

export class BaseballBat extends Weapon {
  public constructor() {
    super(Infinity);
  }

  public type(): string { return 'baseball-bat'; }

  public cooldown(): number { return Config.weapons.bat.cooldown; }

  public fire(game: GameInstance): void {
    game.addGameObject(new BaseballBatBullet(game));
  }
}
