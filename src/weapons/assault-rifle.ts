import { Weapon } from './weapon';
import { Bullet } from '../objects/bullet';
import { GameInstance } from '../game-instance';
import { KeyState } from '../input/keystate';
import { Counter } from '../math/counter';

export class AssaultRifle extends Weapon {
  public _cooldownCounter: Counter;

  public constructor() {
    super();
    this.ammo = 50;
    this._cooldownCounter = new Counter(5);
  }

  public type(): string { return 'assault-rifle'; }

  public maybeFire(game: GameInstance): void {
    if (this.ammo > 0 &&
        (game.keyState.isPressed(KeyState.SPACEBAR) ||
         (game.keyState.isDown(KeyState.SPACEBAR) &&
          this._cooldownCounter.done()))) {
      this.ammo--;
      this._cooldownCounter.reset();
      game.addGameObject(new Bullet(game.player));
    } else {
      this._cooldownCounter.next();
    }
  }
}
