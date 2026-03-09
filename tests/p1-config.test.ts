// P1 配置完整性测试
import { describe, it, expect } from 'vitest'
import { CONFIG } from '../src/data/config'

describe('P1 新增配置完整性', () => {
  const p1Keys = [
    'WEATHER_CHANCE',
    'WEATHER_DURATION',
    'BED_HP_RESTORE',
    'SOFA_HUNGER_SLOW_DURATION',
    'SOFA_HUNGER_SLOW_RATE',
    'DOG_FOLLOW_DIST',
    'DOG_BARK_RANGE',
    'DOG_SPEED',
    'LAMP_RADIUS',
    'NIGHTLIGHT_RADIUS',
    'TENT_SAFE_RADIUS',
    'STORAGE_SLOTS',
  ]

  for (const key of p1Keys) {
    it(`CONFIG.${key} 存在且不为 undefined`, () => {
      expect((CONFIG as any)[key], `缺少配置项 ${key}`).toBeDefined()
    })
  }

  describe('数值合理性', () => {
    it('WEATHER_CHANCE 在 0-1 之间', () => {
      expect((CONFIG as any).WEATHER_CHANCE).toBeGreaterThan(0)
      expect((CONFIG as any).WEATHER_CHANCE).toBeLessThanOrEqual(1)
    })

    it('BED_HP_RESTORE > 0 且 ≤ 100', () => {
      expect((CONFIG as any).BED_HP_RESTORE).toBeGreaterThan(0)
      expect((CONFIG as any).BED_HP_RESTORE).toBeLessThanOrEqual(100)
    })

    it('LAMP_RADIUS > 0', () => {
      expect((CONFIG as any).LAMP_RADIUS).toBeGreaterThan(0)
    })

    it('NIGHTLIGHT_RADIUS > 0', () => {
      expect((CONFIG as any).NIGHTLIGHT_RADIUS).toBeGreaterThan(0)
    })

    it('TENT_SAFE_RADIUS > 0', () => {
      expect((CONFIG as any).TENT_SAFE_RADIUS).toBeGreaterThan(0)
    })

    it('STORAGE_SLOTS > 0', () => {
      expect((CONFIG as any).STORAGE_SLOTS).toBeGreaterThan(0)
    })

    it('DOG_FOLLOW_DIST > 0', () => {
      expect((CONFIG as any).DOG_FOLLOW_DIST).toBeGreaterThan(0)
    })

    it('DOG_BARK_RANGE > DOG_FOLLOW_DIST', () => {
      expect((CONFIG as any).DOG_BARK_RANGE).toBeGreaterThan((CONFIG as any).DOG_FOLLOW_DIST)
    })

    it('SOFA_HUNGER_SLOW_RATE 在 0-1 之间', () => {
      expect((CONFIG as any).SOFA_HUNGER_SLOW_RATE).toBeGreaterThan(0)
      expect((CONFIG as any).SOFA_HUNGER_SLOW_RATE).toBeLessThanOrEqual(1)
    })
  })
})
