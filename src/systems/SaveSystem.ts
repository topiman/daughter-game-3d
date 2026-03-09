// 存档系统 — localStorage 差量存储
import { CONFIG } from '../data/config';

export interface SaveData {
  version: number;
  player: { x: number; y: number; z: number; hp: number; hunger: number; kills: number; daysSurvived: number };
  inventory: { slots: Array<{ itemId: string; count: number } | null> };
  time: { elapsed: number; gameDay: number };
  world: { changes: Array<{ x: number; y: number; z: number; blockType: number }> };
  dog: { owned: boolean };
  storages: Record<string, Array<{ itemId: string; count: number } | null>>;
}

const STORAGE_KEY = 'daughter-game-3d-save';
const SAVE_VERSION = 1;

export class SaveSystem {
  private autoSaveTimer = 0;

  save(data: SaveData): void {
    try {
      data.version = SAVE_VERSION;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('存档失败:', e);
    }
  }

  load(): SaveData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as SaveData;
      if (!data || typeof data.version !== 'number') return null;
      return data;
    } catch (e) {
      console.warn('读档失败（数据损坏）:', e);
      return null;
    }
  }

  hasSave(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  deleteSave(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  // 自动存档逻辑，在 game loop 中调用
  updateAutoSave(dt: number, getDataFn: () => SaveData): boolean {
    this.autoSaveTimer += dt;
    if (this.autoSaveTimer >= CONFIG.AUTOSAVE_INTERVAL) {
      this.autoSaveTimer = 0;
      this.save(getDataFn());
      return true;
    }
    return false;
  }
}
