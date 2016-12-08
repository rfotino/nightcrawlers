export class Config {
  public static get enemies(): any {
    return PIXI.loader.resources['config/enemies'].data;
  }
  public static get player(): any {
    return PIXI.loader.resources['config/player'].data;
  }
  public static get weapons(): any {
    return PIXI.loader.resources['config/weapons'].data;
  }
}
