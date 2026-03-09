// 存档系统测试
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('three', () => ({
  Vector3: vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({ x, y, z })),
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
    _store: store,
  }
})()

vi.stubGlobal('localStorage', localStorageMock)

import { SaveSystem, SaveData } from '../src/systems/SaveSystem'

function makeSaveData(overrides?: Partial<SaveData>): SaveData {
  return {
    version: 1,
    player: { x: 10, y: 5, z: 10, hp: 80, hunger: 60, kills: 2, daysSurvived: 3 },
    inventory: { slots: [{ itemId: 'sword', count: 1 }, null, { itemId: 'bread', count: 5 }] },
    time: { elapsed: 300, gameDay: 3 },
    world: { changes: [{ x: 10, y: 5, z: 10, blockType: 2 }, { x: 11, y: 5, z: 10, blockType: 0 }] },
    dog: { owned: true },
    storages: { '10_5_10': [{ itemId: 'bread', count: 3 }, null] },
    ...overrides,
  }
}

describe('SaveSystem', () => {
  let save: SaveSystem

  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    save = new SaveSystem()
  })

  it('save() 后 hasSave() = true', () => {
    save.save(makeSaveData())
    expect(save.hasSave()).toBe(true)
  })

  it('无存档时 hasSave() = false', () => {
    expect(save.hasSave()).toBe(false)
  })

  it('无存档时 load() = null', () => {
    expect(save.load()).toBeNull()
  })

  it('load() 返回保存的数据，各字段一致', () => {
    const data = makeSaveData()
    save.save(data)
    const loaded = save.load()
    expect(loaded).not.toBeNull()
    expect(loaded!.version).toBe(data.version)
    expect(loaded!.player.hp).toBe(data.player.hp)
    expect(loaded!.player.hunger).toBe(data.player.hunger)
    expect(loaded!.player.kills).toBe(data.player.kills)
    expect(loaded!.time.elapsed).toBe(data.time.elapsed)
    expect(loaded!.time.gameDay).toBe(data.time.gameDay)
    expect(loaded!.dog.owned).toBe(true)
  })

  it('deleteSave() 后 hasSave() = false', () => {
    save.save(makeSaveData())
    expect(save.hasSave()).toBe(true)
    save.deleteSave()
    expect(save.hasSave()).toBe(false)
  })

  it('save 的 version 字段存在', () => {
    save.save(makeSaveData())
    const loaded = save.load()
    expect(loaded!.version).toBeDefined()
    expect(typeof loaded!.version).toBe('number')
  })

  it('世界变更差量存储正确', () => {
    const data = makeSaveData({
      world: { changes: [
        { x: 5, y: 3, z: 8, blockType: 2 },
        { x: 6, y: 3, z: 8, blockType: 0 },
      ] },
    })
    save.save(data)
    const loaded = save.load()
    expect(loaded!.world.changes).toHaveLength(2)
    expect(loaded!.world.changes[0]).toEqual({ x: 5, y: 3, z: 8, blockType: 2 })
    expect(loaded!.world.changes[1]).toEqual({ x: 6, y: 3, z: 8, blockType: 0 })
  })

  it('物品栏存储/恢复正确', () => {
    const data = makeSaveData({
      inventory: { slots: [{ itemId: 'sword', count: 1 }, null, { itemId: 'bread', count: 16 }] },
    })
    save.save(data)
    const loaded = save.load()
    expect(loaded!.inventory.slots[0]).toEqual({ itemId: 'sword', count: 1 })
    expect(loaded!.inventory.slots[1]).toBeNull()
    expect(loaded!.inventory.slots[2]).toEqual({ itemId: 'bread', count: 16 })
  })

  it('存储空间数据正确保存/恢复', () => {
    const data = makeSaveData({
      storages: { '5_3_8': [{ itemId: 'wood_block', count: 10 }, null, null, { itemId: 'bread', count: 2 }] },
    })
    save.save(data)
    const loaded = save.load()
    expect(loaded!.storages['5_3_8']).toBeDefined()
    expect(loaded!.storages['5_3_8'][0]).toEqual({ itemId: 'wood_block', count: 10 })
    expect(loaded!.storages['5_3_8'][3]).toEqual({ itemId: 'bread', count: 2 })
  })

  it('损坏的 JSON 不崩溃，load() 返回 null', () => {
    localStorage.setItem('daughter-game-3d-save', '{broken json!!!')
    const loaded = save.load()
    expect(loaded).toBeNull()
  })
})
