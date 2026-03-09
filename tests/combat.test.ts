// 战斗系统测试
import { describe, it, expect, vi } from 'vitest'

// Mock Three.js
vi.mock('three', () => ({
  Vector3: class {
    x=0; y=0; z=0
    constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}
    set(x:number,y:number,z:number){this.x=x;this.y=y;this.z=z;return this}
    copy(v:any){this.x=v.x;this.y=v.y;this.z=v.z;return this}
    subVectors(a:any,b:any){this.x=a.x-b.x;this.y=a.y-b.y;this.z=a.z-b.z;return this}
    normalize(){const l=Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z);if(l>0){this.x/=l;this.y/=l;this.z/=l};return this}
    length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}
    lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}
    add(v:any){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this}
    sub(v:any){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this}
  },
  Group: class { add(){} position:any={x:0,y:0,z:0,copy(v:any){this.x=v.x;this.y=v.y;this.z=v.z}};rotation:any={y:0,z:0};visible:boolean=true },
  BoxGeometry: class {},
  Mesh: class { position:any={x:0,y:0,z:0,set(){}};rotation:any={x:0,y:0,z:0};visible:boolean=true;add(){} },
  MeshLambertMaterial: class {},
  PerspectiveCamera: class { fov=70;position={x:0,y:0,z:0,set(){}};updateProjectionMatrix(){};lookAt(){} },
}))

vi.mock('../src/engine/InputManager', () => ({
  InputManager: class {}
}))

vi.mock('../src/engine/Physics', () => ({
  Physics: class { moveEntity(){return{grounded:true}}; collidesWithWorld(){return false} },
  makeAABB: () => ({}),
  aabbOverlap: () => false,
}))

import { CONFIG } from '../src/data/config'
import { Player } from '../src/entities/Player'
import { Mutant } from '../src/entities/Mutant'

describe('战斗数值', () => {
  it('剑伤害 25', () => {
    expect(CONFIG.SWORD_DAMAGE).toBe(25)
  })

  it('变异人 50 HP', () => {
    expect(CONFIG.MUTANT_HP).toBe(50)
    const mutant = new Mutant(0, 0, 0)
    expect(mutant.hp).toBe(50)
  })

  it('2 剑击杀变异人', () => {
    const mutant = new Mutant(0, 0, 0)
    mutant.takeDamage(CONFIG.SWORD_DAMAGE) // 第1剑
    expect(mutant.isDead()).toBe(false)
    expect(mutant.hp).toBe(25)
    mutant.takeDamage(CONFIG.SWORD_DAMAGE) // 第2剑
    expect(mutant.isDead()).toBe(true)
    expect(mutant.hp).toBe(0)
  })

  it('攻击间隔 0.5 秒', () => {
    expect(CONFIG.SWORD_COOLDOWN).toBe(0.5)
  })
})

describe('坠落伤害', () => {
  it('配置值正确', () => {
    expect(CONFIG.FALL_DAMAGE_MIN_HEIGHT).toBe(5)
    expect(CONFIG.FALL_DAMAGE_MAX_HEIGHT).toBe(8)
    expect(CONFIG.FALL_DAMAGE_AMOUNT).toBe(30)
  })

  it('< 5 格无伤害（数值逻辑）', () => {
    const player = new Player()
    const fallDist = 4
    // 模拟坠落伤害逻辑
    if (fallDist > CONFIG.FALL_DAMAGE_MAX_HEIGHT) {
      player.hp = 0
    } else if (fallDist > CONFIG.FALL_DAMAGE_MIN_HEIGHT) {
      player.hp = Math.max(0, player.hp - CONFIG.FALL_DAMAGE_AMOUNT)
    }
    expect(player.hp).toBe(CONFIG.MAX_HP) // 无伤害
  })

  it('5-8 格扣 30 HP', () => {
    const player = new Player()
    const fallDist = 6
    if (fallDist > CONFIG.FALL_DAMAGE_MAX_HEIGHT) {
      player.hp = 0
    } else if (fallDist > CONFIG.FALL_DAMAGE_MIN_HEIGHT) {
      player.hp = Math.max(0, player.hp - CONFIG.FALL_DAMAGE_AMOUNT)
    }
    expect(player.hp).toBe(CONFIG.MAX_HP - CONFIG.FALL_DAMAGE_AMOUNT)
  })

  it('> 8 格即死', () => {
    const player = new Player()
    const fallDist = 9
    if (fallDist > CONFIG.FALL_DAMAGE_MAX_HEIGHT) {
      player.hp = 0
    } else if (fallDist > CONFIG.FALL_DAMAGE_MIN_HEIGHT) {
      player.hp = Math.max(0, player.hp - CONFIG.FALL_DAMAGE_AMOUNT)
    }
    expect(player.hp).toBe(0)
    expect(player.isDead()).toBe(true)
  })

  it('Player.takeDamage 战斗伤害有无敌帧', () => {
    let mockTime = 1000
    vi.spyOn(performance, 'now').mockImplementation(() => mockTime)
    const player = new Player()
    player.takeDamage(30, true) // 战斗伤害
    expect(player.hp).toBe(70)
    // 无敌帧内不受伤
    mockTime += 100
    player.takeDamage(10, true)
    expect(player.hp).toBe(70) // 还在无敌帧内
    // 无敌帧结束后可受伤
    mockTime += 1000
    player.takeDamage(100, true)
    expect(player.hp).toBe(0)
    vi.restoreAllMocks()
  })

  it('Player.takeDamage 系统伤害无视无敌帧', () => {
    let mockTime = 1000
    vi.spyOn(performance, 'now').mockImplementation(() => mockTime)
    const player = new Player()
    player.takeDamage(30, true) // 战斗伤害
    expect(player.hp).toBe(70)
    // 系统伤害无视无敌帧
    mockTime += 100
    player.takeDamage(20, false) // 系统伤害（饥饿）
    expect(player.hp).toBe(50)
    vi.restoreAllMocks()
  })

  it('Mutant.takeDamage 正确扣血', () => {
    const mutant = new Mutant(0, 0, 0)
    mutant.takeDamage(30)
    expect(mutant.hp).toBe(20)
    mutant.takeDamage(100)
    expect(mutant.hp).toBe(0) // 不低于 0
  })
})
