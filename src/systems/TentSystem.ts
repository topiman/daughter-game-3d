// 帐篷庇护区域检测
import { BlockType } from '../data/items';
import { CONFIG } from '../data/config';

interface WorldLike {
  getBlock(x: number, y: number, z: number): number;
  width: number;
  depth: number;
  height: number;
}

/**
 * 检查坐标是否在帐篷庇护范围内
 * 搜索附近是否有 TENT 方块，距离在 TENT_SAFE_RADIUS 内则为安全
 */
export function isTentArea(px: number, py: number, pz: number, world: WorldLike): boolean {
  const r = CONFIG.TENT_SAFE_RADIUS;
  const minX = Math.max(0, Math.floor(px - r));
  const maxX = Math.min(world.width - 1, Math.floor(px + r));
  const minY = Math.max(0, Math.floor(py - r));
  const maxY = Math.min(world.height - 1, Math.floor(py + r));
  const minZ = Math.max(0, Math.floor(pz - r));
  const maxZ = Math.min(world.depth - 1, Math.floor(pz + r));

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        if (world.getBlock(x, y, z) === BlockType.TENT) {
          const dx = px - x;
          const dy = py - y;
          const dz = pz - z;
          if (Math.sqrt(dx * dx + dy * dy + dz * dz) <= r) {
            return true;
          }
        }
      }
    }
  }
  return false;
}
