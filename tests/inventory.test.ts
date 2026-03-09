// 物品栏系统测试
import { describe, it, expect, beforeEach } from 'vitest'
import { InventorySystem } from '../src/systems/InventorySystem'
import { ITEMS, ItemCategory } from '../src/data/items'
import { CONFIG } from '../src/data/config'

describe('InventorySystem', () => {
  let inv: InventorySystem

  beforeEach(() => {
    inv = new InventorySystem()
  })

  it('初始化 8 格，第一格是剑', () => {
    expect(inv.slots.length).toBe(CONFIG.HOTBAR_SIZE)
    expect(inv.slots[0].item?.id).toBe('sword')
    expect(inv.slots[0].count).toBe(1)
  })

  it('默认选中第一格', () => {
    expect(inv.selectedIndex).toBe(0)
  })

  describe('addItem', () => {
    it('添加物品到空格', () => {
      const result = inv.addItem(ITEMS.bread)
      expect(result).toBe(true)
      // 第一格是剑，bread 应该在第二格
      expect(inv.slots[1].item?.id).toBe('bread')
      expect(inv.slots[1].count).toBe(1)
    })

    it('堆叠同类物品（不超过 maxStack）', () => {
      inv.addItem(ITEMS.bread) // 放到 slot 1
      inv.addItem(ITEMS.bread) // 堆叠到 slot 1
      expect(inv.slots[1].count).toBe(2)

      // 堆叠到上限
      for (let i = 0; i < 14; i++) {
        inv.addItem(ITEMS.bread)
      }
      expect(inv.slots[1].count).toBe(16) // maxStack=16
      
      // 超出后应该开新格
      inv.addItem(ITEMS.bread)
      expect(inv.slots[2].item?.id).toBe('bread')
      expect(inv.slots[2].count).toBe(1)
    })

    it('不可堆叠物品每个占一格', () => {
      inv.addItem(ITEMS.bed) // slot 1
      inv.addItem(ITEMS.bed) // slot 2 (不可堆叠)
      expect(inv.slots[1].item?.id).toBe('bed')
      expect(inv.slots[1].count).toBe(1)
      expect(inv.slots[2].item?.id).toBe('bed')
      expect(inv.slots[2].count).toBe(1)
    })

    it('物品栏满时添加失败', () => {
      // 填满所有格（第一格已有剑）
      for (let i = 1; i < CONFIG.HOTBAR_SIZE; i++) {
        inv.addItem(ITEMS.bed) // 不可堆叠，一个占一格
      }
      // 现在满了
      const result = inv.addItem(ITEMS.bed)
      expect(result).toBe(false)
    })
  })

  describe('setSelected', () => {
    it('切换选中格', () => {
      inv.setSelected(3)
      expect(inv.selectedIndex).toBe(3)
    })

    it('超出范围不切换', () => {
      inv.setSelected(3)
      inv.setSelected(-1)
      expect(inv.selectedIndex).toBe(3)
      inv.setSelected(CONFIG.HOTBAR_SIZE)
      expect(inv.selectedIndex).toBe(3)
    })
  })

  describe('scrollSelected', () => {
    it('向右滚动', () => {
      inv.scrollSelected(1)
      expect(inv.selectedIndex).toBe(1)
    })

    it('向左滚动循环', () => {
      inv.scrollSelected(-1)
      expect(inv.selectedIndex).toBe(CONFIG.HOTBAR_SIZE - 1)
    })

    it('向右滚动循环', () => {
      inv.setSelected(CONFIG.HOTBAR_SIZE - 1)
      inv.scrollSelected(1)
      expect(inv.selectedIndex).toBe(0)
    })
  })

  describe('consumeSelected', () => {
    it('消耗选中物品', () => {
      inv.addItem(ITEMS.bread)
      inv.setSelected(1) // bread 在 slot 1
      expect(inv.consumeSelected()).toBe(true)
      expect(inv.slots[1].item).toBeNull()
      expect(inv.slots[1].count).toBe(0)
    })

    it('堆叠物品消耗一个', () => {
      inv.addItem(ITEMS.bread)
      inv.addItem(ITEMS.bread)
      inv.setSelected(1)
      inv.consumeSelected()
      expect(inv.slots[1].item?.id).toBe('bread')
      expect(inv.slots[1].count).toBe(1)
    })

    it('空格消耗返回 false', () => {
      inv.setSelected(7) // 空格
      expect(inv.consumeSelected()).toBe(false)
    })
  })

  describe('物品类型判断', () => {
    it('isHoldingSword', () => {
      inv.setSelected(0) // 剑在第一格
      expect(inv.isHoldingSword()).toBe(true)
      inv.setSelected(1) // 空格
      expect(inv.isHoldingSword()).toBe(false)
    })

    it('isHoldingBlock', () => {
      inv.addItem(ITEMS.grass_block)
      inv.setSelected(1)
      expect(inv.isHoldingBlock()).toBe(true)
      inv.setSelected(0) // 剑
      expect(inv.isHoldingBlock()).toBe(false)
    })

    it('isHoldingFurniture', () => {
      inv.addItem(ITEMS.bed)
      inv.setSelected(1)
      expect(inv.isHoldingFurniture()).toBe(true)
    })

    it('isHoldingFood', () => {
      inv.addItem(ITEMS.bread)
      inv.setSelected(1)
      expect(inv.isHoldingFood()).toBe(true)
    })

    it('isHoldingPlaceable - 方块和家具都可放置', () => {
      inv.addItem(ITEMS.grass_block)
      inv.setSelected(1)
      expect(inv.isHoldingPlaceable()).toBe(true)

      inv.addItem(ITEMS.bed)
      inv.setSelected(2)
      expect(inv.isHoldingPlaceable()).toBe(true)

      inv.setSelected(0) // 剑不可放置
      expect(inv.isHoldingPlaceable()).toBe(false)
    })
  })

  describe('getSelectedItem', () => {
    it('返回选中格物品', () => {
      expect(inv.getSelectedItem()?.id).toBe('sword')
    })

    it('空格返回 null', () => {
      inv.setSelected(7)
      expect(inv.getSelectedItem()).toBeNull()
    })
  })
})
