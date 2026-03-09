// 时间系统测试
import { describe, it, expect, beforeEach } from 'vitest'
import { TimeSystem } from '../src/systems/TimeSystem'
import { CONFIG } from '../src/data/config'

describe('TimeSystem', () => {
  let time: TimeSystem

  beforeEach(() => {
    time = new TimeSystem()
  })

  it('初始为第 1 天早上 8 点', () => {
    expect(time.gameDay).toBe(1)
    expect(time.gameHour).toBe(8)
  })

  it('时间正确流逝', () => {
    time.update(1) // 1 秒
    expect(time.gameHour).toBeGreaterThan(8)
  })

  it('8分钟现实时间 = 1游戏天', () => {
    expect(CONFIG.DAY_DURATION).toBe(480) // 8 * 60 = 480 秒
    
    // 经过一整天后 gameDay 应递增
    time.update(CONFIG.DAY_DURATION)
    expect(time.gameDay).toBe(2)
  })

  it('天数递增', () => {
    time.update(CONFIG.DAY_DURATION * 3)
    expect(time.gameDay).toBe(4) // 开始第 1 天 + 3天 = 第4天
  })

  it('白天/夜晚判定（06:00-18:00 白天）', () => {
    // 初始 8 点，白天
    time.update(0.001)
    expect(time.isNight).toBe(false)

    // 推进到 18:00（从 8:00 到 18:00 = 10 小时 = 10/24 天）
    const hoursToNight = 10
    const secondsToNight = (hoursToNight / 24) * CONFIG.DAY_DURATION
    time = new TimeSystem()
    time.update(secondsToNight)
    expect(time.isNight).toBe(true)
  })

  it('getTimeOfDay() 返回 0-1 范围', () => {
    // 测试多个时间点
    for (let i = 0; i < 10; i++) {
      time.update(CONFIG.DAY_DURATION * 0.1)
      const tod = time.getTimeOfDay()
      expect(tod).toBeGreaterThanOrEqual(0)
      expect(tod).toBeLessThanOrEqual(1)
    }
  })

  it('isNewDay() 只触发一次', () => {
    time.update(CONFIG.DAY_DURATION + 1)
    expect(time.isNewDay()).toBe(true)
    expect(time.isNewDay()).toBe(false) // 第二次调用返回 false
  })

  it('getFormattedTime() 格式正确', () => {
    time.update(0.001)
    const formatted = time.getFormattedTime()
    expect(formatted).toMatch(/^\d{2}:\d{2}$/)
  })
})
