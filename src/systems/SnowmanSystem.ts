// 雪人系统 — 放置条件 + 融化追踪
import { CONFIG } from '../data/config';

export interface SnowmanEntry {
  x: number;
  y: number;
  z: number;
  meltTimer: number;
}

export interface SnowmanTracker {
  addSnowman(x: number, y: number, z: number): void;
  removeSnowman(x: number, y: number, z: number): void;
  update(dt: number, weather: string): void;
  getAll(): SnowmanEntry[];
  getMelted(): { x: number; y: number; z: number }[];
  clearMelted(): void;
}

export function canPlaceSnowman(weather: string): boolean {
  return weather === 'snow';
}

export function createSnowmanTracker(): SnowmanTracker {
  let snowmen: SnowmanEntry[] = [];
  let melted: { x: number; y: number; z: number }[] = [];

  return {
    addSnowman(x: number, y: number, z: number) {
      snowmen.push({ x, y, z, meltTimer: CONFIG.SNOWMAN_MELT_TIME });
    },

    removeSnowman(x: number, y: number, z: number) {
      snowmen = snowmen.filter(s => !(s.x === x && s.y === y && s.z === z));
    },

    update(dt: number, weather: string) {
      if (weather === 'snow') return; // 下雪天不融化

      const stillAlive: SnowmanEntry[] = [];
      for (const s of snowmen) {
        s.meltTimer -= dt;
        if (s.meltTimer <= 0) {
          melted.push({ x: s.x, y: s.y, z: s.z });
        } else {
          stillAlive.push(s);
        }
      }
      snowmen = stillAlive;
    },

    getAll() {
      return [...snowmen];
    },

    getMelted() {
      return [...melted];
    },

    clearMelted() {
      melted = [];
    },
  };
}
