// 水方块 — 发光粒子效果 + 物品获取
import * as THREE from 'three';
import { CONFIG } from '../data/config';

export class WaterBlock {
  position: THREE.Vector3;
  mesh: THREE.Group;
  private particles: THREE.Points;
  private lastInteractTime = 0;
  private particlePositions: Float32Array;

  constructor(x: number, y: number, z: number) {
    this.position = new THREE.Vector3(x + 0.5, y, z + 0.5);
    this.mesh = new THREE.Group();

    // 发光方块
    const blockGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const blockMat = new THREE.MeshLambertMaterial({
      color: 0x3399FF,
      emissive: 0x1155AA,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8,
    });
    const block = new THREE.Mesh(blockGeo, blockMat);
    block.position.y = 0.4;
    this.mesh.add(block);

    // 粒子效果
    const particleCount = 30;
    this.particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      this.particlePositions[i * 3] = (Math.random() - 0.5) * 2;
      this.particlePositions[i * 3 + 1] = Math.random() * 2;
      this.particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    
    const particleMat = new THREE.PointsMaterial({
      color: 0x66CCFF,
      size: 0.1,
      transparent: true,
      opacity: 0.7,
    });

    this.particles = new THREE.Points(particleGeo, particleMat);
    this.mesh.add(this.particles);

    this.mesh.position.copy(this.position);
  }

  update(dt: number): void {
    // 旋转粒子
    this.particles.rotation.y += dt * 0.5;

    // 粒子上下浮动
    for (let i = 0; i < this.particlePositions.length / 3; i++) {
      this.particlePositions[i * 3 + 1] += dt * 0.3;
      if (this.particlePositions[i * 3 + 1] > 2.5) {
        this.particlePositions[i * 3 + 1] = 0;
      }
    }
    this.particles.geometry.attributes.position.needsUpdate = true;

    // 方块缓慢旋转
    const block = this.mesh.children[0];
    block.rotation.y += dt * 0.8;
  }

  canInteract(): boolean {
    const now = performance.now() / 1000;
    return now - this.lastInteractTime >= CONFIG.WATER_BLOCK_COOLDOWN;
  }

  interact(): void {
    this.lastInteractTime = performance.now() / 1000;
  }

  getCooldownRemaining(): number {
    const now = performance.now() / 1000;
    const elapsed = now - this.lastInteractTime;
    return Math.max(0, CONFIG.WATER_BLOCK_COOLDOWN - elapsed);
  }
}
