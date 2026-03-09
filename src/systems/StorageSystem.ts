// 收纳家具存储系统
import { ItemDef, ITEMS } from '../data/items';
import { CONFIG } from '../data/config';

export interface StorageSlot {
  item: ItemDef | null;
}

export class StorageSystem {
  private storages: Map<string, StorageSlot[]> = new Map();

  private key(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }

  /**
   * 打开/创建收纳，返回存储格列表
   */
  openStorage(x: number, y: number, z: number): StorageSlot[] {
    const k = this.key(x, y, z);
    if (!this.storages.has(k)) {
      const slots: StorageSlot[] = [];
      for (let i = 0; i < CONFIG.STORAGE_SLOTS; i++) {
        slots.push({ item: null });
      }
      this.storages.set(k, slots);
    }
    return this.storages.get(k)!;
  }

  /**
   * 向指定收纳添加物品，返回是否成功
   */
  addToStorage(key: string, item: ItemDef): boolean {
    const slots = this.storages.get(key);
    if (!slots) return false;
    for (const slot of slots) {
      if (slot.item === null) {
        slot.item = item;
        return true;
      }
    }
    return false; // 满了
  }

  /**
   * 从指定收纳取出物品
   */
  removeFromStorage(key: string, index: number): ItemDef | null {
    const slots = this.storages.get(key);
    if (!slots || index < 0 || index >= slots.length) return null;
    const item = slots[index].item;
    slots[index].item = null;
    return item;
  }

  /**
   * 删除收纳（方块被破坏时）
   */
  removeStorage(x: number, y: number, z: number): void {
    this.storages.delete(this.key(x, y, z));
  }

  // 存档序列化
  toSaveFormat(): Record<string, Array<{ itemId: string; count: number } | null>> {
    const result: Record<string, Array<{ itemId: string; count: number } | null>> = {};
    for (const [key, slots] of this.storages.entries()) {
      result[key] = slots.map(s => s.item ? { itemId: s.item.id, count: 1 } : null);
    }
    return result;
  }

  // 从存档恢复
  loadFromSave(data: Record<string, Array<{ itemId: string; count: number } | null>>): void {
    for (const [key, slots] of Object.entries(data)) {
      const storageSlots: StorageSlot[] = slots.map(s => {
        if (s && ITEMS[s.itemId]) {
          return { item: ITEMS[s.itemId] };
        }
        return { item: null };
      });
      this.storages.set(key, storageSlots);
    }
  }
}
