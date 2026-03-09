// 生存系统 — 饥饿/血量
import { CONFIG } from '../data/config';
import { Player } from '../entities/Player';
import { TimeSystem } from './TimeSystem';

export class SurvivalSystem {
  update(_dt: number, player: Player, time: TimeSystem): void {
    if (time.isNewDay()) {
      // 饥饿消耗
      player.hunger = Math.max(0, player.hunger - CONFIG.HUNGER_PER_DAY);
      player.daysSurvived = time.gameDay - 1;

      // 饥饿归零掉血
      if (player.hunger <= 0) {
        player.takeDamage(CONFIG.HUNGER_ZERO_HP_LOSS);
      }

      // 自然恢复
      if (player.hunger > CONFIG.NATURAL_HEAL_THRESHOLD) {
        player.hp = Math.min(CONFIG.MAX_HP, player.hp + CONFIG.NATURAL_HEAL_HP);
      }
    }
  }
}
