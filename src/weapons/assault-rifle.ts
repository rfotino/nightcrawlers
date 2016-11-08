import { Weapon } from './weapon';
import { Bullet } from '../objects/bullet';
import { GameInstance } from '../game-instance';
import { KeyState } from '../input/keystate';
import { Counter } from '../math/counter';

export class AssaultRifle extends Weapon {
  public _cooldownCounter: Counter = new Counter(5);

  public type(): string { return 'assault'; }

  public maybeFire(game: GameInstance): boolean {
    if (this.ammo > 0 &&
        (game.keyState.isPressed(KeyState.SPACEBAR) ||
         (game.keyState.isDown(KeyState.SPACEBAR) &&
          this._cooldownCounter.done()))) {
      this.ammo--;
      this._cooldownCounter.reset();
      game.addGameObject(new Bullet(game));
      return true;
    } else {
      this._cooldownCounter.next();
      return false;
    }
  }
}
