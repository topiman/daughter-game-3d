// 物品栏系统
import { CONFIG } from '../data/config';
import { ItemDef, ITEMS, ItemCategory } from '../data/items';

export interface InventorySlot {
  item: ItemDef | null;
  count: number;
}

export class InventorySystem {
  slots: InventorySlot[] = [];
  selectedIndex = 0;

  constructor() {
    // 初始化8格
    for (let i = 0; i < CONFIG.HOTBAR_SIZE; i++) {
      this.slots.push({ item: null, count: 0 });
    }
    // 剑默认在第一格
    this.slots[0] = { item: ITEMS.sword, count: 1 };
  }

  getSelectedItem(): ItemDef | null {
    return this.slots[this.selectedIndex].item;
  }

  setSelected(index: number): void {
    if (index >= 0 && index < CONFIG.HOTBAR_SIZE) {
      this.selectedIndex = index;
    }
  }

  scrollSelected(delta: number): void {
    this.selectedIndex = ((this.selectedIndex + delta) % CONFIG.HOTBAR_SIZE + CONFIG.HOTBAR_SIZE) % CONFIG.HOTBAR_SIZE;
  }

  // 添加物品到物品栏
  addItem(item: ItemDef): boolean {
    // 先尝试合并到已有堆叠
    if (item.stackable) {
      for (const slot of this.slots) {
        if (slot.item?.id === item.id && slot.count < item.maxStack) {
          slot.count++;
          return true;
        }
      }
    }

    // 找空位
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i].item === null) {
        this.slots[i] = { item, count: 1 };
        return true;
      }
    }

    return false; // 满了
  }

  // 消耗当前选中物品
  consumeSelected(): boolean {
    const slot = this.slots[this.selectedIndex];
    if (!slot.item) return false;
    
    slot.count--;
    if (slot.count <= 0) {
      slot.item = null;
      slot.count = 0;
    }
    return true;
  }

  // 检查是否持剑
  isHoldingSword(): boolean {
    return this.getSelectedItem()?.id === 'sword';
  }

  // 检查选中物品是否为方块类
  isHoldingBlock(): boolean {
    const item = this.getSelectedItem();
    return item?.category === ItemCategory.BLOCK;
  }

  // 检查选中物品是否为家具
  isHoldingFurniture(): boolean {
    const item = this.getSelectedItem();
    return item?.category === ItemCategory.FURNITURE;
  }

  // 检查选中物品是否为食物
  isHoldingFood(): boolean {
    const item = this.getSelectedItem();
    return item?.category === ItemCategory.FOOD;
  }

  // 检查是否可放置
  isHoldingPlaceable(): boolean {
    const item = this.getSelectedItem();
    return item?.category === ItemCategory.BLOCK || item?.category === ItemCategory.FURNITURE;
  }

  // 存档序列化
  toSaveFormat(): Array<{ itemId: string; count: number } | null> {
    return this.slots.map(s => s.item ? { itemId: s.item.id, count: s.count } : null);
  }

  // 从存档恢复
  loadFromSave(slots: Array<{ itemId: string; count: number } | null>): void {
    for (let i = 0; i < this.slots.length && i < slots.length; i++) {
      const saved = slots[i];
      if (saved && ITEMS[saved.itemId]) {
        this.slots[i] = { item: ITEMS[saved.itemId], count: saved.count };
      } else {
        this.slots[i] = { item: null, count: 0 };
      }
    }
  }
}
