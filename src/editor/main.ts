import { Polar } from '../math/polar';
import { Color } from '../graphics/color';
import { KeyState } from '../input/keystate';
import { MouseState } from '../input/mousestate';

let canvas = <HTMLCanvasElement>document.getElementById('canvas');

class LevelObject {
  public type: string;
  public r: number;
  public theta: number;
  public height: number;
  public width: number;
  public rate: number;
  public moves: boolean;
  public rPrime: number;
  public thetaPrime: number;
  public itemType: string;
  public frame: number;
  public framesUp: boolean;

  public get z(): number {
    switch (this.type) {
      default:
      case 'underground':
        return 5
      case 'stone':
      case 'grass':
        return 10;
      case 'platform':
        return 15;
      case 'player-spawn':
      case 'item-spawn':
        return 20;
    }
  }

  public constructor(type: string,
                     r: number, theta: number, height: number, width: number) {
    this.type = type;
    this.r = r;
    this.theta = theta;
    this.height = height;
    this.width = width;
    this.rate = 60;
    this.moves = false;
    this.rPrime = this.r;
    this.thetaPrime = this.theta;
    this.itemType = elem('item-type').value;
    this.frame = 0;
    this.framesUp = true;
  }

  public toRect(): Polar.Rect {
    let anim = (this.frame / Math.max(this.rate, 1));
    let r = (this.r * (1 - anim)) + (this.rPrime * anim);
    let theta = (this.theta * (1 - anim)) + (this.thetaPrime * anim);
    return new Polar.Rect(r, theta, this.height, this.width);
  }

