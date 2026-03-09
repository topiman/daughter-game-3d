# P1 技术设计文档

## 新增/修改模块

### 1. 昼夜循环强化 — `Renderer.ts` 修改
- 添加太阳/月亮 Mesh（黄色/白色球体）
- 太阳沿弧线运动（白天从东到西）
- 月亮夜晚出现
- DirectionalLight 方向跟随太阳位置
- 黄昏/黎明各30秒颜色渐变（已有基础，增强过渡色）

### 2. 天气系统 — `systems/WeatherSystem.ts` 新增
```ts
class WeatherSystem {
  currentWeather: 'clear' | 'rain' | 'snow'
  private weatherTimer: number
  private particles: THREE.Points | null
  
  update(dt: number, scene: THREE.Scene): void  // 更新粒子 + 随机切换天气
  startRain(scene: THREE.Scene): void
  startSnow(scene: THREE.Scene): void
  stopWeather(scene: THREE.Scene): void
  getWeather(): string
}
```
- 每个游戏天有 30% 概率触发天气
- 下雨：蓝色细长粒子快速下落
- 下雪：白色圆形粒子缓慢飘落
- 粒子跟随玩家位置（始终在头顶区域）

### 3. 家具交互 — `systems/FurnitureSystem.ts` 新增
```ts
class FurnitureSystem {
  interact(blockType: BlockType, player: Player, timeSystem: TimeSystem): InteractResult
}
interface InteractResult {
  success: boolean
  message: string
  action?: 'skip_night' | 'rest' | 'toilet'
}
```
- 床（BlockType.BED）：按E → 跳过夜晚 + 恢复20%HP，只在夜晚可用
- 沙发（BlockType.SOFA）：按E → 减缓饥饿消耗速度50%，持续30秒
- 马桶：新增 BlockType.TOILET → 按E → 播放趣味粒子 + 音效

### 4. 小狗伙伴 — `entities/Dog.ts` 新增
```ts
class Dog {
  mesh: THREE.Group
  position: THREE.Vector3
  private followTarget: THREE.Vector3
  private isBarking: boolean
  
  update(dt: number, playerPos: THREE.Vector3, mutants: Mutant[], physics: Physics): void
  isNearMutant(mutants: Mutant[]): boolean
}
```
- 方块狗模型（BoxGeometry 拼成，棕色身体+黑色鼻子）
- 跟随玩家，保持2-3格距离
- 变异人进入8格范围时 isBarking=true，头上显示"汪！"
- 不参与战斗

### 5. 音频系统 — `systems/AudioSystem.ts` 新增
```ts
class AudioSystem {
  private audioCtx: AudioContext
  private bgmGain: GainNode
  private sfxGain: GainNode
  private bgmPlaying: boolean
  
  playBGM(): void          // 生成8-bit风格循环BGM
  stopBGM(): void
  setBGMVolume(v: number): void  // 0-1
  setSFXVolume(v: number): void
  playSFX(type: 'jump' | 'sword' | 'pickup' | 'eat' | 'hurt' | 'death' | 'bark' | 'place' | 'break' | 'toilet'): void
}
```
- Web Audio API 代码合成所有音效
- BGM：简单的8-bit循环旋律（C大调，欢快风格）
- 音效：用 OscillatorNode 生成对应频率和波形

### 6. 照明系统 — `systems/LightingSystem.ts` 新增
```ts
class LightingSystem {
  private lights: Map<string, THREE.PointLight>
  
  addLight(x: number, y: number, z: number, radius: number, scene: THREE.Scene): void
  removeLight(x: number, y: number, z: number, scene: THREE.Scene): void
  isInLight(x: number, y: number, z: number): boolean  // 检查坐标是否在光照范围
  getLights(): Array<{x: number, y: number, z: number, radius: number}>
}
```
- 路灯：BlockType.LAMP → PointLight 半径5格，暖黄色
- 小夜灯：BlockType.NIGHTLIGHT → PointLight 半径3格，柔白色
- SpawnSystem 检查 isInLight() 避免在光照区生成变异人

### 7. 帐篷 — 复用 BlockType + 区域检测
```ts
// PlacementSystem 中新增
isTentArea(x: number, y: number, z: number, world: VoxelWorld): boolean
```
- BlockType.TENT，占 2×2×2
- 检测玩家是否在帐篷内（以帐篷方块为中心 2 格范围）
- 帐篷内变异人不主动攻击（SpawnSystem/Mutant AI 检查）

### 8. 收纳家具 — `systems/StorageSystem.ts` 新增
```ts
class StorageSystem {
  private storages: Map<string, ItemSlot[]>  // key = "x,y,z"
  
  openStorage(x: number, y: number, z: number): ItemSlot[] | null
  addToStorage(key: string, item: ItemDef): boolean
  removeFromStorage(key: string, index: number): ItemDef | null
}
```
- 鞋柜 BlockType.SHOE_CABINET：4格
- 衣柜 BlockType.WARDROBE：4格
- 按E打开 → HUD 显示存储界面

## 新增 BlockType
```ts
// 在现有基础上新增：
TOILET = 8,
LAMP = 9,
NIGHTLIGHT = 10,
TENT = 11,
SHOE_CABINET = 12,
WARDROBE = 13,
```

## 新增物品定义
每个新 BlockType 对应一个 ITEMS 条目，都有独立 icon/iconColor/纹理。

## 数值配置新增（config.ts）
```ts
// 天气
WEATHER_CHANCE: 0.3,          // 每天触发概率
WEATHER_DURATION: 120,         // 天气持续秒数（现实时间）

// 家具
BED_HP_RESTORE: 20,           // 床恢复 20% HP
SOFA_HUNGER_SLOW_DURATION: 30, // 沙发效果持续 30 秒
SOFA_HUNGER_SLOW_RATE: 0.5,   // 饥饿消耗速度 ×0.5

// 小狗
DOG_FOLLOW_DIST: 2.5,         // 跟随距离
DOG_BARK_RANGE: 8,            // 吠叫触发范围
DOG_SPEED: 4,                 // 移动速度（略快于玩家）

// 照明
LAMP_RADIUS: 5,               // 路灯光照半径
NIGHTLIGHT_RADIUS: 3,         // 小夜灯光照半径

// 帐篷
TENT_SAFE_RADIUS: 2,          // 帐篷庇护范围

// 收纳
STORAGE_SLOTS: 4,             // 每个收纳家具的格数
```
