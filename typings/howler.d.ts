// Type definitions for howler.js v2.0.0
// Project: https://github.com/goldfire/howler.js

/**
 * Global Howler object, used to set config options and other global
 * properties.
 */
declare class Howler {
  // Global properties
  static usingWebAudio: boolean;
  static noAudio: boolean;
  static mobileAutoEnable: boolean;
  static autoSuspend: boolean;
  static ctx: AudioContext;
  static masterGain: GainNode;
  // Global core methods
  static mute(muted: boolean): Howler;
  static volume(): number;
  static volume(volume?: number): Howler;
  static codecs(extension: string): boolean;
  static unload(): Howler;
  // Global spatial plugin methods
  static stereo(pan: number): Howler;
  static pos(x?: number, y?: number, z?: number): Howler|number[];
  static orientation(x?: number, y?: number, z?: number,
                     xUp?: number, yUp?: number, zUp?: number): Howler|number[];
}

/**
 * Passed to constructor of Howl within an IHowlProperties object.
 */
declare interface IHowlSoundSpriteDefinition {
  [name: string]: number[];
}

/**
 * Panner attributes used for the Howl spatial plugin.
 */
declare interface IHowlPannerAttr {
  coneInnerAngle?: number;
  coneOuterAngle?: number;
  coneOuterGain?: number;
  distanceModel?: string;
  maxDistance?: number;
  panningModel?: string;
  refDistance?: number;
  rolloffFactor?: number;
}

/**
 * Options passed to the constructor of a Howl object.
 */
declare interface IHowlProperties {
  // Required properties
  src: string[];
  // Optional core properties
  volume?: number;
  html5?: boolean;
  loop?: boolean;
  preload?: boolean;
  autoplay?: boolean;
  mute?: boolean;
  sprite?: IHowlSoundSpriteDefinition;
  rate?: number;
  pool?: number;
  format?: string[];
  onload?: Function;
  onloaderror?: Function;
  onplay?: Function;
  onend?: Function;
  onpause?: Function;
  onstop?: Function;
  onmute?: Function;
  onvolume?: Function;
  onrate?: Function;
  onseek?: Function;
  onfade?: Function;
  // Optional spatial plugin properties
  orientation?: number[];
  stereo?: number;
  pos?: number[];
  pannerAttr?: IHowlPannerAttr;
  onstereo?: Function;
  onpos?: Function;
  onorientation?: Function;
}

/**
 * A group of sounds using the same audio source files. Construct instances
 * with new Howl({ options here... });
 */
declare class Howl {
  // Constructor where properties are set
  constructor(props: IHowlProperties);
  // Howl core methods
  play(sprite_or_id?: string|number): number;
  pause(id?: number): Howl;
  stop(id?: number): Howl;
  mute(muted?: boolean, id?: number): Howl;
  volume(id?: number): number;
  volume(volume: number, id?: number): Howl;
  fade(from: number, to: number, duration: number, id?: number): Howl;
  rate(id?: number): number;
  rate(rate?: number, id?: number): Howl;
  seek(id?: number): number;
  seek(seek?: number, id?: number): Howl;
  loop(id?: number): boolean;
  loop(loop?: boolean, id?: number): Howl;
  state(): string;
  playing(id?: number): boolean;
  duration(id?: number): number;
  on(event: string, callback: Function, id?: number): Howl;
  once(event: string, callback: Function, id?: number): Howl;
  off(event?: string, callback?: Function, id?: number): Howl;
  load(): Howl;
  unload(): Howl;
  // Howl spatial plugin methods
  stereo(pan?: number, id?: number): Howl|number;
  pos(x?: number, y?: number, z?: number): Howl|number;
  orientation(x?: number, y?: number, z?: number, id?: number): Howl|number[];
  pannerAttr(id?: number): IHowlPannerAttr;
  pannerAttr(attr?: IHowlPannerAttr, id?: number): Howl;
}
