import { Weapon } from './weapon';
import { BulletTrail } from '../objects/bullet';
import { GameInstance } from '../game-instance';
import { KeyState } from '../input/keystate';
import { Config } from '../config';

export class Shotgun extends Weapon {
  public type(): string { return 'shotgun'; }

  public cooldown(): number { return Config.weapons.shotgun.cooldown; }

  public fire(game: GameInstance): void {
    const offsetR = Config.weapons.shotgun.offset.y;
    const offsetTheta = (
      (game.player.facingLeft ? -1 : 1) *
      Config.weapons.shotgun.offset.x /
      game.player.pos.r
    );
    const spread = Config.weapons.shotgun.spread;
    const numBullets = Config.weapons.shotgun.numBullets;
    for (let i = 0; i < numBullets; i++) {
      // Interpolate dirOffsetR linearly from -spread to +spread based on i
      const dirOffsetR = -spread + (2 * spread * i / (numBullets - 1));
      const bulletTrail = new BulletTrail(
        game,
        Config.weapons.shotgun.range,
        offsetR,
        offsetTheta,
        dirOffsetR + (Math.random() - 0.5) * spread / 2,
        Config.weapons.shotgun.knockbackVel,
        Config.weapons.shotgun.knockbackTime,
        Config.weapons.shotgun.stunTime,
        Config.weapons.shotgun.damage / numBullets
      );
      game.addGameObject(bulletTrail);
    }
  }
}