  public getColor(): Color {
    switch (this.type) {
      default:
      case 'stone':
        return new Color(150, 150, 150);
      case 'grass':
        return new Color(50, 255, 100);
      case 'platform':
        return new Color(200, 200, 230);
      case 'underground':
        return new Color(100, 100, 100);
      case 'player-spawn':
        return new Color(50, 100, 255);
      case 'item-spawn':
        return new Color(150, 200, 255);
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    switch (this.type) {
      default:
      case 'stone':
      case 'grass':
      case 'platform':
      case 'underground':
        let rect = this.toRect();
        if (rect.r > 0 && rect.height > 0) {
          let minR = Math.max(0, rect.r - rect.height);
          ctx.arc(0, 0, rect.r, rect.theta, rect.theta + rect.width);
          ctx.arc(0, 0, minR, rect.theta + rect.width, rect.theta, true);
          ctx.closePath();
        }
        break;
      case 'player-spawn':
      case 'item-spawn':
        ctx.arc(
          this.r * Math.cos(this.theta),
          this.r * Math.sin(this.theta),
          20,
          0,
          Math.PI * 2
        );
        break;
    }
  }

  public contains(coord: Polar.Coord): boolean {
    switch (this.type) {
      default:
      case 'stone':
      case 'grass':
      case 'platform':
      case 'underground':
        return this.toRect().contains(coord);
      case 'player-spawn':
      case 'item-spawn':
        let thisX = this.r * Math.cos(this.theta);
        let thisY = this.r * Math.sin(this.theta);
        let thatX = coord.r * Math.cos(coord.theta);
        let thatY = coord.r * Math.sin(coord.theta);
        let dist = Math.sqrt(
          Math.pow(thisX - thatX, 2) + Math.pow(thisY - thatY, 2)
        );
        return dist < 20;
    }
  }

  public canAdd(): boolean {
    switch (this.type) {
      default:
      case 'stone':
      case 'grass':
      case 'platform':
      case 'underground':
        return this.r > 0 && this.height > 0 && this.width > 0;
      case 'player-spawn':
      case 'item-spawn':
        return true;
    }
  }
}

function elem(id: string): HTMLInputElement {
  return <HTMLInputElement>document.getElementById(id);
}

function setFields(obj: LevelObject): void {
  elem('type').value = obj.type;
  elem('r').value = obj.r.toString();
  elem('theta').value = obj.theta.toString();
  elem('height').value = obj.height.toString();
  elem('width').value = obj.width.toString();
  elem('rate').value = obj.rate.toString();
  elem('moves').checked = obj.moves;
  elem('r-prime').value = obj.rPrime.toString();
  elem('theta-prime').value = obj.thetaPrime.toString();
  elem('item-type').value = obj.itemType;
}

function addEventListeners(elem: HTMLElement,
                           types: string[],
                           callback: (e: Event) => void) {
  types.forEach(type => elem.addEventListener(type, callback));
}

[
  'type',
  'r',
  'theta',
  'height',
  'width',
  'rate',
  'moves',
  'r-prime',
  'theta-prime',
  'item-type',
].forEach((id: string) => {
  addEventListeners(elem(id), ['change', 'input'], (e: Event) => {
    if (selectedObj) {
      selectedObj.type = elem('type').value;
      selectedObj.r = parseFloat(elem('r').value);
      selectedObj.theta = parseFloat(elem('theta').value);
      selectedObj.height = parseFloat(elem('height').value);
      selectedObj.width = parseFloat(elem('width').value);
      selectedObj.rate = parseFloat(elem('rate').value);
      selectedObj.moves = elem('moves').checked;
      selectedObj.rPrime = parseFloat(elem('r-prime').value);
      selectedObj.thetaPrime = parseFloat(elem('theta-prime').value);
      selectedObj.itemType = elem('item-type').value;
    }
  });
});

let objects: LevelObject[] = [
  new LevelObject('stone', 250, 0, 250, Math.PI * 2),
  new LevelObject('stone', 300, 0, 50, Math.PI * 1.5),
  new LevelObject('underground', 300, -Math.PI * 0.5, 50, Math.PI * 0.5),
  new LevelObject('grass', 350, Math.PI * 0.5, 50, Math.PI * 0.5),
  new LevelObject('platform', 400, 0, 10, Math.PI * 0.5),
];

let selectedObj: LevelObject = null;
let addingObj: LevelObject = null;

const RSTEP = 10;
const THETASTEP = 0.025;

let mouseState = new MouseState();
let keyState = new KeyState();
mouseState.addListeners(canvas);
keyState.addListeners(canvas);

// Prevent default key action when canvas is focused, unless control key
// is pressed
canvas.addEventListener('keyup', (e: KeyboardEvent) => {
  if (!e.ctrlKey) {
    e.preventDefault();
  }
  return false;
});

function getScale(): number {
  let maxR = 0;
  objects.forEach(obj => {
    maxR = Math.max(maxR, obj.r, obj.rPrime);
  });
  let scale = canvas.height / (maxR * 2);
  return scale;
}

function getMousePos(): Polar.Coord {
  let scale = getScale();
  let mousePos = Polar.Coord.fromCartesian(
    (mouseState.x - (canvas.width / 2)) / scale,
    (mouseState.y - (canvas.height / 2)) / scale
  );
  return mousePos;
}

function update(): void {
  let mousePos = getMousePos();
  // Select an object if the user clicks on it
  if (!addingObj && mouseState.isDown(MouseState.LEFT)) {
    selectedObj = null;
    objects.forEach(obj => {
      if (obj.contains(mousePos)) {
        selectedObj = obj;
        setFields(obj);
      }
    });
  }
  // Change size of object with arrow keys
  if (selectedObj) {
    let changed = true;
    if (keyState.isDown(KeyState.SHIFT)) {
      if (keyState.isPressed(KeyState.UPARROW)) {
        selectedObj.height += RSTEP;
      } else if (keyState.isPressed(KeyState.DOWNARROW)) {
        selectedObj.height -= RSTEP;
      } else if (keyState.isPressed(KeyState.LEFTARROW)) {
        selectedObj.width -= THETASTEP;
      } else if (keyState.isPressed(KeyState.RIGHTARROW)) {
        selectedObj.width += THETASTEP;
      } else {
        changed = false;
      }
    } else {
      if (keyState.isPressed(KeyState.UPARROW)) {
        selectedObj.r += RSTEP;
      } else if (keyState.isPressed(KeyState.DOWNARROW)) {
        selectedObj.r -= RSTEP;
      } else if (keyState.isPressed(KeyState.LEFTARROW)) {
        selectedObj.theta -= THETASTEP;
      } else if (keyState.isPressed(KeyState.RIGHTARROW)) {
        selectedObj.theta += THETASTEP;
      } else {
        changed = false;
      }
    }
    if (changed) {
      setFields(selectedObj);
    }
  }
  // Delete selected object if the user presses backspace
  if (keyState.isPressed(KeyState.BACKSPACE)) {
    objects = objects.filter(rect => rect !== selectedObj);
    selectedObj = null;
  }
  // Update whether we're adding an object or not
  if (!addingObj && !selectedObj && mouseState.isDown(MouseState.LEFT)) {
    addingObj = new LevelObject(
      elem('type-new').value,
      Math.round(mousePos.r / RSTEP) * RSTEP,
      Math.round(mousePos.theta / THETASTEP) * THETASTEP,
      0,
      0
    );
  } else if (addingObj) {
    if (mouseState.isDown(MouseState.LEFT)) {
      let height = Math.max(0, addingObj.r - mousePos.r);
      let width = mousePos.theta - addingObj.theta;
      if (width < 0) {
        width += Math.PI * 2;
      }
      addingObj.height = Math.round(height / RSTEP) * RSTEP;
      addingObj.width = Math.round(width / THETASTEP) * THETASTEP;
      setFields(addingObj);
    } else {
      if (addingObj.canAdd()) {
        objects.push(addingObj);
        selectedObj = addingObj;
      }
      addingObj = null;
    }
  }
  // Update animation frames
  objects.forEach(obj => {
    if (obj.type === 'platform' && obj.moves) {
      if (obj.framesUp) {
        if (obj.frame < obj.rate) {
          obj.frame++;
        } else {
          obj.framesUp = false;
        }
      } else {
        if (obj.frame > 0) {
          obj.frame--;
        } else {
          obj.framesUp = true;
        }
      }
    } else {
      obj.frame = 0;
      obj.framesUp = true;
    }
  })
}

let dashOffset = 0;

function draw(): void {
  dashOffset++;
  let scale = getScale();
  let mousePos = getMousePos();
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(scale, scale);
  let drawables = addingObj ? objects.concat(addingObj) : objects;
  drawables.sort((a, b) => a.z - b.z).forEach(obj => {
    let color = obj.getColor();
    if (obj.contains(mousePos) && !addingObj) {
      color.set(200, 200, 50);
    }
    ctx.fillStyle = color.toString();
    obj.draw(ctx);
    ctx.fill();
  });
  // Highlight selected object
  if (selectedObj) {
    selectedObj.draw(ctx);
    ctx.lineWidth = 2 / scale;
    ctx.strokeStyle = 'black';
    ctx.setLineDash([5 / scale, 10 / scale]);
    ctx.lineDashOffset = dashOffset;
    ctx.stroke();
  }
  ctx.restore();
  mouseState.rollOver();
  keyState.rollOver();
}

function updateDrawLoop(): void {
  requestAnimationFrame(updateDrawLoop);
  update();
  draw();
}
updateDrawLoop();

let waves = [];

elem('load').addEventListener('click', () => {
  let fileInput = elem('file');
  if (fileInput.files.length <= 0) {
    return;
  }
  let reader = new FileReader();
  objects = [];
  selectedObj = null;
  reader.onload = () => {
    let dataString: string = reader.result;
    let data = JSON.parse(dataString);
    objects = [];
    if (data.blocks) {
      data.blocks.forEach(block => {
        let obj = new LevelObject(
          block.type || 'stone',
          block.r,
          block.theta,
          block.height,
          block.width
        );
        objects.push(obj);
      });
    }
    if (data.platforms) {
      data.platforms.forEach(platform => {
        let obj = new LevelObject(
          'platform',
          platform.r,
          platform.theta,
          platform.height,
          platform.width
        );
        obj.rate = platform.rate || 60;
        obj.moves = platform.moves || false;
        obj.rPrime = platform.rPrime || platform.r;
        obj.thetaPrime = platform.thetaPrime || platform.theta;
        objects.push(obj);
      });
    }
    if (data.decorations) {
      data.decorations.forEach(decoration => {
        let obj = new LevelObject(
          decoration.type,
          decoration.r,
          decoration.theta,
          decoration.height,
          decoration.width
        );
        objects.push(obj);
      });
    }
    if (data.playerSpawns) {
      data.playerSpawns.forEach(spawn => {
        let obj = new LevelObject(
          'player-spawn',
          spawn.r,
          spawn.theta,
          1,
          1
        );
        objects.push(obj);
      })
    }
    if (data.itemSpawns) {
      data.itemSpawns.forEach(spawn => {
        let obj = new LevelObject(
          'item-spawn',
          spawn.r,
          spawn.theta,
          1,
          1
        );
        obj.rate = spawn.rate;
        obj.itemType = spawn.type;
        objects.push(obj);
      })
    }
    if (data.waves) {
      waves = data.waves;
    }
  }
  reader.readAsText(fileInput.files[0]);
});

elem('save').addEventListener('click', () => {
  objects = objects.filter(obj => obj.r > 0).sort((a, b) => {
    return a.r - b.r || a.theta - b.theta;
  });
  let data = {
    playerSpawns: objects.filter(obj => {
      return obj.type === 'player-spawn';
    }).map(obj => {
      return {
        r: Math.round(obj.r),
        theta: Math.round(obj.theta * 1000) / 1000,
      };
    }),
    itemSpawns: objects.filter(obj => {
      return obj.type === 'item-spawn';
    }).map(obj => {
      return {
        r: Math.round(obj.r),
        theta: Math.round(obj.theta * 1000) / 1000,
        rate: Math.round(obj.rate),
        type: obj.itemType,
      };
    }),
    blocks: objects.filter(obj => {
      return obj.type === 'grass' || obj.type === 'stone';
    }).map(obj => {
      return {
        r: Math.round(obj.r),
        theta: Math.round(obj.theta * 1000) / 1000,
        height: Math.round(obj.height),
        width: Math.round(obj.width * 1000) / 1000,
        type: obj.type,
      };
    }),
    platforms: objects.filter(obj => obj.type === 'platform').map(obj => {
      let ret = {
        r: Math.round(obj.r),
        theta: Math.round(obj.theta * 1000) / 1000,
        height: Math.round(obj.height),
        width: Math.round(obj.width * 1000) / 1000,
        moves: obj.moves,
      };
      if (obj.moves) {
        ret['rate'] = Math.round(obj.rate);
        ret['rPrime'] = Math.round(obj.rPrime);
        ret['thetaPrime'] = Math.round(obj.thetaPrime * 1000) / 1000;
      }
      return ret;
    }),
    decorations: objects.filter(obj => obj.type === 'underground').map(obj => {
      return {
        r: Math.round(obj.r),
        theta: Math.round(obj.theta * 1000) / 1000,
        height: Math.round(obj.height),
        width: Math.round(obj.width * 1000) / 1000,
        type: obj.type,
      };
    }),
    waves: waves
  }
  let dataString = JSON.stringify(data, null, 2);
  let anchor = document.createElement('a');
  let file = new Blob([dataString], {type: 'text/json'});
  let url = URL.createObjectURL(file);
  anchor.href = url;
  anchor['download'] = 'level.json';
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 0);
});
