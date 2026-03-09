// 抱枕增强效果测试
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('three', () => ({
  Vector3: vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({ x, y, z })),
}))

import { BlockType } from '../src/data/items'
import { CONFIG } from '../src/data/config'
import { hasPillowNearby } from '../src/systems/PillowHelper'

describe('抱枕增强效果', () => {
  // Mock world
  function makeWorld(blocks: Record<string, BlockType>) {
    return {
      getBlock(x: number, y: number, z: number) {
        return blocks[`${x},${y},${z}`] ?? BlockType.AIR
      }
    }
  }

  describe('hasPillowNearby', () => {
    it('床旁1格内有抱枕 → true', () => {
      const world = makeWorld({
        '10,5,10': BlockType.BED,
        '11,5,10': BlockType.PILLOW,
      })
      expect(hasPillowNearby(world, 10, 5, 10)).toBe(true)
    })

    it('床旁无抱枕 → false', () => {
      const world = makeWorld({
        '10,5,10': BlockType.BED,
      })
      expect(hasPillowNearby(world, 10, 5, 10)).toBe(false)
    })

    it('2格外的抱枕不算', () => {
      const world = makeWorld({
        '10,5,10': BlockType.BED,
        '12,5,10': BlockType.PILLOW,
      })
      expect(hasPillowNearby(world, 10, 5, 10)).toBe(false)
    })
  })

  describe('床交互增强', () => {
    it('床旁无抱枕 → 回血 20%', () => {
      const hpRestore = CONFIG.BED_HP_RESTORE
      expect(hpRestore).toBe(20)
    })

    it('床旁有抱枕 → 回血 35%', () => {
      const hpRestore = CONFIG.PILLOW_BED_BOOST
      expect(hpRestore).toBe(35)
    })
  })

  describe('沙发交互增强', () => {
    it('沙发旁无抱枕 → 减缓 50%', () => {
      const rate = CONFIG.SOFA_HUNGER_SLOW_RATE
      expect(rate).toBe(0.5)
    })

    it('沙发旁有抱枕 → 减缓 30%', () => {
      const rate = CONFIG.PILLOW_SOFA_BOOST
      expect(rate).toBe(0.3)
    })
  })
})
