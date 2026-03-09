// P2 新增物品完整性测试
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
  globalAlpha: 1,
  save: vi.fn(),
  restore: vi.fn(),
}
const mockCanvas = {
  width: 0, height: 0,
  getContext: vi.fn().mockReturnValue(mockCtx),
}
vi.stubGlobal('document', { createElement: vi.fn().mockReturnValue(mockCanvas) })

import { ITEMS, BlockType, ItemCategory, getRandomItem } from '../src/data/items'
import { BLOCK_UVS } from '../src/data/textures'

describe('P2 新增物品完整性', () => {
  const newBlockTypes = [
    { type: BlockType.SNOWMAN, name: 'SNOWMAN' },
    { type: BlockType.TALL_GRASS, name: 'TALL_GRASS' },
    { type: BlockType.PILLOW, name: 'PILLOW' },
  ]

  describe('BlockType 枚举', () => {
    for (const bt of newBlockTypes) {
      it(`BlockType.${bt.name} 存在`, () => {
        expect(bt.type).toBeDefined()
        expect(typeof bt.type).toBe('number')
      })
    }

    it('SNOWMAN = 14', () => { expect(BlockType.SNOWMAN).toBe(14) })
    it('TALL_GRASS = 15', () => { expect(BlockType.TALL_GRASS).toBe(15) })
    it('PILLOW = 16', () => { expect(BlockType.PILLOW).toBe(16) })
  })

  describe('所有新 BlockType 有纹理', () => {
    for (const bt of newBlockTypes) {
      it(`BLOCK_UVS[${bt.name}] 存在`, () => {
        expect(BLOCK_UVS[bt.type], `${bt.name} 缺少纹理`).toBeDefined()
      })
    }
  })

  describe('所有新物品有 icon/iconColor', () => {
    const newItems = ['snowman', 'tall_grass', 'pillow']
    for (const id of newItems) {
      it(`${id} 有 icon 和 iconColor`, () => {
        const item = ITEMS[id]
        expect(item, `物品 ${id} 不存在`).toBeDefined()
        if (item) {
          expect(item.icon, `${id} 缺少 icon`).toBeTruthy()
          expect(item.iconColor, `${id} 缺少 iconColor`).toBeTruthy()
        }
      })
    }
  })

  describe('新物品 category 正确', () => {
    it('snowman category 为 BLOCK', () => {
      expect(ITEMS.snowman?.category).toBe(ItemCategory.BLOCK)
    })
    it('tall_grass category 为 BLOCK', () => {
      expect(ITEMS.tall_grass?.category).toBe(ItemCategory.BLOCK)
    })
    it('pillow category 为 FURNITURE', () => {
      expect(ITEMS.pillow?.category).toBe(ItemCategory.FURNITURE)
    })
  })

  describe('新物品有正确 blockType', () => {
    it('snowman blockType = SNOWMAN', () => {
      expect(ITEMS.snowman?.blockType).toBe(BlockType.SNOWMAN)
    })
    it('tall_grass blockType = TALL_GRASS', () => {
      expect(ITEMS.tall_grass?.blockType).toBe(BlockType.TALL_GRASS)
    })
    it('pillow blockType = PILLOW', () => {
      expect(ITEMS.pillow?.blockType).toBe(BlockType.PILLOW)
    })
  })

  describe('抱枕在水方块掉落池中', () => {
    it('pillow weight > 0', () => {
      expect(ITEMS.pillow?.weight).toBeGreaterThan(0)
    })
  })

  describe('草不可回收（weight=0 或无掉落）', () => {
    it('tall_grass weight = 0', () => {
      expect(ITEMS.tall_grass?.weight).toBe(0)
    })
  })
})
