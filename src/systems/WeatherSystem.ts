// 天气系统 — 随机天气 + 雨雪粒子
import * as THREE from 'three';
import { CONFIG } from '../data/config';

export class WeatherSystem {
  currentWeather: 'clear' | 'rain' | 'snow' = 'clear';
  private weatherTimer = 0;
  private particles: THREE.Points | null = null;
  private particleGeo: THREE.BufferGeometry | null = null;
  private particleCount = 800;

  update(dt: number, scene: THREE.Scene, playerPos?: THREE.Vector3): void {
    if (this.currentWeather !== 'clear') {
      this.weatherTimer -= dt;
      if (this.weatherTimer <= 0) {
        this.stopWeather(scene);
        return;
      }
      // 更新粒子位置
      if (this.particles && this.particleGeo && playerPos) {
        const positions = this.particleGeo.attributes.position as THREE.BufferAttribute;
        const arr = positions.array as Float32Array;
        const speed = this.currentWeather === 'rain' ? 15 : 3;
        for (let i = 0; i < this.particleCount; i++) {
          arr[i * 3 + 1] -= speed * dt; // y 下降
          if (arr[i * 3 + 1] < -2) {
            arr[i * 3] = playerPos.x + (Math.random() - 0.5) * 30;
            arr[i * 3 + 1] = playerPos.y + 10 + Math.random() * 10;
            arr[i * 3 + 2] = playerPos.z + (Math.random() - 0.5) * 30;
          }
        }
        positions.needsUpdate = true;
      }
    }
  }

  startRain(scene: THREE.Scene): void {
    this.stopWeather(scene);
    this.currentWeather = 'rain';
    this.weatherTimer = CONFIG.WEATHER_DURATION;
    this.createParticles(scene, 0x4488ff, 0.05);
  }

  startSnow(scene: THREE.Scene): void {
    this.stopWeather(scene);
    this.currentWeather = 'snow';
    this.weatherTimer = CONFIG.WEATHER_DURATION;
    this.createParticles(scene, 0xffffff, 0.15);
  }

  stopWeather(scene: THREE.Scene): void {
    this.currentWeather = 'clear';
    this.weatherTimer = 0;
    if (this.particles) {
      scene.remove(this.particles);
      this.particleGeo?.dispose();
      this.particles = null;
      this.particleGeo = null;
    }
  }

  getWeather(): string {
    return this.currentWeather;
  }

  private createParticles(scene: THREE.Scene, color: number, size: number): void {
    const positions = new Float32Array(this.particleCount * 3);
    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    this.particleGeo = new THREE.BufferGeometry();
    this.particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.particles = new THREE.Points(this.particleGeo, mat);
    scene.add(this.particles);
  }

  // 每天调用一次判断是否触发天气
  tryTriggerWeather(scene: THREE.Scene): void {
    if (this.currentWeather !== 'clear') return;
    if (Math.random() < CONFIG.WEATHER_CHANCE) {
      if (Math.random() < 0.5) {
        this.startRain(scene);
      } else {
        this.startSnow(scene);
      }
    }
  }
}
