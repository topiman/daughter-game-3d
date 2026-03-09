// 配置完整性测试
import { describe, it, expect } from 'vitest'
import { CONFIG } from '../src/data/config'

describe('CONFIG 完整性', () => {
  describe('所有必要配置项存在', () => {
    const requiredKeys = [
      // 世界
      'WORLD_WIDTH', 'WORLD_DEPTH', 'WORLD_HEIGHT', 'BLOCK_SIZE',
      // 视角
      'THIRD_PERSON_FOV', 'FIRST_PERSON_FOV', 'CAMERA_DISTANCE', 'CAMERA_HEIGHT_OFFSET', 'MOUSE_SENSITIVITY',
      // 玩家
      'PLAYER_SPEED', 'PLAYER_SPRINT_SPEED', 'PLAYER_JUMP_VELOCITY', 'PLAYER_WIDTH', 'PLAYER_HEIGHT', 'GRAVITY', 'MAX_FALL_SPEED',
      // 生存
      'MAX_HP', 'MAX_HUNGER', 'HUNGER_PER_DAY', 'HUNGER_ZERO_HP_LOSS', 'NATURAL_HEAL_THRESHOLD', 'NATURAL_HEAL_HP',
      'FALL_DAMAGE_MIN_HEIGHT', 'FALL_DAMAGE_MAX_HEIGHT', 'FALL_DAMAGE_AMOUNT',
      // 战斗
      'SWORD_DAMAGE', 'SWORD_COOLDOWN', 'SWORD_RANGE',
      // 变异人
      'MUTANT_HP', 'MUTANT_DAMAGE', 'MUTANT_ATTACK_INTERVAL', 'MUTANT_SPEED_RATIO', 'MUTANT_SPAWN_MIN_DIST', 'MUTANT_SPAWN_MAX_DIST', 'MUTANT_MAX_PER_NIGHT',
      // 时间
      'DAY_DURATION', 'DAY_START_HOUR', 'DAY_END_HOUR',
      // 物品栏
      'HOTBAR_SIZE',
    ]

    for (const key of requiredKeys) {
      it(`CONFIG.${key} 存在`, () => {
        expect((CONFIG as any)[key], `缺少配置项 ${key}`).toBeDefined()
      })
    }
  })

  describe('数值在合理范围内', () => {
    it('生命值和饥饿值上限合理', () => {
      expect(CONFIG.MAX_HP).toBeGreaterThanOrEqual(50)
      expect(CONFIG.MAX_HP).toBeLessThanOrEqual(200)
      expect(CONFIG.MAX_HUNGER).toBeGreaterThanOrEqual(50)
      expect(CONFIG.MAX_HUNGER).toBeLessThanOrEqual(200)
    })

    it('饥饿消耗值合理', () => {
      expect(CONFIG.HUNGER_PER_DAY).toBeGreaterThan(0)
      expect(CONFIG.HUNGER_PER_DAY).toBeLessThan(CONFIG.MAX_HUNGER)
    })

    it('坠落伤害阈值合理', () => {
      expect(CONFIG.FALL_DAMAGE_MIN_HEIGHT).toBeGreaterThan(0)
      expect(CONFIG.FALL_DAMAGE_MAX_HEIGHT).toBeGreaterThan(CONFIG.FALL_DAMAGE_MIN_HEIGHT)
    })

    it('武器数值合理', () => {
      expect(CONFIG.SWORD_DAMAGE).toBeGreaterThan(0)
      expect(CONFIG.SWORD_COOLDOWN).toBeGreaterThan(0)
      expect(CONFIG.SWORD_COOLDOWN).toBeLessThan(5) // 不会太慢
    })

    it('变异人数值合理', () => {
      expect(CONFIG.MUTANT_HP).toBeGreaterThan(0)
      expect(CONFIG.MUTANT_DAMAGE).toBeGreaterThan(0)
      expect(CONFIG.MUTANT_SPEED_RATIO).toBeGreaterThan(0)
      expect(CONFIG.MUTANT_SPEED_RATIO).toBeLessThanOrEqual(1) // 不应比玩家快
    })

    it('DAY_DURATION = 480 (8分钟)', () => {
      expect(CONFIG.DAY_DURATION).toBe(480)
    })

    it('白天时间设定合理', () => {
      expect(CONFIG.DAY_START_HOUR).toBe(6)
      expect(CONFIG.DAY_END_HOUR).toBe(18)
      expect(CONFIG.DAY_END_HOUR).toBeGreaterThan(CONFIG.DAY_START_HOUR)
    })

    it('物品栏大小合理', () => {
      expect(CONFIG.HOTBAR_SIZE).toBeGreaterThanOrEqual(4)
      expect(CONFIG.HOTBAR_SIZE).toBeLessThanOrEqual(12)
    })

    it('移动速度合理', () => {
      expect(CONFIG.PLAYER_SPEED).toBeGreaterThan(0)
      expect(CONFIG.PLAYER_SPRINT_SPEED).toBeGreaterThan(CONFIG.PLAYER_SPEED)
    })

    it('重力为负值', () => {
      expect(CONFIG.GRAVITY).toBeLessThan(0)
    })
  })
})
