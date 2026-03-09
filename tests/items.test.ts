// 物品系统测试
import { describe, it, expect } from 'vitest'
import { ITEMS, getRandomItem, getCategoryColor, ItemCategory, ItemDef } from '../src/data/items'

describe('物品系统 (items)', () => {
  describe('getRandomItem()', () => {
    it('返回有效物品', () => {
      const item = getRandomItem()
      expect(item).toBeDefined()
      expect(item.id).toBeTruthy()
      expect(item.name).toBeTruthy()
    })

    it('只返回 weight > 0 的物品', () => {
      for (let i = 0; i < 100; i++) {
        const item = getRandomItem()
        expect(item.weight).toBeGreaterThan(0)
      }
    })

    it('权重分布大致正确（高权重物品出现率 > 低权重）', () => {
      const counts: Record<string, number> = {}
      const runs = 3000

      for (let i = 0; i < runs; i++) {
        const item = getRandomItem()
        counts[item.id] = (counts[item.id] || 0) + 1
      }

      // grass_block weight=30, cake weight=5
      // 高权重物品应该出现更多
      const highWeight = counts['grass_block'] || 0
      const lowWeight = counts['cake'] || 0
      expect(highWeight).toBeGreaterThan(lowWeight)
    })
  })

  describe('物品字段完整性', () => {
    const allItems = Object.values(ITEMS)

    it('所有物品都有必填字段', () => {
      for (const item of allItems) {
        expect(item.id, `${item.id} 缺少 id`).toBeTruthy()
        expect(item.name, `${item.id} 缺少 name`).toBeTruthy()
        expect(item.category, `${item.id} 缺少 category`).toBeTruthy()
        expect(item.icon, `${item.id} 缺少 icon`).toBeTruthy()
        expect(item.iconColor, `${item.id} 缺少 iconColor`).toBeTruthy()
      }
    })

    it('食物类物品都有 hungerRestore', () => {
      const foods = allItems.filter(i => i.category === ItemCategory.FOOD)
      expect(foods.length).toBeGreaterThan(0)
      for (const food of foods) {
        expect(food.hungerRestore, `${food.id} 缺少 hungerRestore`).toBeDefined()
        expect(food.hungerRestore).toBeGreaterThan(0)
      }
    })

    it('方块类物品都有 blockType', () => {
      const blocks = allItems.filter(i => i.category === ItemCategory.BLOCK)
      expect(blocks.length).toBeGreaterThan(0)
      for (const block of blocks) {
        expect(block.blockType, `${block.id} 缺少 blockType`).toBeDefined()
      }
    })
  })

  describe('getCategoryColor()', () => {
    it('方块类返回棕色', () => {
      expect(getCategoryColor(ItemCategory.BLOCK)).toBe('#8B4513')
    })

    it('家具类返回黄色', () => {
      expect(getCategoryColor(ItemCategory.FURNITURE)).toBe('#DAA520')
    })

    it('食物类返回绿色', () => {
      expect(getCategoryColor(ItemCategory.FOOD)).toBe('#228B22')
    })

    it('特殊类返回蓝色', () => {
      expect(getCategoryColor(ItemCategory.SPECIAL)).toBe('#4169E1')
    })
  })
})
