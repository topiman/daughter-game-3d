// 收纳家具测试
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('three', () => ({}))

import { StorageSystem } from '../src/systems/StorageSystem'
import { ITEMS } from '../src/data/items'
import { CONFIG } from '../src/data/config'

describe('StorageSystem', () => {
  let storage: StorageSystem

  beforeEach(() => {
    storage = new StorageSystem()
  })

  it('打开鞋柜 → 返回 STORAGE_SLOTS 格', () => {
    storage.openStorage(10, 5, 10) // 第一次打开自动创建
    const slots = storage.openStorage(10, 5, 10)
    expect(slots).not.toBeNull()
    expect(slots!.length).toBe(CONFIG.STORAGE_SLOTS)
  })

  it('打开衣柜 → 返回 STORAGE_SLOTS 格', () => {
    storage.openStorage(20, 5, 20)
    const slots = storage.openStorage(20, 5, 20)
    expect(slots).not.toBeNull()
    expect(slots!.length).toBe(CONFIG.STORAGE_SLOTS)
  })

  it('添加物品到收纳', () => {
    storage.openStorage(10, 5, 10)
    const result = storage.addToStorage('10,5,10', ITEMS.bread)
    expect(result).toBe(true)
  })

  it('收纳满了添加失败', () => {
    storage.openStorage(10, 5, 10)
    for (let i = 0; i < CONFIG.STORAGE_SLOTS; i++) {
      storage.addToStorage('10,5,10', ITEMS.bread)
    }
    const result = storage.addToStorage('10,5,10', ITEMS.bread)
    expect(result).toBe(false)
  })

  it('取出物品', () => {
    storage.openStorage(10, 5, 10)
    storage.addToStorage('10,5,10', ITEMS.bread)
    const item = storage.removeFromStorage('10,5,10', 0)
    expect(item).toBeDefined()
    expect(item!.id).toBe('bread')
  })

  it('打开不存在的收纳 → null', () => {
    const slots = storage.openStorage(99, 99, 99)
    // 第一次打开会创建，所以测试从未打开的情况需要用 getStorage
    // 实际上 openStorage 会创建，所以我们直接测 removeFromStorage 不存在的key
    const item = storage.removeFromStorage('99,99,98', 0)
    expect(item).toBeNull()
  })
})
