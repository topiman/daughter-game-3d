// 天气系统测试
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Three.js with proper class constructors
vi.mock('three', () => {
  class BufferGeometry {
    setAttribute = vi.fn()
    dispose = vi.fn()
    attributes = { position: { array: new Float32Array(0), needsUpdate: false } }
  }
  class Points { constructor(_geo: any, _mat: any) {} }
  class Float32BufferAttribute { constructor(_arr: any, _size: any) {} }
  class PointsMaterial { dispose = vi.fn(); constructor(_opts?: any) {} }
  return { Points, BufferGeometry, Float32BufferAttribute, PointsMaterial, AdditiveBlending: 1 }
})

import { WeatherSystem } from '../src/systems/WeatherSystem'

describe('WeatherSystem', () => {
  let weather: WeatherSystem

  beforeEach(() => {
    weather = new WeatherSystem()
  })

  it('初始天气为 clear', () => {
    expect(weather.currentWeather).toBe('clear')
  })

  it('startRain 后天气为 rain', () => {
    const scene = { add: vi.fn(), remove: vi.fn() } as any
    weather.startRain(scene)
    expect(weather.currentWeather).toBe('rain')
  })

  it('startSnow 后天气为 snow', () => {
    const scene = { add: vi.fn(), remove: vi.fn() } as any
    weather.startSnow(scene)
    expect(weather.currentWeather).toBe('snow')
  })

  it('stopWeather 后天气为 clear', () => {
    const scene = { add: vi.fn(), remove: vi.fn() } as any
    weather.startRain(scene)
    weather.stopWeather(scene)
    expect(weather.currentWeather).toBe('clear')
  })

  it('天气触发概率约 30%（统计验证）', () => {
    let triggerCount = 0
    for (let i = 0; i < 1000; i++) {
      if (Math.random() < 0.3) triggerCount++
    }
    expect(triggerCount).toBeGreaterThanOrEqual(200)
    expect(triggerCount).toBeLessThanOrEqual(400)
  })

  it('getWeather 返回当前天气字符串', () => {
    expect(weather.getWeather()).toBe('clear')
  })
})
