import { Polar } from '../math/polar';
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
  public frame: number;
  public framesUp: boolean;

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
    this.frame = 0;
    this.framesUp = true;
  }

  public toRect(): Polar.Rect {
    let anim = (this.frame / Math.max(this.rate, 1));
    let r = (this.r * (1 - anim)) + (this.rPrime * anim);
    let theta = (this.theta * (1 - anim)) + (this.thetaPrime * anim);
    return new Polar.Rect(r, theta, this.height, this.width);
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

let mouseState = new MouseState();
let keyState = new KeyState();
mouseState.addListeners(canvas);
keyState.addListeners(canvas);

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
  if (!addingObj && mouseState.isDown(MouseState.LEFT)) {
    selectedObj = null;
    objects.forEach(obj => {
      if (obj.toRect().contains(mousePos)) {
        selectedObj = obj;
        setFields(obj);
      }
    });
  }
  if (keyState.isPressed(KeyState.BACKSPACE)) {
    objects = objects.filter(rect => rect !== selectedObj);
    selectedObj = null;
  }
  // Update whether we're adding an object or not
  if (!addingObj && !selectedObj && mouseState.isDown(MouseState.LEFT)) {
    addingObj = new LevelObject(
      elem('type-new').value,
      Math.round(mousePos.r / 10) * 10,
      Math.round(mousePos.theta / 0.025) * 0.025,
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
      addingObj.height = Math.round(height / 10) * 10;
      addingObj.width = Math.round(width / 0.025) * 0.025;
      setFields(addingObj);
    } else {
      if (addingObj.r > 0 && addingObj.height > 0 && addingObj.width > 0) {
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

function draw(): void {
  let scale = getScale();
  let mousePos = getMousePos();
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(scale, scale);
  let drawables = addingObj ? objects.concat(addingObj) : objects;
  drawables.forEach(obj => {
    if (selectedObj === obj) {
      ctx.strokeStyle = 'orange';
    } else if (obj.toRect().contains(mousePos) && !addingObj) {
      ctx.strokeStyle = 'yellow';
    } else if (obj.type === 'platform') {
      ctx.strokeStyle = 'rgb(200, 200, 230)';
    } else if (obj.type === 'grass') {
      ctx.strokeStyle = 'rgb(50, 255, 100)';
    } else if (obj.type === 'stone') {
      ctx.strokeStyle = 'rgb(150, 150, 150)';
    } else if (obj.type === 'underground') {
      ctx.strokeStyle = 'rgb(100, 100, 100)';
    }
    let rect = obj.toRect();
    let drawRadius = rect.r - (rect.height / 2);
    if (drawRadius > 0 && rect.height > 0) {
      ctx.lineWidth = rect.height;
      ctx.beginPath();
      ctx.arc(0, 0, drawRadius, rect.theta, rect.theta + rect.width);
      ctx.stroke();
    }
  });
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
  }
  reader.readAsText(fileInput.files[0]);
});

elem('save').addEventListener('click', () => {
  objects = objects.filter(obj => obj.r > 0).sort((a, b) => a.r - b.r);
  let data = {
    blocks: objects.filter(obj => {
      return obj.type === 'grass' || obj.type === 'stone';
    }).map(rect => {
      return {
        r: rect.r,
        theta: rect.theta,
        height: rect.height,
        width: rect.width,
        type: rect.type,
      };
    }),
    platforms: objects.filter(obj => obj.type === 'platform').map(obj => {
      let ret = {
        r: obj.r,
        theta: obj.theta,
        height: obj.height,
        width: obj.width,
        moves: obj.moves,
      };
      if (obj.moves) {
        ret['rate'] = obj.rate;
        ret['rPrime'] = obj.rPrime;
        ret['thetaPrime'] = obj.thetaPrime;
      }
      return ret;
    }),
    decorations: objects.filter(obj => obj.type === 'underground').map(rect => {
      return {
        r: rect.r,
        theta: rect.theta,
        height: rect.height,
        width: rect.width,
        type: rect.type,
      };
    }),
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
