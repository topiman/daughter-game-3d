// P2 配置完整性测试
import { describe, it, expect } from 'vitest'
import { CONFIG } from '../src/data/config'

describe('P2 新增配置完整性', () => {
  const p2Keys = [
    'SNOWMAN_MELT_TIME',
    'GRASS_SPAWN_CHANCE',
    'PILLOW_BED_BOOST',
    'PILLOW_SOFA_BOOST',
    'AUTOSAVE_INTERVAL',
  ]

  for (const key of p2Keys) {
    it(`CONFIG.${key} 存在且不为 undefined`, () => {
      expect((CONFIG as any)[key], `缺少配置项 ${key}`).toBeDefined()
    })
  }

  describe('数值合理性', () => {
    it('SNOWMAN_MELT_TIME > 0', () => {
      expect((CONFIG as any).SNOWMAN_MELT_TIME).toBeGreaterThan(0)
    })

    it('AUTOSAVE_INTERVAL > 0', () => {
      expect((CONFIG as any).AUTOSAVE_INTERVAL).toBeGreaterThan(0)
    })

    it('GRASS_SPAWN_CHANCE 在 0-1 之间', () => {
      expect((CONFIG as any).GRASS_SPAWN_CHANCE).toBeGreaterThan(0)
      expect((CONFIG as any).GRASS_SPAWN_CHANCE).toBeLessThanOrEqual(1)
    })

    it('PILLOW_BED_BOOST > BED_HP_RESTORE', () => {
      expect((CONFIG as any).PILLOW_BED_BOOST).toBeGreaterThan((CONFIG as any).BED_HP_RESTORE)
    })

    it('PILLOW_SOFA_BOOST < SOFA_HUNGER_SLOW_RATE（更强减缓 = 更小的值）', () => {
      expect((CONFIG as any).PILLOW_SOFA_BOOST).toBeLessThan((CONFIG as any).SOFA_HUNGER_SLOW_RATE)
    })
  })
})
