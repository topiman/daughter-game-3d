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
  TOILET = 8,
  LAMP = 9,
  NIGHTLIGHT = 10,
  TENT = 11,
  SHOE_CABINET = 12,
  WARDROBE = 13,
  SNOWMAN = 14,
  TALL_GRASS = 15,
  PILLOW = 16,
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
  toilet: {
    id: 'toilet',
    name: '马桶',
    category: ItemCategory.FURNITURE,
    blockType: BlockType.TOILET,
    stackable: false,
    maxStack: 1,
    weight: 3,
    icon: '🚽',
    iconColor: '#e0e0e0',
  },
  lamp: {
    id: 'lamp',
    name: '路灯',
    category: ItemCategory.FURNITURE,
    blockType: BlockType.LAMP,
    stackable: false,
    maxStack: 1,
    weight: 3,
    icon: '🏮',
    iconColor: '#ffcc00',
  },
  nightlight: {
    id: 'nightlight',
    name: '小夜灯',
    category: ItemCategory.FURNITURE,
    blockType: BlockType.NIGHTLIGHT,
    stackable: false,
    maxStack: 1,
    weight: 3,
    icon: '💡',
    iconColor: '#ffe4b5',
  },
  tent: {
    id: 'tent',
    name: '帐篷',
    category: ItemCategory.FURNITURE,
    blockType: BlockType.TENT,
    stackable: false,
    maxStack: 1,
    weight: 2,
    sizeX: 2,
    sizeZ: 2,
    icon: '⛺',
    iconColor: '#d2691e',
  },
  shoe_cabinet: {
    id: 'shoe_cabinet',
    name: '鞋柜',
    category: ItemCategory.FURNITURE,
    blockType: BlockType.SHOE_CABINET,
    stackable: false,
    maxStack: 1,
    weight: 2,
    icon: '👟',
    iconColor: '#8b7355',
  },
  wardrobe: {
    id: 'wardrobe',
    name: '衣柜',
    category: ItemCategory.FURNITURE,
    blockType: BlockType.WARDROBE,
    stackable: false,
    maxStack: 1,
    weight: 2,
    icon: '👔',
    iconColor: '#6b4226',
  },
  snowman: {
    id: 'snowman',
    name: '雪人',
    category: ItemCategory.BLOCK,
    blockType: BlockType.SNOWMAN,
    stackable: false,
    maxStack: 1,
    weight: 3,
    icon: '🧊',
    iconColor: '#e8f0ff',
  },
  tall_grass: {
    id: 'tall_grass',
    name: '草',
    category: ItemCategory.BLOCK,
    blockType: BlockType.TALL_GRASS,
    stackable: false,
    maxStack: 1,
    weight: 0, // 不可从水方块获取，不回收
    icon: '🌿',
    iconColor: '#3a8a00',
  },
  pillow: {
    id: 'pillow',
    name: '抱枕',
    category: ItemCategory.FURNITURE,
    blockType: BlockType.PILLOW,
    stackable: false,
    maxStack: 1,
    weight: 3,
    icon: '🛏',
    iconColor: '#9966cc',
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
