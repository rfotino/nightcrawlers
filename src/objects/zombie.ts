import { JumpingEnemy } from './enemy';

/**
 * Stub class for zombie behavior to be added later.
 */
export class Zombie extends JumpingEnemy {
  public get width(): number { return 30; }
  public get height(): number { return 50; }
  protected get _color(): string { return 'green'; }
}
