// 照明系统测试
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('three', () => {
  class PointLight {
    position = { set: vi.fn() }
    distance = 0
    decay = 0
    constructor(_color?: any, _intensity?: any, _dist?: any, _decay?: any) {}
  }
  return { PointLight }
})

import { LightingSystem } from '../src/systems/LightingSystem'
import { CONFIG } from '../src/data/config'

describe('LightingSystem', () => {
  let lighting: LightingSystem
  let scene: any

  beforeEach(() => {
    lighting = new LightingSystem()
    scene = { add: vi.fn(), remove: vi.fn() }
  })

  describe('路灯 (LAMP_RADIUS=5)', () => {
    it('光照范围内 isInLight=true', () => {
      lighting.addLight(10, 5, 10, CONFIG.LAMP_RADIUS, scene)
      expect(lighting.isInLight(14, 5, 10)).toBe(true) // 距离4 < 5
    })

    it('光照范围外 isInLight=false', () => {
      lighting.addLight(10, 5, 10, CONFIG.LAMP_RADIUS, scene)
      expect(lighting.isInLight(16, 5, 10)).toBe(false) // 距离6 > 5
    })
  })

  describe('小夜灯 (NIGHTLIGHT_RADIUS=3)', () => {
    it('光照范围内 isInLight=true', () => {
      lighting.addLight(10, 5, 10, CONFIG.NIGHTLIGHT_RADIUS, scene)
      expect(lighting.isInLight(12, 5, 10)).toBe(true) // 距离2 < 3
    })

    it('光照范围外 isInLight=false', () => {
      lighting.addLight(10, 5, 10, CONFIG.NIGHTLIGHT_RADIUS, scene)
      expect(lighting.isInLight(14, 5, 10)).toBe(false) // 距离4 > 3
    })
  })

  describe('移除灯', () => {
    it('移除后 isInLight=false', () => {
      lighting.addLight(10, 5, 10, CONFIG.LAMP_RADIUS, scene)
      expect(lighting.isInLight(10, 5, 10)).toBe(true)
      lighting.removeLight(10, 5, 10, scene)
      expect(lighting.isInLight(10, 5, 10)).toBe(false)
    })
  })

  describe('getLights()', () => {
    it('返回所有灯的列表', () => {
      lighting.addLight(10, 5, 10, 5, scene)
      lighting.addLight(20, 5, 20, 3, scene)
      const lights = lighting.getLights()
      expect(lights.length).toBe(2)
    })
  })
})
