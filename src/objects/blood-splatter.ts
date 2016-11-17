import { GameObject } from './game-object';
import { Polar } from '../math/polar';
import { Counter } from '../math/counter';
import { LagFactor } from '../math/lag-factor';
import { Color } from '../graphics/color';
import { GameInstance } from '../game-instance';

interface BloodParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export class BloodSplatter extends GameObject {
  protected _lifeCounter: Counter;
  protected _particles: BloodParticle[];
  protected _graphics: PIXI.Graphics;

  public get z(): number { return 40; }

  public constructor(game: GameInstance, pos: Polar.Coord, vel: Polar.Coord) {
    super(game);
    this.pos.set(pos.r, pos.theta);
    this.vel.set(vel.r, vel.theta);
    this._lifeCounter = new Counter(15);
    this._particles = [];
    for (let i = 0; i < 10; i++) {
      const dir = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 2;
      const radius = 3 + (3 * Math.random());
      this._particles.push({
        x: 0,
        y: 0,
        vx: speed * Math.cos(dir),
        vy: speed * Math.sin(dir),
        radius: radius,
      });
    }
    this._graphics = new PIXI.Graphics();
    this._mirrorList.push(this._graphics);
    this.addChild(this._graphics);
    this._draw();
  }

  public collidable(): boolean { return false; }

  public movable(): boolean { return false; }

  public type(): string { return 'blood'; }

  public getPolarBounds(): Polar.Rect {
    return new Polar.Rect(this.pos.r, this.pos.theta, 0, 0);
  }

  public update(): void {
    super.update();
    this._lifeCounter.next();
    if (this._lifeCounter.done()) {
      this.kill();
      return;
    }
    this._particles.forEach(particle => {
      particle.x += particle.vx * LagFactor.get();
      particle.y += particle.vy * LagFactor.get();
    });
    this._draw();
  }

  protected _draw(): void {
    const bloodColor = new Color(255, 0, 0).toPixi();
    this._graphics.clear();
    this._graphics.beginFill(bloodColor);
    this._particles.forEach(particle => {
      this._graphics.drawCircle(
        particle.x, particle.y,
        particle.radius * (1 - this._lifeCounter.percent())
      );
    });
    this._graphics.endFill();
  }
}
