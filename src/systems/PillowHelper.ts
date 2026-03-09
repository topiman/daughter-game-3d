// 抱枕增强效果辅助 — 检查1格范围内是否有抱枕
import { BlockType } from '../data/items';

export function hasPillowNearby(world: { getBlock(x: number, y: number, z: number): BlockType }, x: number, y: number, z: number): boolean {
  // 检查6个相邻方向（上下左右前后）
  const offsets = [
    [1, 0, 0], [-1, 0, 0],
    [0, 1, 0], [0, -1, 0],
    [0, 0, 1], [0, 0, -1],
  ];
  for (const [dx, dy, dz] of offsets) {
    if (world.getBlock(x + dx, y + dy, z + dz) === BlockType.PILLOW) {
      return true;
    }
  }
  return false;
}
