// 小狗伙伴测试
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('three', () => {
  class Vector3 {
    x: number; y: number; z: number
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z }
    copy(v: any) { this.x = v.x; this.y = v.y; this.z = v.z; return this }
    subVectors(a: any, b: any) { this.x = a.x - b.x; this.y = a.y - b.y; this.z = a.z - b.z; return this }
    normalize() { const l = Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z); if(l>0){this.x/=l;this.y/=l;this.z/=l}; return this }
    length() { return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z) }
    distanceTo(v: any) { const dx=this.x-v.x,dy=this.y-v.y,dz=this.z-v.z; return Math.sqrt(dx*dx+dy*dy+dz*dz) }
    set(x: number, y: number, z: number) { this.x = x; this.y = y; this.z = z }
    multiplyScalar(s: number) { this.x *= s; this.y *= s; this.z *= s; return this }
    add(v: any) { this.x += v.x; this.y += v.y; this.z += v.z; return this }
  }
  class Group {
    children: any[] = []
    position = new Vector3()
    rotation = { y: 0 }
    add = vi.fn()
  }
  class BoxGeometry { constructor(..._: any[]) {} }
  class Mesh {
    position = new Vector3()
    rotation = { x: 0, y: 0, z: 0 }
    add = vi.fn()
    constructor(..._: any[]) {}
  }
  class MeshLambertMaterial { constructor(..._: any[]) {} }
  return { Vector3, Group, BoxGeometry, Mesh, MeshLambertMaterial }
})

import { Dog } from '../src/entities/Dog'
import { CONFIG } from '../src/data/config'

describe('Dog', () => {
  let dog: Dog

  beforeEach(() => {
    dog = new Dog()
  })

  it('初始状态不吠叫', () => {
    expect(dog.isBarking).toBe(false)
  })

  it('变异人在 DOG_BARK_RANGE 内 → 吠叫', () => {
    // 把狗放在原点
    dog.position.set(0, 0, 0)
    const mutant = { position: { x: CONFIG.DOG_BARK_RANGE - 1, y: 0, z: 0 } } as any
    // isNearMutant uses this.position.distanceTo
    expect(dog.isNearMutant([mutant])).toBe(true)
  })

  it('变异人在 DOG_BARK_RANGE 外 → 不吠叫', () => {
    dog.position.set(0, 0, 0)
    const mutant = { position: { x: CONFIG.DOG_BARK_RANGE + 5, y: 0, z: 0 } } as any
    expect(dog.isNearMutant([mutant])).toBe(false)
  })

  it('无变异人 → 不吠叫', () => {
    expect(dog.isNearMutant([])).toBe(false)
  })
})
