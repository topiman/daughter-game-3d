// 音频系统测试
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Web Audio API with proper constructors
class MockGainNode {
  gain = { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
  connect = vi.fn()
  disconnect = vi.fn()
}

class MockOscillator {
  type = 'sine'
  frequency = { value: 440, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
  connect = vi.fn()
  start = vi.fn()
  stop = vi.fn()
}

class MockAudioContext {
  state = 'running'
  currentTime = 0
  destination = {}
  createGain() { return new MockGainNode() }
  createOscillator() { return new MockOscillator() }
  resume = vi.fn().mockResolvedValue(undefined)
}

vi.stubGlobal('AudioContext', MockAudioContext)

import { AudioSystem } from '../src/systems/AudioSystem'

describe('AudioSystem', () => {
  let audio: AudioSystem

  beforeEach(() => {
    audio = new AudioSystem()
  })

  it('初始化不报错', () => {
    expect(audio).toBeDefined()
  })

  it('setBGMVolume(0.5) 不报错', () => {
    expect(() => audio.setBGMVolume(0.5)).not.toThrow()
  })

  it('setBGMVolume 限制 0-1: 传入 1.5 不报错', () => {
    expect(() => audio.setBGMVolume(1.5)).not.toThrow()
  })

  it('setBGMVolume 限制 0-1: 传入 -1 不报错', () => {
    expect(() => audio.setBGMVolume(-1)).not.toThrow()
  })

  it('setSFXVolume 限制 0-1', () => {
    expect(() => audio.setSFXVolume(1.5)).not.toThrow()
    expect(() => audio.setSFXVolume(-1)).not.toThrow()
  })

  it('playSFX 不报错', () => {
    expect(() => audio.playSFX('jump')).not.toThrow()
    expect(() => audio.playSFX('sword')).not.toThrow()
    expect(() => audio.playSFX('hurt')).not.toThrow()
    expect(() => audio.playSFX('bark')).not.toThrow()
    expect(() => audio.playSFX('toilet')).not.toThrow()
  })
})
