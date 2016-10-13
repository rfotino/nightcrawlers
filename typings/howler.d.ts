// Type definitions for howler.js v2.0.0
// Project: https://github.com/goldfire/howler.js

declare class Howler {
  iOSAutoEnable: boolean;
  mute(muted: boolean): Howler;
  volume(): number;
  volume(volume: number): Howler;
  codecs(extension: string): boolean;
}

declare interface IHowlSoundSpriteDefinition {
  [name: string]: number[];
}

declare interface IHowlProperties {
  autoplay?: boolean;
  html5?: boolean;
  format?: string;
  loop?: boolean;
  sprite?: IHowlSoundSpriteDefinition;
  volume?: number;
  src?: string[];
  onend?: Function;
  onload?: Function;
  onloaderror?: Function;
  onpause?: Function;
  onplay?: Function;
}

declare class Howl {
  autoplay: boolean;
  html5: boolean;
  format: string;
  rate: number;
  model: string;
  onend: Function;
  onload: Function;
  onloaderror: Function;
  onpause: Function;
  onplay: Function;
  constructor(props: IHowlProperties);
  load(): Howl;
  play(soundId: number): number;
  play(sprite?: string): number;
  pause(soundId?: number): Howl;
  stop(soundId?: number): Howl;
  mute(muted: boolean, soundId?: number): Howl;
  fade(from: number, to: number, duration: number, soundId?: number): Howl;
  loop(): boolean;
  loop(loop: boolean): Howl;
  seek(position?: number, soundId?: number): number;
  pos3d(x: number, y: number, z: number, soundId?: number): any;
  sprite(definition?: IHowlSoundSpriteDefinition): IHowlSoundSpriteDefinition;
  volume(): number;
  volume(volume?: number, soundId?: number): Howl;
  src(): string[];
  src(urls: string[]): Howl;
  on(event: string, listener?: Function): Howl;
  off(event: string, listener?: Function): Howl;
  unload(): void;
}
