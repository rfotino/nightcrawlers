import { UIContainer } from './container';
import { Game } from '../game';
import { GameInstance } from '../game-instance';
import { Color } from '../graphics/color';
import { Polar } from '../math/polar';
import { Enemy } from '../objects/enemy';

function getCenter(rect: PIXI.Rectangle): PIXI.Point {
  return new PIXI.Point(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
}

class IndicatorArrow extends PIXI.Sprite {
  public alive: boolean = true;
  protected _pointer: PIXI.Sprite;
  protected static _circleTexture: PIXI.Texture = null;
  protected static _pointerTexture: PIXI.Texture = null;

  protected static get RADIUS(): number { return 30; }
  protected static get IMAGE_RADIUS(): number {
    return IndicatorArrow.RADIUS - 3;
  }
  protected static get POINTER_OFFSET(): number { return 3; }
  protected static get POINTER_WIDTH(): number { return 20; }
  protected static get POINTER_HEIGHT(): number { return 15; }
  public static get MAX_RADIUS(): number {
    return (
      IndicatorArrow.RADIUS +
      IndicatorArrow.POINTER_OFFSET +
      IndicatorArrow.POINTER_HEIGHT
    );
  }

  public constructor(enemyType: string) {
    super(IndicatorArrow.getCircleTexture());
    this.anchor.set(0.5);
    // Add directional pointer arrow
    this._pointer = new PIXI.Sprite(IndicatorArrow.getPointerTexture());
    this._pointer.anchor.x = 0.5;
    this._pointer.anchor.y = 1;
    this.addChild(this._pointer);
    // Add image of the enemy
    const enemyResourceName = `game/indicator-${enemyType}`;
    const enemyTexture = PIXI.loader.resources[enemyResourceName].texture;
    const enemySprite = new PIXI.Sprite(enemyTexture);
    this.addChild(enemySprite);
    const enemyScale = (
      2 * IndicatorArrow.IMAGE_RADIUS /
      Math.max(enemySprite.width, enemySprite.height)
    );
    enemySprite.anchor.set(0.5);
    enemySprite.scale.set(enemyScale);
  }

  public setDir(dir: PIXI.Point) {
    let radius = IndicatorArrow.RADIUS + IndicatorArrow.POINTER_OFFSET;
    let theta = Math.atan2(dir.y, dir.x);
    this._pointer.position.x = radius * Math.cos(theta);
    this._pointer.position.y = radius * Math.sin(theta);
    this._pointer.rotation = theta + (Math.PI / 2);
  }

  public static getCircleTexture(): PIXI.Texture {
    if (!IndicatorArrow._circleTexture) {
      let radius = IndicatorArrow.RADIUS;
      let canvas = document.createElement('canvas');
      canvas.width = canvas.height = (radius + 1) * 2;
      let ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgb(50, 50, 50)';
      ctx.beginPath();
      ctx.arc(radius + 1, radius + 1, radius, 0, Math.PI * 2);
      ctx.fill();
      IndicatorArrow._circleTexture = PIXI.Texture.fromCanvas(canvas);
    }
    return IndicatorArrow._circleTexture;
  }

  public static getPointerTexture(): PIXI.Texture {
    if (!IndicatorArrow._pointerTexture) {
      let canvas = document.createElement('canvas');
      canvas.width = IndicatorArrow.POINTER_WIDTH;
      canvas.height = IndicatorArrow.POINTER_HEIGHT + 1;
      let ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgb(50, 50, 50)';
      ctx.beginPath();
      ctx.moveTo(IndicatorArrow.POINTER_WIDTH / 2, 0);
      ctx.lineTo(IndicatorArrow.POINTER_WIDTH, IndicatorArrow.POINTER_HEIGHT);
      ctx.lineTo(0, IndicatorArrow.POINTER_HEIGHT);
      ctx.closePath();
      ctx.fill();
      IndicatorArrow._pointerTexture = PIXI.Texture.fromCanvas(canvas);
    }
    return IndicatorArrow._pointerTexture;
  }
}

export class EnemyIndicator extends UIContainer {
  protected _gameInst: GameInstance;
  protected _arrows: {[key: number]: IndicatorArrow} = {};

  protected static get DIST_FROM_EDGE(): number {
    return IndicatorArrow.MAX_RADIUS * 1.2;
  }

  public constructor(game: Game, gameInst: GameInstance) {
    super(game);
    this._gameInst = gameInst;
  }

  public update(): void {
    super.update();
    // Get view bounds, player position, and array of all enemies
    const viewBounds = this.getBounds();
    const playerCenter = getCenter(this._gameInst.player.getBounds());
    const enemies = <Enemy[]>this._gameInst.gameObjects.filter(obj => {
      return obj.type() === 'enemy';
    });
    // Mark all arrows as dead, any still marked as dead at the end will
    // be cleaned up
    for (const id in this._arrows) {
      if (this._arrows.hasOwnProperty(id)) {
        this._arrows[id].alive = false;
      }
    }
    // Update position of all enemy arrows
    enemies.forEach(enemy => {
      // Add an indicator arrow for this enemy if one doesn't exist
      if (!this._arrows[enemy.id]) {
        const newArrow = new IndicatorArrow(enemy.enemyType());
        this.addChild(newArrow);
        this._arrows[enemy.id] = newArrow;
      }
      const arrow = this._arrows[enemy.id];
      // Weird hack - need to set enemy to visible in order to get correct
      // bounds. Then set it back to whatever it was before.
      const enemyVisible = enemy.visible;
      enemy.visible = true;
      const enemyCenter = getCenter(enemy.getBounds());
      enemy.visible = enemyVisible;
      arrow.alive = true;
      // If the enemy is on screen, make arrow invisible and do nothing else
      if (viewBounds.contains(enemyCenter.x, enemyCenter.y)) {
        arrow.visible = false;
        return;
      } else {
        arrow.visible = true;
      }
      // Place the arrow at the edge of the screen in the direction of the enemy
      const playerToEnemy = new PIXI.Point(
        enemyCenter.x - playerCenter.x,
        enemyCenter.y - playerCenter.y
      );
      let playerToEnemyDist = Math.sqrt(
        playerToEnemy.x**2 + playerToEnemy.y**2
      );
      // Choose some arbitrary value if the dist is 0 to avoid dividing by zero
      if (playerToEnemyDist === 0) {
        playerToEnemyDist = 1;
      }
      const playerToEnemyUnit = new PIXI.Point(
        playerToEnemy.x / playerToEnemyDist,
        playerToEnemy.y / playerToEnemyDist
      );
      const up = enemyCenter.y < playerCenter.y;
      const left = enemyCenter.x < playerCenter.x;
      let slope: number;
      if (playerToEnemyUnit.x === 0) {
        // Slope should be infinite, instead just make it some arbitrarily
        // large number which will work well enough
        slope = 1e6;
      } else {
        slope = playerToEnemyUnit.y / playerToEnemyUnit.x;
      }
      const minY = EnemyIndicator.DIST_FROM_EDGE;
      const maxY = this.height - EnemyIndicator.DIST_FROM_EDGE;
      const desiredY = up ? minY : maxY;
      const minX = EnemyIndicator.DIST_FROM_EDGE;
      const maxX = this.width - EnemyIndicator.DIST_FROM_EDGE;
      const desiredX = left ? minX : maxX;
      const actualX = ((desiredY - playerCenter.y) / slope) + playerCenter.x;
      const actualY = (slope * (desiredX - playerCenter.x)) + playerCenter.y;
      arrow.position.x = Math.min(Math.max(minX, actualX), maxX);
      arrow.position.y = Math.min(Math.max(minY, actualY), maxY);
      // Make the arrow point at the enemy
      const arrowToEnemy = new PIXI.Point(
        enemyCenter.x - arrow.position.x,
        enemyCenter.y - arrow.position.y
      );
      let arrowToEnemyDist = Math.sqrt(arrowToEnemy.x**2 + arrowToEnemy.y**2);
      // Choose some arbitrary value if the dist is 0 to avoid dividing by zero
      if (arrowToEnemyDist === 0) {
        arrowToEnemyDist = 1;
      }
      const arrowToEnemyUnit = new PIXI.Point(
        arrowToEnemy.x / arrowToEnemyDist,
        arrowToEnemy.y / arrowToEnemyDist
      );
      arrow.setDir(arrowToEnemyUnit);
      // Shrink the arrow depending on its distance from the enemy
      const maxDist = this._gameInst.level.getOuterRadius() * 2;
      const scale = Math.max(0.5, (maxDist - arrowToEnemyDist) / maxDist);
      arrow.scale.set(scale);
    });
    // Clean up arrows pointing to dead enemies
    for (const id in this._arrows) {
      if (this._arrows.hasOwnProperty(id) && !this._arrows[id].alive) {
        this.removeChild(this._arrows[id]);
        delete this._arrows[id];
      }
    }
  }
}
