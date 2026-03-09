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

  interact(blockType: BlockType, player: { hp: number; hunger: number }, time: { isNight: boolean }, hasPillow = false): InteractResult {
    switch (blockType) {
      case BlockType.BED:
        return this.interactBed(player, time, hasPillow);
      case BlockType.SOFA:
        return this.interactSofa(player, hasPillow);
      case BlockType.TOILET:
        return this.interactToilet();
      default:
        return { success: false, message: '无法交互' };
    }
  }

  private interactBed(player: { hp: number; hunger: number }, time: { isNight: boolean }, hasPillow = false): InteractResult {
    if (!time.isNight) {
      return { success: false, message: '☀️ 白天不能睡觉哦！' };
    }
    // 恢复 HP（有抱枕增强）
    const restore = hasPillow ? CONFIG.PILLOW_BED_BOOST : CONFIG.BED_HP_RESTORE;
    player.hp = Math.min(CONFIG.MAX_HP, player.hp + restore);
    const msg = hasPillow ? '💤 抱着抱枕睡得好香，恢复了更多体力！' : '💤 美美地睡了一觉，恢复了体力！';
    return { success: true, message: msg, action: 'skip_night' };
  }

  private interactSofa(player: { hp: number; hunger: number }, hasPillow = false): InteractResult {
    this.sofaEndTime = performance.now() / 1000 + CONFIG.SOFA_HUNGER_SLOW_DURATION;
    if (hasPillow) {
      this.sofaRate = CONFIG.PILLOW_SOFA_BOOST;
    } else {
      this.sofaRate = CONFIG.SOFA_HUNGER_SLOW_RATE;
    }
    const msg = hasPillow ? '🛋️ 抱着抱枕坐沙发，饥饿消耗大幅减缓！' : '🛋️ 坐在沙发上休息，饥饿消耗减缓！';
    return { success: true, message: msg, action: 'rest' };
  }

  private sofaRate = CONFIG.SOFA_HUNGER_SLOW_RATE;

  private interactToilet(): InteractResult {
    return { success: true, message: '🚽 咕噜咕噜～', action: 'toilet' };
  }

  // 检查沙发减缓效果是否激活
  isSofaActive(): boolean {
    return performance.now() / 1000 < this.sofaEndTime;
  }

  getHungerRate(): number {
    return this.isSofaActive() ? this.sofaRate : 1.0;
  }
}
