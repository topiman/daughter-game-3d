// 家具交互系统
import { BlockType } from '../data/items';
import { CONFIG } from '../data/config';
import { TimeSystem } from './TimeSystem';

export interface InteractResult {
  success: boolean;
  message: string;
  action?: 'skip_night' | 'rest' | 'toilet';
}

export class FurnitureSystem {
  sofaEndTime = 0; // 沙发减缓饥饿效果结束时间

  interact(blockType: BlockType, player: { hp: number; hunger: number }, time: { isNight: boolean }): InteractResult {
    switch (blockType) {
      case BlockType.BED:
        return this.interactBed(player, time);
      case BlockType.SOFA:
        return this.interactSofa(player);
      case BlockType.TOILET:
        return this.interactToilet();
      default:
        return { success: false, message: '无法交互' };
    }
  }

  private interactBed(player: { hp: number; hunger: number }, time: { isNight: boolean }): InteractResult {
    if (!time.isNight) {
      return { success: false, message: '☀️ 白天不能睡觉哦！' };
    }
    // 恢复 HP
    player.hp = Math.min(CONFIG.MAX_HP, player.hp + CONFIG.BED_HP_RESTORE);
    return { success: true, message: '💤 美美地睡了一觉，恢复了体力！', action: 'skip_night' };
  }

  private interactSofa(player: { hp: number; hunger: number }): InteractResult {
    this.sofaEndTime = performance.now() / 1000 + CONFIG.SOFA_HUNGER_SLOW_DURATION;
    return { success: true, message: '🛋️ 坐在沙发上休息，饥饿消耗减缓！', action: 'rest' };
  }

  private interactToilet(): InteractResult {
    return { success: true, message: '🚽 咕噜咕噜～', action: 'toilet' };
  }

  // 检查沙发减缓效果是否激活
  isSofaActive(): boolean {
    return performance.now() / 1000 < this.sofaEndTime;
  }

  getHungerRate(): number {
    return this.isSofaActive() ? CONFIG.SOFA_HUNGER_SLOW_RATE : 1.0;
  }
}
