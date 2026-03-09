// AABB 碰撞检测 + 重力
import { VoxelWorld } from './VoxelWorld';
import { BlockType } from '../data/items';
import { CONFIG } from '../data/config';

export interface AABB {
  minX: number; minY: number; minZ: number;
  maxX: number; maxY: number; maxZ: number;
}

export function makeAABB(x: number, y: number, z: number, w: number, h: number, d: number): AABB {
  return {
    minX: x - w / 2,
    minY: y,
    minZ: z - d / 2,
    maxX: x + w / 2,
    maxY: y + h,
    maxZ: z + d / 2,
  };
}

export function aabbOverlap(a: AABB, b: AABB): boolean {
  return a.minX < b.maxX && a.maxX > b.minX &&
         a.minY < b.maxY && a.maxY > b.minY &&
         a.minZ < b.maxZ && a.maxZ > b.minZ;
}

export class Physics {
  constructor(private world: VoxelWorld) {}

  // 检查 AABB 与世界方块的碰撞
  collidesWithWorld(box: AABB): boolean {
    const startX = Math.floor(box.minX);
    const endX = Math.floor(box.maxX);
    const startY = Math.floor(box.minY);
    const endY = Math.floor(box.maxY);
    const startZ = Math.floor(box.minZ);
    const endZ = Math.floor(box.maxZ);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        for (let z = startZ; z <= endZ; z++) {
          if (this.world.getBlock(x, y, z) !== BlockType.AIR) {
            // 方块的AABB
            const blockBox: AABB = {
              minX: x, minY: y, minZ: z,
              maxX: x + 1, maxY: y + 1, maxZ: z + 1,
            };
            if (aabbOverlap(box, blockBox)) return true;
          }
        }
      }
    }

    // 世界边界
    if (box.minX < 0 || box.maxX > this.world.width ||
        box.minZ < 0 || box.maxZ > this.world.depth ||
        box.minY < 0) {
      return true;
    }

    return false;
  }

  // 移动实体，返回修正后的位置和是否着地
  moveEntity(
    pos: { x: number; y: number; z: number },
    vel: { x: number; y: number; z: number },
    width: number,
    height: number,
    dt: number
  ): { grounded: boolean; hitHead: boolean } {
    let grounded = false;
    let hitHead = false;

    // 分轴检测（先X，再Y，再Z）
    // X轴
    const newX = pos.x + vel.x * dt;
    const testBoxX = makeAABB(newX, pos.y, pos.z, width, height, width);
    if (!this.collidesWithWorld(testBoxX)) {
      pos.x = newX;
    } else {
      vel.x = 0;
    }

    // Y轴
    const newY = pos.y + vel.y * dt;
    const testBoxY = makeAABB(pos.x, newY, pos.z, width, height, width);
    if (!this.collidesWithWorld(testBoxY)) {
      pos.y = newY;
    } else {
      if (vel.y < 0) grounded = true;
      if (vel.y > 0) hitHead = true;
      vel.y = 0;
    }

    // Z轴
    const newZ = pos.z + vel.z * dt;
    const testBoxZ = makeAABB(pos.x, pos.y, newZ, width, height, width);
    if (!this.collidesWithWorld(testBoxZ)) {
      pos.z = newZ;
    } else {
      vel.z = 0;
    }

    return { grounded, hitHead };
  }
}
