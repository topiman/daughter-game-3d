// 放置/破坏系统 — 射线检测 + 半透明预览
import * as THREE from 'three';
import { VoxelWorld } from '../engine/VoxelWorld';
import { Player } from '../entities/Player';
import { InventorySystem } from './InventorySystem';
import { BlockType, ItemCategory, ITEMS } from '../data/items';
import { CONFIG } from '../data/config';
import { makeAABB, aabbOverlap } from '../engine/Physics';

export class PlacementSystem {
  private previewMesh: THREE.Mesh;
  private previewMaterial: THREE.MeshBasicMaterial;
  private scene: THREE.Scene;
  
  // 当前瞄准的方块和放置位置
  hitBlock: { x: number; y: number; z: number } | null = null;
  placeBlock: { x: number; y: number; z: number } | null = null;
  canPlace = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.previewMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.4,
      color: 0x00FF00,
      depthWrite: false,
    });
    const geo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    this.previewMesh = new THREE.Mesh(geo, this.previewMaterial);
    this.previewMesh.visible = false;
    scene.add(this.previewMesh);
  }

  update(player: Player, world: VoxelWorld, inventory: InventorySystem): void {
    const origin = player.getEyePosition();
    const direction = player.getLookDirection();
    
    const hit = world.raycast(
      { x: origin.x, y: origin.y, z: origin.z },
      { x: direction.x, y: direction.y, z: direction.z },
      CONFIG.PLACEMENT_RANGE
    );

    if (hit) {
      this.hitBlock = { x: hit.x, y: hit.y, z: hit.z };
      this.placeBlock = { x: hit.x + hit.nx, y: hit.y + hit.ny, z: hit.z + hit.nz };

      // 显示预览
      if (inventory.isHoldingPlaceable()) {
        this.previewMesh.visible = true;
        this.previewMesh.position.set(
          this.placeBlock.x + 0.5,
          this.placeBlock.y + 0.5,
          this.placeBlock.z + 0.5
        );

        // 检查是否可放置
        this.canPlace = this.checkCanPlace(world, player, this.placeBlock.x, this.placeBlock.y, this.placeBlock.z, inventory);
        this.previewMaterial.color.setHex(this.canPlace ? 0x00FF00 : 0xFF0000);
      } else {
        this.previewMesh.visible = false;
      }
    } else {
      this.hitBlock = null;
      this.placeBlock = null;
      this.previewMesh.visible = false;
    }
  }

  private checkCanPlace(world: VoxelWorld, player: Player, x: number, y: number, z: number, inventory: InventorySystem): boolean {
    // 边界检查
    if (!world.inBounds(x, y, z)) return false;
    
    // 不能重叠现有方块
    if (world.getBlock(x, y, z) !== BlockType.AIR) return false;
    
    // 需要支撑
    if (!world.hasSupport(x, y, z)) return false;
    
    // 不能卡玩家
    const placeBox: { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number } = {
      minX: x, minY: y, minZ: z,
      maxX: x + 1, maxY: y + 1, maxZ: z + 1,
    };
    const playerBox = player.getAABB();
    if (aabbOverlap(placeBox, playerBox)) return false;

    // 床占 2×1×1，检查额外空间
    const item = inventory.getSelectedItem();
    if (item?.id === 'bed') {
      // 床沿玩家朝向延伸
      const dir = player.getLookDirection();
      let dx = 0, dz = 0;
      if (Math.abs(dir.x) > Math.abs(dir.z)) {
        dx = dir.x > 0 ? 1 : -1;
      } else {
        dz = dir.z > 0 ? 1 : -1;
      }
      const x2 = x + dx;
      const z2 = z + dz;
      if (!world.inBounds(x2, y, z2)) return false;
      if (world.getBlock(x2, y, z2) !== BlockType.AIR) return false;
    }

    return true;
  }

  // 破坏方块
  breakBlock(world: VoxelWorld, inventory: InventorySystem): boolean {
    if (!this.hitBlock) return false;
    const { x, y, z } = this.hitBlock;
    const block = world.getBlock(x, y, z);
    
    // 不可破坏：水方块、基岩
    if (block === BlockType.WATER_BLOCK || block === BlockType.BEDROCK) return false;
    
    // 回收到物品栏
    let itemId: string | null = null;
    switch (block) {
      case BlockType.GRASS: itemId = 'grass_block'; break;
      case BlockType.DIRT: itemId = 'dirt_block'; break;
      case BlockType.WOOD: itemId = 'wood_block'; break;
      case BlockType.BED: itemId = 'bed'; break;
      case BlockType.SOFA: itemId = 'sofa'; break;
    }
    
    if (itemId && ITEMS[itemId]) {
      inventory.addItem(ITEMS[itemId]);
    }
    
    world.setBlock(x, y, z, BlockType.AIR);
    return true;
  }

  // 放置方块
  placeBlockAction(world: VoxelWorld, player: Player, inventory: InventorySystem): boolean {
    if (!this.placeBlock || !this.canPlace) return false;
    
    const item = inventory.getSelectedItem();
    if (!item) return false;
    if (item.category !== ItemCategory.BLOCK && item.category !== ItemCategory.FURNITURE) return false;
    
    const { x, y, z } = this.placeBlock;
    
    if (item.id === 'bed') {
      // 床占 2×1×1
      world.setBlock(x, y, z, BlockType.BED);
      const dir = player.getLookDirection();
      let dx = 0, dz = 0;
      if (Math.abs(dir.x) > Math.abs(dir.z)) {
        dx = dir.x > 0 ? 1 : -1;
      } else {
        dz = dir.z > 0 ? 1 : -1;
      }
      world.setBlock(x + dx, y, z + dz, BlockType.BED);
    } else if (item.blockType !== undefined) {
      world.setBlock(x, y, z, item.blockType);
    }
    
    inventory.consumeSelected();
    return true;
  }
}
