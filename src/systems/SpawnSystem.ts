// 变异人生成系统
import * as THREE from 'three';
import { CONFIG } from '../data/config';
import { Mutant } from '../entities/Mutant';
import { Player } from '../entities/Player';
import { VoxelWorld } from '../engine/VoxelWorld';
import { TimeSystem } from './TimeSystem';

export class SpawnSystem {
  mutants: Mutant[] = [];
  private lastSpawnTime = 0;
  private spawnedThisNight = 0;
  private wasNight = false;

  update(dt: number, player: Player, world: VoxelWorld, time: TimeSystem, scene: THREE.Scene): void {
    const isNight = time.isNight;

    // 进入白天清除所有变异人
    if (!isNight && this.wasNight) {
      for (const m of this.mutants) {
        scene.remove(m.mesh);
      }
      this.mutants = [];
      this.spawnedThisNight = 0;
    }

    // 重置夜晚生成计数
    if (isNight && !this.wasNight) {
      this.spawnedThisNight = 0;
    }
    this.wasNight = isNight;

    if (!isNight) return;

    // 夜间生成
    const now = performance.now() / 1000;
    if (this.mutants.length < CONFIG.MUTANT_MAX_PER_NIGHT && 
        this.spawnedThisNight < CONFIG.MUTANT_MAX_PER_NIGHT &&
        now - this.lastSpawnTime > 10) {
      
      this.spawnMutant(player, world, scene);
      this.lastSpawnTime = now;
    }
  }

  private spawnMutant(player: Player, world: VoxelWorld, scene: THREE.Scene): void {
    // 随机距离和角度
    const angle = Math.random() * Math.PI * 2;
    const dist = CONFIG.MUTANT_SPAWN_MIN_DIST + Math.random() * (CONFIG.MUTANT_SPAWN_MAX_DIST - CONFIG.MUTANT_SPAWN_MIN_DIST);
    
    const x = player.position.x + Math.cos(angle) * dist;
    const z = player.position.z + Math.sin(angle) * dist;
    
    // 确保在世界范围内
    const ix = Math.floor(Math.max(1, Math.min(world.width - 2, x)));
    const iz = Math.floor(Math.max(1, Math.min(world.depth - 2, z)));
    const y = world.getSurfaceHeight(ix, iz);

    const mutant = new Mutant(ix + 0.5, y, iz + 0.5);
    this.mutants.push(mutant);
    scene.add(mutant.mesh);
    this.spawnedThisNight++;
  }

  removeDeadMutants(scene: THREE.Scene): void {
    const alive: Mutant[] = [];
    for (const m of this.mutants) {
      if (m.isDead()) {
        scene.remove(m.mesh);
      } else {
        alive.push(m);
      }
    }
    this.mutants = alive;
  }
}
