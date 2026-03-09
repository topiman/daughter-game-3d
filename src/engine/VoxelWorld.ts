// 体素世界数据管理
import { BlockType } from '../data/items';
import { CONFIG } from '../data/config';

export class VoxelWorld {
  readonly width: number;
  readonly depth: number;
  readonly height: number;
  private data: Uint8Array;
  // 差量变更追踪（用于存档）
  private changes: Map<string, { x: number; y: number; z: number; blockType: BlockType }> = new Map();

  constructor() {
    this.width = CONFIG.WORLD_WIDTH;
    this.depth = CONFIG.WORLD_DEPTH;
    this.height = CONFIG.WORLD_HEIGHT;
    this.data = new Uint8Array(this.width * this.depth * this.height);
  }

  private index(x: number, y: number, z: number): number {
    return y * this.width * this.depth + z * this.width + x;
  }

  inBounds(x: number, y: number, z: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height && z >= 0 && z < this.depth;
  }

  getBlock(x: number, y: number, z: number): BlockType {
    if (!this.inBounds(x, y, z)) return BlockType.AIR;
    return this.data[this.index(x, y, z)] as BlockType;
  }

  setBlock(x: number, y: number, z: number, type: BlockType): void {
    if (!this.inBounds(x, y, z)) return;
    this.data[this.index(x, y, z)] = type;
    // 记录变更（generate 阶段不追踪，通过 enableTracking 控制）
    if (this._tracking) {
      const key = `${x},${y},${z}`;
      this.changes.set(key, { x, y, z, blockType: type });
    }
  }

  private _tracking = false;
  enableTracking(): void { this._tracking = true; }
  disableTracking(): void { this._tracking = false; }

  getChanges(): Array<{ x: number; y: number; z: number; blockType: number }> {
    return Array.from(this.changes.values());
  }

  applyChanges(changes: Array<{ x: number; y: number; z: number; blockType: number }>): void {
    for (const c of changes) {
      if (this.inBounds(c.x, c.y, c.z)) {
        this.data[this.index(c.x, c.y, c.z)] = c.blockType;
        const key = `${c.x},${c.y},${c.z}`;
        this.changes.set(key, c);
      }
    }
  }

  // 简单 noise 生成地形
  generate(): void {
    // 简单伪随机高度（使用正弦叠加模拟 noise）
    const heightMap: number[][] = [];
    for (let x = 0; x < this.width; x++) {
      heightMap[x] = [];
      for (let z = 0; z < this.depth; z++) {
        // 基础高度4，加上简单 noise 起伏
        const h = 4 + Math.floor(
          Math.sin(x * 0.1) * 1.5 +
          Math.cos(z * 0.15) * 1.5 +
          Math.sin((x + z) * 0.08) * 1
        );
        heightMap[x][z] = Math.max(2, Math.min(8, h));
      }
    }

    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.depth; z++) {
        const surfaceY = heightMap[x][z];
        
        // y=0: 基岩
        this.setBlock(x, 0, z, BlockType.BEDROCK);
        
        // y=1 到 surfaceY-1: 干土地
        for (let y = 1; y < surfaceY; y++) {
          this.setBlock(x, y, z, BlockType.DIRT);
        }
        
        // surfaceY: 草方块
        this.setBlock(x, surfaceY, z, BlockType.GRASS);

        // 草方块上方随机放置 TALL_GRASS
        if (Math.random() < CONFIG.GRASS_SPAWN_CHANCE && surfaceY + 1 < this.height) {
          this.setBlock(x, surfaceY + 1, z, BlockType.TALL_GRASS);
        }
      }
    }

    // 放置水方块在世界中心地面上方1格
    const cx = Math.floor(this.width / 2);
    const cz = Math.floor(this.depth / 2);
    const surfaceY = heightMap[cx][cz];
    this.setBlock(cx, surfaceY + 1, cz, BlockType.WATER_BLOCK);
  }

  // 获取地面高度（最高非空方块的y+1）
  getSurfaceHeight(x: number, z: number): number {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    for (let y = this.height - 1; y >= 0; y--) {
      if (this.getBlock(ix, y, iz) !== BlockType.AIR) {
        return y + 1;
      }
    }
    return 1;
  }

  // 检查位置是否有支撑（下面有方块或者相邻有方块）
  hasSupport(x: number, y: number, z: number): boolean {
    // 下方有方块就有支撑
    if (y === 0) return true;
    if (this.getBlock(x, y - 1, z) !== BlockType.AIR) return true;
    // 检查四个相邻方块
    if (this.getBlock(x - 1, y, z) !== BlockType.AIR) return true;
    if (this.getBlock(x + 1, y, z) !== BlockType.AIR) return true;
    if (this.getBlock(x, y, z - 1) !== BlockType.AIR) return true;
    if (this.getBlock(x, y, z + 1) !== BlockType.AIR) return true;
    return false;
  }

  // 射线检测（DDA算法）
  raycast(origin: { x: number; y: number; z: number }, direction: { x: number; y: number; z: number }, maxDist: number): { x: number; y: number; z: number; nx: number; ny: number; nz: number } | null {
    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);
    
    const dx = direction.x;
    const dy = direction.y;
    const dz = direction.z;
    
    const stepX = dx > 0 ? 1 : -1;
    const stepY = dy > 0 ? 1 : -1;
    const stepZ = dz > 0 ? 1 : -1;
    
    const tDeltaX = dx !== 0 ? Math.abs(1 / dx) : Infinity;
    const tDeltaY = dy !== 0 ? Math.abs(1 / dy) : Infinity;
    const tDeltaZ = dz !== 0 ? Math.abs(1 / dz) : Infinity;
    
    let tMaxX = dx !== 0 ? ((dx > 0 ? (x + 1 - origin.x) : (origin.x - x)) * tDeltaX) : Infinity;
    let tMaxY = dy !== 0 ? ((dy > 0 ? (y + 1 - origin.y) : (origin.y - y)) * tDeltaY) : Infinity;
    let tMaxZ = dz !== 0 ? ((dz > 0 ? (z + 1 - origin.z) : (origin.z - z)) * tDeltaZ) : Infinity;
    
    let t = 0;
    let nx = 0, ny = 0, nz = 0;
    
    while (t < maxDist) {
      const block = this.getBlock(x, y, z);
      if (block !== BlockType.AIR) {
        return { x, y, z, nx, ny, nz };
      }
      
      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          t = tMaxX;
          tMaxX += tDeltaX;
          nx = -stepX; ny = 0; nz = 0;
          x += stepX;
        } else {
          t = tMaxZ;
          tMaxZ += tDeltaZ;
          nx = 0; ny = 0; nz = -stepZ;
          z += stepZ;
        }
      } else {
        if (tMaxY < tMaxZ) {
          t = tMaxY;
          tMaxY += tDeltaY;
          nx = 0; ny = -stepY; nz = 0;
          y += stepY;
        } else {
          t = tMaxZ;
          tMaxZ += tDeltaZ;
          nx = 0; ny = 0; nz = -stepZ;
          z += stepZ;
        }
      }
    }
    
    return null;
  }
}
