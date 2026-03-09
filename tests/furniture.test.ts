// 家具交互测试
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('three', () => ({
  Vector3: vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({ x, y, z })),
}))

import { FurnitureSystem } from '../src/systems/FurnitureSystem'
import { BlockType } from '../src/data/items'
import { CONFIG } from '../src/data/config'

describe('FurnitureSystem', () => {
  let furniture: FurnitureSystem

  beforeEach(() => {
    furniture = new FurnitureSystem()
  })

  describe('床交互', () => {
    it('夜晚使用床 → 跳过夜晚', () => {
      const player = { hp: 50, hunger: 50 } as any
      const time = { isNight: true } as any
      const result = furniture.interact(BlockType.BED, player, time)
      expect(result.success).toBe(true)
      expect(result.action).toBe('skip_night')
    })

    it('白天使用床 → 失败', () => {
      const player = { hp: 50, hunger: 50 } as any
      const time = { isNight: false } as any
      const result = furniture.interact(BlockType.BED, player, time)
      expect(result.success).toBe(false)
    })

    it('使用床恢复 20% HP', () => {
      const player = { hp: 50, hunger: 50 } as any
      const time = { isNight: true } as any
      furniture.interact(BlockType.BED, player, time)
      expect(player.hp).toBe(50 + CONFIG.BED_HP_RESTORE)
    })

    it('使用床 HP 不超过上限', () => {
      const player = { hp: 90, hunger: 50 } as any
      const time = { isNight: true } as any
      furniture.interact(BlockType.BED, player, time)
      expect(player.hp).toBe(CONFIG.MAX_HP) // 100, not 110
    })
  })

  describe('沙发交互', () => {
    it('使用沙发 → 减缓饥饿', () => {
      const player = { hp: 50, hunger: 50 } as any
      const time = { isNight: false } as any
      const result = furniture.interact(BlockType.SOFA, player, time)
      expect(result.success).toBe(true)
      expect(result.action).toBe('rest')
    })
  })

  describe('马桶交互', () => {
    it('使用马桶 → 趣味效果', () => {
      const player = { hp: 50, hunger: 50 } as any
      const time = { isNight: false } as any
      const result = furniture.interact(BlockType.TOILET, player, time)
      expect(result.success).toBe(true)
      expect(result.action).toBe('toilet')
    })
  })
})
