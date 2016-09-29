import { KeyState } from '../input/keystate';

export abstract class Screen extends PIXI.Container {
  public keyState: KeyState;

  public constructor(keyState: KeyState) {
    super();
    this.keyState = keyState;
  }

  public abstract update(width: number, height: number): void;
}
