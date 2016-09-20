/// <reference path="../typings/pixi.js/pixi.js.d.ts" />

import { GameObject } from './gameobject';

export class Player extends GameObject {
  constructor(container: PIXI.Container) {
    super(container);
    this._sprite.texture = PIXI.loader.resources['player'].texture;
  }

  update(): void {
    super.update();
    // Do some more player updating
  }
}