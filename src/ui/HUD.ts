// HUD — HTML overlay
import { CONFIG } from '../data/config';
import { Player } from '../entities/Player';
import { InventorySystem } from '../systems/InventorySystem';
import { TimeSystem } from '../systems/TimeSystem';
import { getCategoryColor, ItemCategory } from '../data/items';

export class HUD {
  private container: HTMLDivElement;
  private hpBar: HTMLDivElement;
  private hpFill: HTMLDivElement;
  private hungerBar: HTMLDivElement;
  private hungerFill: HTMLDivElement;
  private timeDisplay: HTMLDivElement;
  private dayDisplay: HTMLDivElement;
  private crosshair: HTMLDivElement;
  private hotbar: HTMLDivElement;
  private hotbarSlots: HTMLDivElement[] = [];
  private messageDisplay: HTMLDivElement;
  private messageTimeout: number | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'hud';
    this.container.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 10; font-family: 'Courier New', monospace;
    `;
    document.body.appendChild(this.container);

    // 血条
    const hpContainer = document.createElement('div');
    hpContainer.style.cssText = `
      position: absolute; top: 20px; left: 20px; width: 200px;
    `;
    hpContainer.innerHTML = '<div style="color: #FF6666; font-size: 14px; margin-bottom: 4px;">❤️ HP</div>';
    this.hpBar = document.createElement('div');
    this.hpBar.style.cssText = `
      width: 200px; height: 16px; background: #333; border-radius: 3px; overflow: hidden;
    `;
    this.hpFill = document.createElement('div');
    this.hpFill.style.cssText = `
      width: 100%; height: 100%; background: linear-gradient(90deg, #FF4444, #FF6666);
      transition: width 0.3s;
    `;
    this.hpBar.appendChild(this.hpFill);
    hpContainer.appendChild(this.hpBar);
    this.container.appendChild(hpContainer);

    // 饥饿条
    const hungerContainer = document.createElement('div');
    hungerContainer.style.cssText = `
      position: absolute; top: 60px; left: 20px; width: 200px;
    `;
    hungerContainer.innerHTML = '<div style="color: #FFAA44; font-size: 14px; margin-bottom: 4px;">🍖 饥饿</div>';
    this.hungerBar = document.createElement('div');
    this.hungerBar.style.cssText = `
      width: 200px; height: 16px; background: #333; border-radius: 3px; overflow: hidden;
    `;
    this.hungerFill = document.createElement('div');
    this.hungerFill.style.cssText = `
      width: 100%; height: 100%; background: linear-gradient(90deg, #CC8800, #FFAA44);
      transition: width 0.3s;
    `;
    this.hungerBar.appendChild(this.hungerFill);
    hungerContainer.appendChild(this.hungerBar);
    this.container.appendChild(hungerContainer);

    // 时钟
    this.timeDisplay = document.createElement('div');
    this.timeDisplay.style.cssText = `
      position: absolute; top: 20px; right: 20px; color: white; font-size: 20px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    `;
    this.container.appendChild(this.timeDisplay);

    // 天数
    this.dayDisplay = document.createElement('div');
    this.dayDisplay.style.cssText = `
      position: absolute; top: 48px; right: 20px; color: white; font-size: 16px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    `;
    this.container.appendChild(this.dayDisplay);

    // 准星
    this.crosshair = document.createElement('div');
    this.crosshair.style.cssText = `
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      color: white; font-size: 24px; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
      user-select: none;
    `;
    this.crosshair.textContent = '+';
    this.container.appendChild(this.crosshair);

    // 物品栏
    this.hotbar = document.createElement('div');
    this.hotbar.style.cssText = `
      position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 4px;
    `;
    
    for (let i = 0; i < CONFIG.HOTBAR_SIZE; i++) {
      const slot = document.createElement('div');
      slot.style.cssText = `
        width: 50px; height: 50px; background: rgba(0,0,0,0.6);
        border: 2px solid #555; border-radius: 4px; position: relative;
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 11px; text-align: center;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
      `;
      // 快捷键编号
      const num = document.createElement('div');
      num.style.cssText = `
        position: absolute; top: 1px; left: 3px; font-size: 10px; color: #aaa;
      `;
      num.textContent = String(i + 1);
      slot.appendChild(num);
      
      this.hotbarSlots.push(slot);
      this.hotbar.appendChild(slot);
    }
    this.container.appendChild(this.hotbar);

    // 消息显示
    this.messageDisplay = document.createElement('div');
    this.messageDisplay.style.cssText = `
      position: absolute; top: 40%; left: 50%; transform: translateX(-50%);
      color: white; font-size: 18px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
      opacity: 0; transition: opacity 0.5s; white-space: nowrap;
    `;
    this.container.appendChild(this.messageDisplay);
  }

  update(player: Player, inventory: InventorySystem, time: TimeSystem): void {
    // 血条
    const hpPercent = (player.hp / CONFIG.MAX_HP) * 100;
    this.hpFill.style.width = hpPercent + '%';
    
    // 饥饿条
    const hungerPercent = (player.hunger / CONFIG.MAX_HUNGER) * 100;
    this.hungerFill.style.width = hungerPercent + '%';
    
    // 时钟
    this.timeDisplay.textContent = '🕐 ' + time.getFormattedTime();
    this.dayDisplay.textContent = `第 ${time.gameDay} 天`;

    // 物品栏
    for (let i = 0; i < CONFIG.HOTBAR_SIZE; i++) {
      const slot = this.hotbarSlots[i];
      const invSlot = inventory.slots[i];
      
      // 选中高亮
      if (i === inventory.selectedIndex) {
        slot.style.border = '2px solid #FFF';
        slot.style.background = 'rgba(255,255,255,0.2)';
      } else {
        const borderColor = invSlot.item ? getCategoryColor(invSlot.item.category) : '#555';
        slot.style.border = `2px solid ${borderColor}`;
        slot.style.background = 'rgba(0,0,0,0.6)';
      }

      // 物品名和数量
      const nameEl = slot.querySelector('.item-name') as HTMLDivElement || document.createElement('div');
      nameEl.className = 'item-name';
      nameEl.style.cssText = 'font-size: 10px; line-height: 1.2;';
      
      if (invSlot.item) {
        nameEl.textContent = invSlot.item.name;
        if (invSlot.count > 1) {
          nameEl.textContent += ` ×${invSlot.count}`;
        }
      } else {
        nameEl.textContent = '';
      }
      
      if (!slot.querySelector('.item-name')) {
        slot.appendChild(nameEl);
      }
    }
  }

  showMessage(text: string, duration = 3000): void {
    this.messageDisplay.textContent = text;
    this.messageDisplay.style.opacity = '1';
    
    if (this.messageTimeout) clearTimeout(this.messageTimeout);
    this.messageTimeout = window.setTimeout(() => {
      this.messageDisplay.style.opacity = '0';
    }, duration);
  }

  show(): void {
    this.container.style.display = 'block';
  }

  hide(): void {
    this.container.style.display = 'none';
  }
}
