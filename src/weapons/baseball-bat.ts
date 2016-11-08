import { Weapon } from './weapon';
import { Bullet } from '../objects/bullet';
import { Player } from '../objects/player';
import { GameInstance } from '../game-instance';
import { KeyState } from '../input/keystate';

class BaseballBatBullet extends Bullet {
  private static _texture: PIXI.Texture;

  public get width(): number { return 60; }
  public get height(): number { return 70; }

  // Bat knocks back enemies more than other weapons
  protected get _knockbackVel(): number {
    const speed = 30 / this.pos.r;
    return this._game.player.facingLeft ? -speed : speed;
  }
  protected get _knockbackTime(): number { return 7; }
  protected get _stunTime(): number { return 15; }

  public constructor(game: GameInstance) {
    super(game);
    // Baseball bat hitbox doesn't have a visible bullet
    this._sprite.visible = false;
    // Don't want the bat hitbox to get cleaned up when it immediately impacts
    // terrain upon spawning
    this._killedByTerrain = false;
    // Bat hitbox shouldn't move
    this.vel.set(0, 0);
    // Bat swing lasts a short amount of time
    this._lifespanCounter.max = 10;
  }

  public collidable(): boolean {
    // Short delay before baseball bat hitbox becomes collidable (have to
    // account for the windup)
    return this._lifespanCounter.count > 3;
  }

  public update(): void {
    super.update();
    // Position the hitbox inside the player bounds but sticking out to the
    // left or right depending on where the player is facing
    const ownerBounds = this._game.player.getPolarBounds();
    const thisBounds = this.getPolarBounds();
    if (this._game.player.facingLeft) {
      this.pos.theta = (
        ownerBounds.theta +
        (ownerBounds.width / 2) -
        (thisBounds.width / 2)
      );
    } else {
      this.pos.theta = (
        ownerBounds.theta +
        (ownerBounds.width / 2) +
        (thisBounds.width / 2)
      );
    }
    this.pos.r = ownerBounds.r - (ownerBounds.height / 2) + 10;
  }
}

export class BaseballBat extends Weapon {
  public constructor() {
    super(Infinity);
  }

  public type(): string { return 'baseball-bat'; }

  public maybeFire(game: GameInstance): boolean {
    if (game.keyState.isPressed(KeyState.SPACEBAR)) {
      game.addGameObject(new BaseballBatBullet(game));
      return true;
    }
    return false;
  }
}
