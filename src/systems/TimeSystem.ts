// 昼夜循环系统
import { CONFIG } from '../data/config';

export class TimeSystem {
  private elapsedTime = 0; // 秒
  get elapsed(): number { return this.elapsedTime; }
  set elapsed(v: number) { this.elapsedTime = v; }
  gameHour = 8; // 开始于早上8点
  gameDay = 1;
  isNight = false;

  update(dt: number): void {
    this.elapsedTime += dt;

    // 计算游戏内时间
    // 1游戏天 = DAY_DURATION 秒
    const totalGameSeconds = this.elapsedTime;
    const dayFraction = (totalGameSeconds % CONFIG.DAY_DURATION) / CONFIG.DAY_DURATION;
    
    // dayFraction 0 = 游戏开始（早上8点），映射到24小时制
    // 初始偏移：8/24 = 0.333
    const timeOfDay = (dayFraction + 8 / 24) % 1;
    
    this.gameHour = timeOfDay * 24;
    this.gameDay = 1 + Math.floor(totalGameSeconds / CONFIG.DAY_DURATION);
    
    // 夜晚 18:00 - 06:00
    this.isNight = this.gameHour >= 18 || this.gameHour < 6;
  }

  // 返回 0-1 的时间（用于渲染器光照）
  getTimeOfDay(): number {
    return (this.gameHour / 24);
  }

  getFormattedTime(): string {
    const h = Math.floor(this.gameHour);
    const m = Math.floor((this.gameHour % 1) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  // 检查是否刚进入新的一天（用于饥饿消耗等）
  private lastCheckedDay = 1;
  isNewDay(): boolean {
    if (this.gameDay > this.lastCheckedDay) {
      this.lastCheckedDay = this.gameDay;
      return true;
    }
    return false;
  }
}
