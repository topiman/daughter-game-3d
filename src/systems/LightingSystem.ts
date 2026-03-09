// 照明系统 — PointLight 管理 + 光照范围检查
import * as THREE from 'three';

interface LightEntry {
  light: THREE.PointLight;
  x: number;
  y: number;
  z: number;
  radius: number;
}

export class LightingSystem {
  private lights: Map<string, LightEntry> = new Map();

  private key(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }

  addLight(x: number, y: number, z: number, radius: number, scene: THREE.Scene): void {
    const k = this.key(x, y, z);
    if (this.lights.has(k)) return; // 已有灯

    const light = new THREE.PointLight(0xffdd88, 1.5, radius * 2, 2);
    light.position.set(x + 0.5, y + 1.5, z + 0.5);
    scene.add(light);
    this.lights.set(k, { light, x, y, z, radius });
  }

  removeLight(x: number, y: number, z: number, scene: THREE.Scene): void {
    const k = this.key(x, y, z);
    const entry = this.lights.get(k);
    if (entry) {
      scene.remove(entry.light);
      this.lights.delete(k);
    }
  }

  isInLight(x: number, y: number, z: number): boolean {
    for (const entry of this.lights.values()) {
      const dx = x - entry.x;
      const dy = y - entry.y;
      const dz = z - entry.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist <= entry.radius) return true;
    }
    return false;
  }

  getLights(): Array<{ x: number; y: number; z: number; radius: number }> {
    return Array.from(this.lights.values()).map(e => ({
      x: e.x, y: e.y, z: e.z, radius: e.radius,
    }));
  }
}
