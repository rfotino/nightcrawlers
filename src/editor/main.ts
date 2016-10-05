import { Polar } from '../math/polar';
import { KeyState } from '../input/keystate';
import { MouseState } from '../input/mousestate';

let canvas = <HTMLCanvasElement>document.getElementById('canvas');
let rUpdateElem = <HTMLInputElement>document.getElementById('r-update');
let thetaUpdateElem = <HTMLInputElement>document.getElementById('theta-update');
let heightUpdateElem = <HTMLInputElement>document.getElementById('height-update');
let widthUpdateElem = <HTMLInputElement>document.getElementById('width-update');
let typeUpdateElem = <HTMLInputElement>document.getElementById('type-update');
let rAddElem = <HTMLInputElement>document.getElementById('r-add');
let thetaAddElem = <HTMLInputElement>document.getElementById('theta-add');
let heightAddElem = <HTMLInputElement>document.getElementById('height-add');
let widthAddElem = <HTMLInputElement>document.getElementById('width-add');
let typeAddElem = <HTMLInputElement>document.getElementById('type-add');

class LevelObject extends Polar.Rect {
  public type: string;
  public constructor(r: number, theta: number, height: number, width: number, type: string) {
    super(r, theta, height, width);
    this.type = type;
  }
}

function getAdd(): LevelObject {
  let obj = new LevelObject(
    parseFloat(rAddElem.value),
    parseFloat(thetaAddElem.value),
    parseFloat(heightAddElem.value),
    parseFloat(widthAddElem.value),
    typeAddElem.value
  );
  return obj;
}

function setUpdate(rect: LevelObject): void {
  rUpdateElem.value = rect.r.toString();
  thetaUpdateElem.value = rect.theta.toString();
  heightUpdateElem.value = rect.height.toString();
  widthUpdateElem.value = rect.width.toString();
  typeUpdateElem.value = rect.type;
}

function addEventListeners(elem: HTMLElement,
                           types: string[],
                           callback: (e: Event) => void) {
  types.forEach(type => elem.addEventListener(type, callback));
}

let numberInputEvents = ['change', 'input'];
addEventListeners(rUpdateElem, numberInputEvents, (e: Event) => {
  if (selectedObj) {
    selectedObj.r = parseFloat(rUpdateElem.value);
  }
});

addEventListeners(thetaUpdateElem, numberInputEvents, (e: Event) => {
  if (selectedObj) {
    selectedObj.theta = parseFloat(thetaUpdateElem.value);
  }
});

addEventListeners(heightUpdateElem, numberInputEvents, (e: Event) => {
  if (selectedObj) {
    selectedObj.height = parseFloat(heightUpdateElem.value);
  }
});

addEventListeners(widthUpdateElem, numberInputEvents, (e: Event) => {
  if (selectedObj) {
    selectedObj.width = parseFloat(widthUpdateElem.value);
  }
});

addEventListeners(typeUpdateElem, ['change'], (e: Event) => {
  if (selectedObj) {
    selectedObj.type = typeUpdateElem.value;
  }
})

let objects: LevelObject[] = [
  new LevelObject(250, 0, 250, Math.PI * 2, 'stone'),
  new LevelObject(300, 0, 50, Math.PI * 1.5, 'stone'),
  new LevelObject(300, -Math.PI * 0.5, 50, Math.PI * 0.5, 'underground'),
  new LevelObject(350, Math.PI * 0.5, 50, Math.PI * 0.5, 'grass'),
  new LevelObject(400, 0, 10, Math.PI * 0.5, 'platform'),
];

let selectedObj: LevelObject = null;

let mouseState = new MouseState();
let keyState = new KeyState();
mouseState.addListeners(canvas);
keyState.addListeners(canvas);

function getScale(): number {
  let maxR = 0;
  objects.forEach(rect => {
    maxR = Math.max(maxR, rect.r);
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
  if (mouseState.isClicked(MouseState.LEFT)) {
    selectedObj = null;
    objects.forEach(rect => {
      if (rect.contains(mousePos)) {
        selectedObj = rect;
        setUpdate(rect);
      }
    });
  }
  if (keyState.isPressed(KeyState.BACKSPACE)) {
    objects = objects.filter(rect => rect !== selectedObj);
    selectedObj = null;
  }
}

function draw(): void {
  let scale = getScale();
  let mousePos = getMousePos();
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(scale, scale);
  objects.forEach(rect => {
    let drawRadius = rect.r - (rect.height / 2);
    if (drawRadius < 0) {
      drawRadius = rect.r / 2;
      ctx.lineWidth = drawRadius * 2;
    } else {
      ctx.lineWidth = rect.height;
    }
    if (selectedObj === rect) {
      ctx.strokeStyle = 'orange';
    } else if (rect.contains(mousePos)) {
      ctx.strokeStyle = 'yellow';
    } else if (rect.type === 'platform') {
      ctx.strokeStyle = 'rgb(200, 200, 230)';
    } else if (rect.type === 'grass') {
      ctx.strokeStyle = 'rgb(50, 255, 100)';
    } else if (rect.type === 'stone') {
      ctx.strokeStyle = 'rgb(150, 150, 150)';
    } else if (rect.type === 'underground') {
      ctx.strokeStyle = 'rgb(100, 100, 100)';
    }
    ctx.beginPath();
    ctx.arc(0, 0, drawRadius, rect.theta, rect.theta + rect.width);
    ctx.stroke();
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

let addButton = <HTMLInputElement>document.getElementById('add');
addButton.addEventListener('click', () => {
  let rect = getAdd();
  objects.push(rect);
  selectedObj = rect;
  setUpdate(rect);
});

let loadButton = <HTMLInputElement>document.getElementById('load');
loadButton.addEventListener('click', () => {
  let fileInput = <HTMLInputElement>document.getElementById('file');
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
          block.r,
          block.theta,
          block.height,
          block.width,
          block.type || 'stone'
        );
        objects.push(obj);
      });
    }
    if (data.platforms) {
      data.platforms.forEach(platform => {
        let obj = new LevelObject(
          platform.r,
          platform.theta,
          platform.height,
          platform.width,
          'platform'
        );
        objects.push(obj);
      });
    }
    if (data.decorations) {
      data.decorations.forEach(decoration => {
        let obj = new LevelObject(
          decoration.r,
          decoration.theta,
          decoration.height,
          decoration.width,
          decoration.type
        );
        objects.push(obj);
      });
    }
  }
  reader.readAsText(fileInput.files[0]);
});

let saveButton = <HTMLInputElement>document.getElementById('save');
saveButton.addEventListener('click', () => {
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
    platforms: objects.filter(obj => obj.type === 'platform').map(rect => {
      return {
        r: rect.r,
        theta: rect.theta,
        height: rect.height,
        width: rect.width,
      };
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
