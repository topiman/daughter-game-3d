# 💧 水方块生存游戏 3D 重制版

一个可爱体素风的 3D 方块生存游戏。从神奇的水方块里捞物资，建造庇护所、维持生存、对抗变异人！

## 技术栈

- Three.js + Vite + TypeScript
- Greedy Meshing 优化体素渲染
- Canvas API 生成纹理图集（零外部资源依赖）
- HTML overlay HUD
- 自写 AABB 碰撞检测

## 操作

| 操作 | 按键 |
|------|------|
| 移动 | WASD |
| 视角 | 鼠标 |
| 跳跃 | 空格 |
| 破坏/攻击 | 左键 |
| 放置 | 右键 |
| 交互 | E |
| 切换视角 | V |
| 选物品 | 1-8 / 滚轮 |
| 暂停 | ESC |

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```
