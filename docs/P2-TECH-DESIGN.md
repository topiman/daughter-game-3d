# P2 技术设计文档

## 1. 雪人 — 装饰物
- 新增 BlockType.SNOWMAN
- 只在下雪天气时可建造（水方块掉落或手动放置时检查天气）
- 放置后世界中显示：2个白色球体+胡萝卜鼻+帽子（BoxGeometry拼成）
- 晴天时启动融化计时器：120秒后消失
- 不可交互，纯装饰
- 独立纹理（白色带雪花纹理）

## 2. 草 — 装饰物
- 新增 BlockType.TALL_GRASS
- 世界生成时在草方块上方随机放置（约15%的草方块上）
- 用十字交叉面片渲染（2个垂直交叉的平面，透明材质）
- 微风摆动：顶部顶点随时间做小幅正弦偏移
- 可破坏但不回收（纯装饰）
- 不阻挡移动

## 3. 抱枕 — 增强道具
- 新增 BlockType.PILLOW
- 可从水方块获取，可放置
- 放置在床旁边（1格内）：床回血效果从20%→35%
- 放置在沙发旁边（1格内）：沙发减缓效果从50%→30%（更强）
- FurnitureSystem.interact() 检查周围是否有抱枕

## 4. 存档系统 — `systems/SaveSystem.ts`
```ts
interface SaveData {
  version: number
  player: { x, y, z, hp, hunger, kills, daysSurvived }
  inventory: { slots: Array<{itemId, count} | null> }
  time: { elapsed, gameDay }
  world: { changes: Array<{x, y, z, blockType}> }  // 只存变更，不存整个世界
  dog: { owned: boolean }
  storages: Record<string, Array<{itemId, count} | null>>
}

class SaveSystem {
  save(data: SaveData): void           // localStorage.setItem
  load(): SaveData | null              // localStorage.getItem + JSON.parse
  hasSave(): boolean                   // 是否有存档
  deleteSave(): void                   // 删除存档
  autoSave(data: SaveData): void       // 每60秒自动存
}
```
- localStorage key: 'daughter-game-3d-save'
- 自动存档：每60秒
- 手动存档：暂停菜单中"保存"按钮
- 读档：标题画面"继续游戏"按钮（有存档时显示）
- 世界变更用差量存储（只记录玩家放置/破坏的方块坐标+类型）

## 5. 移动端适配（iPad优先）
### 触控检测
- `InputManager.ts` 扩展：检测 touch 事件
- 如果检测到触屏设备，自动显示虚拟控件

### 虚拟摇杆（左下角）
- Canvas 绘制：外圈 + 内圈拖动
- 映射到 WASD 方向 + 速度
- 半径80px

### 虚拟按钮（右侧）
- 跳跃按钮（大，右下）
- 攻击/破坏按钮（中，右中）
- 交互(E)按钮（中，右上）
- HTML 按钮，半透明圆形
- 放置：双击屏幕中心区域（或专用按钮）

### 视角控制
- 右半屏触摸拖动 = 鼠标移动（控制视角）
- 不需要 Pointer Lock（移动端不支持）

### 物品栏
- 点击切换（已支持 HTML 元素）
- 增大触控区域到 56px

### 布局
```
┌──────────────────────────────┐
│ HP  饥饿            时钟 天数 │
│                              │
│                    + (准星)   │
│                              │
│                      [攻击]  │
│  [摇杆]              [交互]  │
│                      [跳跃]  │
│  [ 物品栏 1-8 ]              │
└──────────────────────────────┘
```

## 6. 指针锁定提示
- 标题画面增加提示文字："点击画面开始游戏"
- 游戏内首次进入显示操作提示（3秒淡出）：
  "WASD移动 | 鼠标视角 | 空格跳跃 | 左键攻击 | 右键放置 | E交互"
- ESC暂停时提示"按ESC已暂停"
- 移动端不显示键鼠提示，显示触控提示

## 新增 BlockType
```ts
SNOWMAN = 14,
TALL_GRASS = 15,
PILLOW = 16,
```

## 新增配置 (config.ts)
```ts
SNOWMAN_MELT_TIME: 120,        // 融化时间（秒）
GRASS_SPAWN_CHANCE: 0.15,      // 草生成概率
PILLOW_BED_BOOST: 0.35,        // 有抱枕时床回血35%
PILLOW_SOFA_BOOST: 0.3,        // 有抱枕时沙发减缓30%
AUTOSAVE_INTERVAL: 60,         // 自动存档间隔（秒）
```
