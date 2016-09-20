/// <reference path="../typings/pixi.js/pixi.js.d.ts" />

import { GameObject } from './gameobject';

export class Planet extends GameObject {
  radius: number = 500;

  constructor(container: PIXI.Container) {
    super(container);
    this._sprite.texture = PIXI.loader.resources['planet'].texture;
  }
}
