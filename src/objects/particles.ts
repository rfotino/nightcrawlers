import { GameObject } from './game-object';
import { Polar } from '../math/polar';
import { Counter } from '../math/counter';
import { LagFactor } from '../math/lag-factor';
import { Color } from '../graphics/color';
import { GameInstance } from '../game-instance';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface ParticleGroupOptions {
  pos?: Polar.Coord;
  vel?: Polar.Coord;
  getColor?: (number) => Color;
  getRadiusFactor?: (number) => number;
  radius?: number;
  radiusRandom?: number;
  speed?: number;
  speedRandom?: number;
  lifespan?: number;
  numParticles?: number;
}

export class ParticleGroup extends GameObject {
  protected _lifeCounter: Counter;
  protected _particles: Particle[];
  protected _graphics: PIXI.Graphics;
  protected _getRadiusFactor: (number) => number;
  protected _getColor: (number) => Color;

  public get z(): number { return 40; }

  public constructor(game: GameInstance, options: ParticleGroupOptions = {}) {
    super(game);
    // Set defaults
    options.pos = options.pos || new Polar.Coord();
    options.vel = options.vel || new Polar.Coord();
    options.getRadiusFactor = options.getRadiusFactor || ((n) => 1 - n);
    options.getColor = options.getColor || (() => new Color());
    options.radius = options.radius || 3;
    options.radiusRandom = options.radiusRandom || 0;
    options.speed = options.speed || 5;
    options.speedRandom = options.speedRandom || 0;
    options.lifespan = options.lifespan || 15;
    options.numParticles = options.numParticles || 10;
    // Set up particles
    this.pos.set(options.pos.r, options.pos.theta);
    this.vel.set(options.vel.r, options.vel.theta);
    this._lifeCounter = new Counter(options.lifespan);
    this._particles = [];
    for (let i = 0; i < options.numParticles; i++) {
      const dir = Math.random() * Math.PI * 2;
      const speed = options.speed + (Math.random() * options.speedRandom);
      const radius = options.radius + (Math.random() * options.radiusRandom);
      this._particles.push({
        x: 0,
        y: 0,
        vx: speed * Math.cos(dir),
        vy: speed * Math.sin(dir),
        radius: radius,
      });
    }
    this._getColor = options.getColor;
    this._getRadiusFactor = options.getRadiusFactor;
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
    const color = this._getColor(this._lifeCounter.percent());
    this._graphics.clear();
    this._graphics.beginFill(color.toPixi(), color.a);
    this._particles.forEach(particle => {
      this._graphics.drawCircle(
        particle.x, particle.y,
        particle.radius * this._getRadiusFactor(this._lifeCounter.percent())
      );
    });
    this._graphics.endFill();
  }
}

export class BloodSplatter extends ParticleGroup {
  public constructor(game: GameInstance, pos: Polar.Coord, vel: Polar.Coord) {
    const bloodColor = new Color(255, 0, 0);
    super(game, {
      pos: pos,
      vel: vel,
      getColor: () => bloodColor,
      getRadiusFactor: (n) => 1 - n,
      speed: 5,
      speedRandom: 2,
      radius: 3,
      radiusRandom: 3,
      lifespan: 15,
      numParticles: 10,
    });
  }
}

export class Explosion extends ParticleGroup {
  public constructor(game: GameInstance, pos: Polar.Coord, vel: Polar.Coord) {
    const startColor = new Color(255, 255, 100);
    const endColor = new Color(255, 150, 0, 0.2);
    super(game, {
      pos: pos,
      vel: vel,
      getColor: (percent) => startColor.blend(endColor, percent**2),
      getRadiusFactor: (n) => 1 - n,
      speed: 15,
      speedRandom: 10,
      radius: 13,
      radiusRandom: 7,
      lifespan: 10,
      numParticles: 20,
    });
  }
}
