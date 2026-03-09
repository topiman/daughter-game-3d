// 水方块 — 发光粒子效果 + 物品获取
import * as THREE from 'three';
import { CONFIG } from '../data/config';

export class WaterBlock {
  position: THREE.Vector3;
  mesh: THREE.Group;
  private particles: THREE.Points;
  private lastInteractTime = 0;
  private particlePositions: Float32Array;
  private indicator: THREE.Sprite;
  private indicatorReady: THREE.SpriteMaterial;
  private indicatorCooldown: THREE.SpriteMaterial;
  private countdownSprite: THREE.Sprite;
  private countdownCanvas: HTMLCanvasElement;
  private countdownCtx: CanvasRenderingContext2D;
  private lastCountdownText = '';

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
    const isMobile = typeof window !== 'undefined' && 'ontouchstart' in window;
    const particleCount = isMobile ? 12 : 30;
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

    // 可交互标志 — "按 E" 提示
    this.indicatorReady = this.createIndicatorMaterial('按 E ✨', '#00FF88');
    this.indicatorCooldown = this.createIndicatorMaterial('冷却中...', '#FF6644');
    this.indicator = new THREE.Sprite(this.indicatorReady);
    this.indicator.scale.set(1.2, 0.4, 1);
    this.indicator.position.set(0, 1.6, 0);
    this.indicator.visible = false;
    this.mesh.add(this.indicator);

    // 常驻倒计时显示
    this.countdownCanvas = document.createElement('canvas');
    this.countdownCanvas.width = 128;
    this.countdownCanvas.height = 64;
    this.countdownCtx = this.countdownCanvas.getContext('2d')!;
    const cdTexture = new THREE.CanvasTexture(this.countdownCanvas);
    const cdMat = new THREE.SpriteMaterial({ map: cdTexture, transparent: true });
    this.countdownSprite = new THREE.Sprite(cdMat);
    this.countdownSprite.scale.set(0.8, 0.4, 1);
    this.countdownSprite.position.set(0, 1.2, 0);
    this.mesh.add(this.countdownSprite);
  }

  private createIndicatorMaterial(text: string, color: string): THREE.SpriteMaterial {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(4, 4, 248, 56, 12);
    ctx.fill();
    
    // 边框
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(4, 4, 248, 56, 12);
    ctx.stroke();
    
    // 文字
    ctx.fillStyle = color;
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 34);
    
    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.SpriteMaterial({ map: texture, transparent: true });
  }

  update(dt: number, playerPos?: THREE.Vector3): void {
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

    // 标志上下浮动
    this.indicator.position.y = 1.6 + Math.sin(performance.now() / 500) * 0.1;

    // 根据距离和冷却状态显示/隐藏标志
    if (playerPos) {
      const dist = playerPos.distanceTo(this.position);
      if (dist <= CONFIG.WATER_BLOCK_INTERACT_DIST + 1) {
        this.indicator.visible = true;
        if (this.canInteract()) {
          this.indicator.material = this.indicatorReady;
        } else {
          this.indicator.material = this.indicatorCooldown;
        }
      } else {
        this.indicator.visible = false;
      }
    }

    // 更新常驻倒计时
    this.updateCountdown();
  }

  private updateCountdown(): void {
    const remaining = this.getCooldownRemaining();
    const ready = remaining <= 0;
    // 只显示整数秒，减少重绘次数（从每帧→每秒）
    const text = ready ? 'ready' : String(Math.ceil(remaining));
    if (text === this.lastCountdownText) return; // 没变就不重绘
    this.lastCountdownText = text;

    const ctx = this.countdownCtx;
    const w = this.countdownCanvas.width;
    const h = this.countdownCanvas.height;
    ctx.clearRect(0, 0, w, h);

    // 背景
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(4, 4, w - 8, h - 8, 8);
    ctx.fill();

    if (ready) {
      ctx.fillStyle = '#00FF88';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✨ 就绪', w / 2, h / 2);
    } else {
      ctx.fillStyle = '#FFAA00';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`⏳ ${Math.ceil(remaining)}s`, w / 2, h / 2);
    }

    (this.countdownSprite.material as THREE.SpriteMaterial).map!.needsUpdate = true;
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
