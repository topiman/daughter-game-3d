// 物品定义
export enum ItemCategory {
  BLOCK = 'block',
  FURNITURE = 'furniture',
  FOOD = 'food',
  SPECIAL = 'special',
}

export enum BlockType {
  AIR = 0,
  BEDROCK = 1,
  GRASS = 2,
  DIRT = 3,
  WOOD = 4,
  WATER_BLOCK = 5,
  BED = 6,
  SOFA = 7,
}

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  blockType?: BlockType;
  stackable: boolean;
  maxStack: number;
  weight: number; // 水方块掉落权重
  hungerRestore?: number; // 百分比
  hpRestore?: number;
  speedBoost?: number; // 秒
  sizeX?: number; // 占格宽（默认1）
  sizeZ?: number; // 占格深（默认1）
  icon: string; // 物品栏显示的 emoji 图标
  iconColor: string; // 物品栏背景色
}

export const ITEMS: Record<string, ItemDef> = {
  sword: {
    id: 'sword',
    name: '剑',
    category: ItemCategory.SPECIAL,
    stackable: false,
    maxStack: 1,
    weight: 0,
    icon: '⚔️',
    iconColor: '#4a6fa5',
  },
  grass_block: {
    id: 'grass_block',
    name: '草方块',
    category: ItemCategory.BLOCK,
    blockType: BlockType.GRASS,
    stackable: true,
    maxStack: 64,
    weight: 30,
    icon: '🟩',
    iconColor: '#4c9900',
  },
  dirt_block: {
    id: 'dirt_block',
    name: '干土地',
    category: ItemCategory.BLOCK,
    blockType: BlockType.DIRT,
    stackable: true,
    maxStack: 64,
    weight: 30,
    icon: '🟫',
    iconColor: '#8B6914',
  },
  wood_block: {
    id: 'wood_block',
    name: '木头方块',
    category: ItemCategory.BLOCK,
    blockType: BlockType.WOOD,
    stackable: true,
    maxStack: 64,
    weight: 15,
    icon: '🪵',
    iconColor: '#78501e',
  },
  bed: {
    id: 'bed',
    name: '床',
    category: ItemCategory.FURNITURE,
    blockType: BlockType.BED,
    stackable: false,
    maxStack: 1,
    weight: 5,
    sizeX: 2,
    sizeZ: 1,
    icon: '🛏️',
    iconColor: '#c83c3c',
  },
  sofa: {
    id: 'sofa',
    name: '沙发',
    category: ItemCategory.FURNITURE,
    blockType: BlockType.SOFA,
    stackable: false,
    maxStack: 1,
    weight: 5,
    icon: '🛋️',
    iconColor: '#4696a0',
  },
  bread: {
    id: 'bread',
    name: '面包',
    category: ItemCategory.FOOD,
    stackable: true,
    maxStack: 16,
    weight: 30,
    hungerRestore: 30,
    icon: '🍞',
    iconColor: '#d4a854',
  },
  noodle: {
    id: 'noodle',
    name: '面条',
    category: ItemCategory.FOOD,
    stackable: true,
    maxStack: 16,
    weight: 15,
    hungerRestore: 40,
    icon: '🍜',
    iconColor: '#e8c84a',
  },
  icecream: {
    id: 'icecream',
    name: '冰淇淋',
    category: ItemCategory.FOOD,
    stackable: true,
    maxStack: 16,
    weight: 15,
    hungerRestore: 20,
    speedBoost: 3,
    icon: '🍦',
    iconColor: '#f0c0d0',
  },
  cake: {
    id: 'cake',
    name: '小蛋糕',
    category: ItemCategory.FOOD,
    stackable: true,
    maxStack: 16,
    weight: 5,
    hungerRestore: 50,
    icon: '🍰',
    iconColor: '#f5a0b0',
  },
};

// 水方块掉落池（按权重）
export function getRandomItem(): ItemDef {
  const pool = Object.values(ITEMS).filter(i => i.weight > 0);
  const totalWeight = pool.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * totalWeight;
  for (const item of pool) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return pool[pool.length - 1];
}

// 边框颜色映射
export function getCategoryColor(cat: ItemCategory): string {
  switch (cat) {
    case ItemCategory.BLOCK: return '#8B4513';    // 棕色
    case ItemCategory.FURNITURE: return '#DAA520'; // 黄色
    case ItemCategory.FOOD: return '#228B22';      // 绿色
    case ItemCategory.SPECIAL: return '#4169E1';   // 蓝色
  }
}
