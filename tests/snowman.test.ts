// 雪人机制测试
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('three', () => ({
  Vector3: vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({ x, y, z })),
}))

import { CONFIG } from '../src/data/config'
import { BlockType } from '../src/data/items'

// 导入雪人相关工具函数
import { canPlaceSnowman, createSnowmanTracker, SnowmanTracker } from '../src/systems/SnowmanSystem'

describe('雪人机制', () => {
  describe('放置条件', () => {
    it('下雪天可以放置雪人', () => {
      expect(canPlaceSnowman('snow')).toBe(true)
    })

    it('非下雪天不能放置雪人', () => {
      expect(canPlaceSnowman('clear')).toBe(false)
      expect(canPlaceSnowman('rain')).toBe(false)
    })
  })

  describe('融化计时器', () => {
    let tracker: SnowmanTracker

    beforeEach(() => {
      tracker = createSnowmanTracker()
    })

    it('添加雪人时初始化融化计时器', () => {
      tracker.addSnowman(10, 5, 10)
      const snowmen = tracker.getAll()
      expect(snowmen).toHaveLength(1)
      expect(snowmen[0].meltTimer).toBe(CONFIG.SNOWMAN_MELT_TIME)
    })

    it('晴天时计时递减', () => {
      tracker.addSnowman(10, 5, 10)
      tracker.update(10, 'clear') // 10秒过去
      const snowmen = tracker.getAll()
      expect(snowmen[0].meltTimer).toBe(CONFIG.SNOWMAN_MELT_TIME - 10)
    })

    it('下雪天不计时', () => {
      tracker.addSnowman(10, 5, 10)
      tracker.update(10, 'snow')
      const snowmen = tracker.getAll()
      expect(snowmen[0].meltTimer).toBe(CONFIG.SNOWMAN_MELT_TIME)
    })

    it('计时结束后雪人标记为已融化', () => {
      tracker.addSnowman(10, 5, 10)
      tracker.update(CONFIG.SNOWMAN_MELT_TIME + 1, 'clear')
      const melted = tracker.getMelted()
      expect(melted).toHaveLength(1)
      expect(melted[0]).toEqual({ x: 10, y: 5, z: 10 })
    })

    it('融化后从追踪列表移除', () => {
      tracker.addSnowman(10, 5, 10)
      tracker.update(CONFIG.SNOWMAN_MELT_TIME + 1, 'clear')
      tracker.clearMelted()
      expect(tracker.getAll()).toHaveLength(0)
    })
  })
})
