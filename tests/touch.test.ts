// 触控输入测试
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('three', () => ({
  Vector3: vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({ x, y, z })),
}))

import { isTouchDevice, VirtualJoystick } from '../src/ui/TouchControls'

describe('触控输入', () => {
  describe('isTouchDevice()', () => {
    it('有 ontouchstart → true', () => {
      vi.stubGlobal('window', { ontouchstart: null })
      expect(isTouchDevice()).toBe(true)
      vi.unstubAllGlobals()
    })

    it('无 ontouchstart → false', () => {
      vi.stubGlobal('window', {})
      expect(isTouchDevice()).toBe(false)
      vi.unstubAllGlobals()
    })
  })

  describe('VirtualJoystick', () => {
    let joystick: VirtualJoystick

    beforeEach(() => {
      joystick = new VirtualJoystick()
    })

    it('初始状态 dx/dy 为 0', () => {
      expect(joystick.dx).toBe(0)
      expect(joystick.dy).toBe(0)
    })

    it('拖到右边 → dx > 0', () => {
      joystick.handleMove(80, 0) // 向右拖动
      expect(joystick.dx).toBeGreaterThan(0)
    })

    it('拖到左边 → dx < 0', () => {
      joystick.handleMove(-80, 0)
      expect(joystick.dx).toBeLessThan(0)
    })

    it('拖到上面 → dy < 0（屏幕坐标）', () => {
      joystick.handleMove(0, -80)
      expect(joystick.dy).toBeLessThan(0)
    })

    it('松开归零', () => {
      joystick.handleMove(50, 50)
      joystick.handleEnd()
      expect(joystick.dx).toBe(0)
      expect(joystick.dy).toBe(0)
    })

    it('距离超过最大半径时 clamp', () => {
      joystick.handleMove(1000, 0) // 超远
      expect(joystick.dx).toBeLessThanOrEqual(1)
      expect(joystick.dx).toBeGreaterThan(0)
    })
  })
})
