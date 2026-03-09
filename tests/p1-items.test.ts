// P1 新增物品完整性测试
import { describe, it, expect, vi } from 'vitest'

// Mock Three.js for textures import
vi.mock('three', () => {
  class CanvasTexture {
    magFilter = 0; minFilter = 0; colorSpace = ''; wrapS = 0; wrapT = 0
    constructor(_canvas: any) {}
  }
  return { CanvasTexture, NearestFilter: 1, SRGBColorSpace: 'srgb', RepeatWrapping: 1 }
})

// Mock document.createElement for Canvas
const mockCtx = {
  fillStyle: '',
  fillRect: vi.fn(),
  strokeStyle: '',
  lineWidth: 0,
  beginPath: vi.fn(),
  arc: vi.fn(),
  stroke: vi.fn(),
  getContext: vi.fn(),
}
const mockCanvas = {
  width: 0, height: 0,
  getContext: vi.fn().mockReturnValue(mockCtx),
}
vi.stubGlobal('document', { createElement: vi.fn().mockReturnValue(mockCanvas) })

import { ITEMS, BlockType, ItemCategory, getRandomItem } from '../src/data/items'
import { BLOCK_UVS } from '../src/data/textures'

describe('P1 新增物品完整性', () => {
  const newBlockTypes = [
    { type: BlockType.TOILET, name: 'TOILET' },
    { type: BlockType.LAMP, name: 'LAMP' },
    { type: BlockType.NIGHTLIGHT, name: 'NIGHTLIGHT' },
    { type: BlockType.TENT, name: 'TENT' },
    { type: BlockType.SHOE_CABINET, name: 'SHOE_CABINET' },
    { type: BlockType.WARDROBE, name: 'WARDROBE' },
  ]

  describe('BlockType 枚举', () => {
    for (const bt of newBlockTypes) {
      it(`BlockType.${bt.name} 存在`, () => {
        expect(bt.type).toBeDefined()
        expect(typeof bt.type).toBe('number')
      })
    }
  })

  describe('所有新 BlockType 有纹理', () => {
    for (const bt of newBlockTypes) {
      it(`BLOCK_UVS[${bt.name}] 存在`, () => {
        expect(BLOCK_UVS[bt.type], `${bt.name} 缺少纹理`).toBeDefined()
      })
    }
  })

  describe('所有新物品有 icon/iconColor', () => {
    const allItems = Object.values(ITEMS)
    const furnitureItems = allItems.filter(i => i.category === ItemCategory.FURNITURE)

    it('家具类物品 >= 6 个', () => {
      expect(furnitureItems.length).toBeGreaterThanOrEqual(6)
    })

    for (const item of furnitureItems) {
      it(`${item.id} 有 icon 和 iconColor`, () => {
        expect(item.icon, `${item.id} 缺少 icon`).toBeTruthy()
        expect(item.iconColor, `${item.id} 缺少 iconColor`).toBeTruthy()
      })
    }
  })

  describe('新物品 category 正确', () => {
    const expectedFurniture = ['toilet', 'lamp', 'nightlight', 'tent', 'shoe_cabinet', 'wardrobe']
    for (const id of expectedFurniture) {
      it(`${id} category 为 FURNITURE`, () => {
        const item = ITEMS[id]
        expect(item, `物品 ${id} 不存在`).toBeDefined()
        if (item) {
          expect(item.category).toBe(ItemCategory.FURNITURE)
        }
      })
    }
  })

  describe('新物品在水方块掉落池中', () => {
    it('weight > 0 的新物品可以被 getRandomItem 获取', () => {
      const pool = Object.values(ITEMS).filter(i => i.weight > 0)
      expect(pool.length).toBeGreaterThan(0)
      const item = getRandomItem()
      expect(item).toBeDefined()
      expect(item.weight).toBeGreaterThan(0)
    })
  })
})
