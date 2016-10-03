import { Polar } from '../math/polar';
import { KeyState } from '../input/keystate';
import { MouseState } from '../input/mousestate';

let canvas = <HTMLCanvasElement>document.getElementById('canvas');
let rUpdateElem = <HTMLInputElement>document.getElementById('r-update');
let thetaUpdateElem = <HTMLInputElement>document.getElementById('theta-update');
let heightUpdateElem = <HTMLInputElement>document.getElementById('height-update');
let widthUpdateElem = <HTMLInputElement>document.getElementById('width-update');
let rAddElem = <HTMLInputElement>document.getElementById('r-add');
let thetaAddElem = <HTMLInputElement>document.getElementById('theta-add');
let heightAddElem = <HTMLInputElement>document.getElementById('height-add');
let widthAddElem = <HTMLInputElement>document.getElementById('width-add');

function getAdd(): Polar.Rect {
  return new Polar.Rect(
    parseFloat(rAddElem.value),
    parseFloat(thetaAddElem.value),
    parseFloat(heightAddElem.value),
    parseFloat(widthAddElem.value)
  );
}

function getUpdate(): Polar.Rect {
  return new Polar.Rect(
    parseFloat(rUpdateElem.value),
    parseFloat(thetaUpdateElem.value),
    parseFloat(heightUpdateElem.value),
    parseFloat(widthUpdateElem.value)
  );
}

function setAdd(rect: Polar.Rect): void {
  rAddElem.value = rect.r.toString();
  thetaAddElem.value = rect.theta.toString();
  heightAddElem.value = rect.height.toString();
  widthAddElem.value = rect.width.toString();
}

function setUpdate(rect: Polar.Rect): void {
  rUpdateElem.value = rect.r.toString();
  thetaUpdateElem.value = rect.theta.toString();
  heightUpdateElem.value = rect.height.toString();
  widthUpdateElem.value = rect.width.toString();
}

function addEventListeners(elem: HTMLElement,
                           types: string[],
                           callback: (e: Event) => void) {
  types.forEach(type => elem.addEventListener(type, callback));
}

let numberInputEvents = ['change', 'input'];
addEventListeners(rUpdateElem, numberInputEvents, (e: Event) => {
  if (selectedRect) {
    selectedRect.r = parseFloat(rUpdateElem.value);
  }
});

addEventListeners(thetaUpdateElem, numberInputEvents, (e: Event) => {
  if (selectedRect) {
    selectedRect.theta = parseFloat(thetaUpdateElem.value);
  }
});

addEventListeners(heightUpdateElem, numberInputEvents, (e: Event) => {
  if (selectedRect) {
    selectedRect.height = parseFloat(heightUpdateElem.value);
  }
});

addEventListeners(widthUpdateElem, numberInputEvents, (e: Event) => {
  if (selectedRect) {
    selectedRect.width = parseFloat(widthUpdateElem.value);
  }
});

let rects: Polar.Rect[] = [
  new Polar.Rect(250, 0, 250, Math.PI * 2),
  new Polar.Rect(300, 0, 50, Math.PI * 0.5),
];

let selectedRect: Polar.Rect = null;

let mouseState = new MouseState();
let keyState = new KeyState();
mouseState.addListeners(canvas);
keyState.addListeners(canvas);

function getScale(): number {
  let maxR = 0;
  rects.forEach(rect => {
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
    selectedRect = null;
    rects.forEach(rect => {
      if (rect.contains(mousePos)) {
        selectedRect = rect;
        setUpdate(rect);
      }
    });
  }
  if (keyState.isPressed('Backspace')) {
    rects = rects.filter(rect => rect !== selectedRect);
    selectedRect = null;
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
  rects.forEach(rect => {
    let drawRadius = rect.r - (rect.height / 2);
    if (drawRadius < 0) {
      drawRadius = rect.r / 2;
      ctx.lineWidth = drawRadius * 2;
    } else {
      ctx.lineWidth = rect.height;
    }
    ctx.strokeStyle = selectedRect === rect ? 'orange' : (rect.contains(mousePos) ? 'yellow' : 'gray');
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
  rects.push(rect);
  selectedRect = rect;
});

let loadButton = <HTMLInputElement>document.getElementById('load');
loadButton.addEventListener('click', () => {
  let fileInput = <HTMLInputElement>document.getElementById('file');
  if (fileInput.files.length <= 0) {
    return;
  }
  let reader = new FileReader();
  rects = [];
  selectedRect = null;
  reader.onload = () => {
    let dataString: string = reader.result;
    let data = JSON.parse(dataString);
    rects = [];
    data.blocks.forEach(block => {
      rects.push(new Polar.Rect(
        block.r,
        block.theta,
        block.height,
        block.width
      ));
    });
  }
  reader.readAsText(fileInput.files[0]);
});

let saveButton = <HTMLInputElement>document.getElementById('save');
saveButton.addEventListener('click', () => {
  let data = {
    blocks: rects.map(rect => {
      return {
        r: rect.r,
        theta: rect.theta,
        height: rect.height,
        width: rect.width,
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
