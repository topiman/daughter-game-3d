// 帐篷测试
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('three', () => ({}))

import { isTentArea } from '../src/systems/TentSystem'
import { BlockType } from '../src/data/items'
import { CONFIG } from '../src/data/config'

describe('帐篷系统', () => {
  // 模拟 VoxelWorld
  function createMockWorld(tentBlocks: Array<{ x: number; y: number; z: number }>) {
    return {
      getBlock: vi.fn().mockImplementation((x: number, y: number, z: number) => {
        for (const b of tentBlocks) {
          if (b.x === x && b.y === y && b.z === z) return BlockType.TENT
        }
        return 0 // AIR
      }),
      width: 64,
      depth: 64,
      height: 32,
    } as any
  }

  it('玩家在帐篷内 → true', () => {
    const world = createMockWorld([{ x: 10, y: 5, z: 10 }])
    expect(isTentArea(10, 5, 10, world)).toBe(true)
  })

  it('玩家在帐篷附近(TENT_SAFE_RADIUS 内) → true', () => {
    const world = createMockWorld([{ x: 10, y: 5, z: 10 }])
    expect(isTentArea(11, 5, 10, world)).toBe(true) // 距离1 < TENT_SAFE_RADIUS
  })

  it('玩家在帐篷外 → false', () => {
    const world = createMockWorld([{ x: 10, y: 5, z: 10 }])
    expect(isTentArea(20, 5, 20, world)).toBe(false) // 远处
  })

  it('没有帐篷 → false', () => {
    const world = createMockWorld([])
    expect(isTentArea(10, 5, 10, world)).toBe(false)
  })
})
