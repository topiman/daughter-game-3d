// Three.js 渲染器 — 场景/摄像机/灯光/天空
import * as THREE from 'three';
import { CONFIG } from '../data/config';

export class Renderer {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  ambientLight: THREE.AmbientLight;
  directionalLight: THREE.DirectionalLight;
  private clouds: THREE.Group;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      CONFIG.THIRD_PERSON_FOV,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false; // 性能

    // 天空背景 — 渐变色
    this.scene.background = new THREE.Color('#87CEEB');
    this.scene.fog = new THREE.Fog('#87CEEB', 50, 80);

    // 灯光
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(30, 50, 30);
    this.scene.add(this.directionalLight);

    // 体素云
    this.clouds = new THREE.Group();
    this.createClouds();
    this.scene.add(this.clouds);

    // 窗口大小变化
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private createClouds(): void {
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    
    for (let i = 0; i < 15; i++) {
      const cloud = new THREE.Group();
      // 每朵云由几个方块组成
      const numBlocks = 3 + Math.floor(Math.random() * 5);
      for (let j = 0; j < numBlocks; j++) {
        const w = 2 + Math.random() * 3;
        const h = 1 + Math.random();
        const d = 2 + Math.random() * 3;
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, cloudMat);
        mesh.position.set(j * 2.5 - numBlocks, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 2);
        cloud.add(mesh);
      }
      cloud.position.set(
        Math.random() * 64 - 0,
        22 + Math.random() * 5,
        Math.random() * 64 - 0
      );
      cloud.userData.speed = 0.2 + Math.random() * 0.3;
      this.clouds.add(cloud);
    }
  }

  updateClouds(dt: number): void {
    for (const cloud of this.clouds.children) {
      cloud.position.x += cloud.userData.speed * dt;
      if (cloud.position.x > 80) cloud.position.x = -20;
    }
  }

  // 更新光照（昼夜循环）
  updateLighting(timeOfDay: number): void {
    // timeOfDay: 0-1 (0=午夜, 0.25=6am, 0.5=正午, 0.75=6pm)
    let sunIntensity: number;
    let ambientIntensity: number;
    let skyColor: THREE.Color;

    if (timeOfDay >= 0.25 && timeOfDay < 0.75) {
      // 白天
      const t = (timeOfDay - 0.25) / 0.5; // 0-1 within day
      const sunHeight = Math.sin(t * Math.PI);
      sunIntensity = 0.5 + sunHeight * 0.5;
      ambientIntensity = 0.4 + sunHeight * 0.3;
      skyColor = new THREE.Color('#87CEEB');
    } else if (timeOfDay >= 0.22 && timeOfDay < 0.25) {
      // 黎明
      const t = (timeOfDay - 0.22) / 0.03;
      sunIntensity = t * 0.5;
      ambientIntensity = 0.15 + t * 0.25;
      skyColor = new THREE.Color('#87CEEB').lerp(new THREE.Color('#FF8C00'), 1 - t);
    } else if (timeOfDay >= 0.75 && timeOfDay < 0.78) {
      // 黄昏
      const t = (timeOfDay - 0.75) / 0.03;
      sunIntensity = (1 - t) * 0.5;
      ambientIntensity = 0.4 - t * 0.25;
      skyColor = new THREE.Color('#87CEEB').lerp(new THREE.Color('#FF4500'), t);
    } else {
      // 夜晚
      sunIntensity = 0.05;
      ambientIntensity = 0.15;
      skyColor = new THREE.Color('#1a1a3e');
    }

    this.directionalLight.intensity = sunIntensity;
    this.ambientLight.intensity = ambientIntensity;
    this.scene.background = skyColor;
    if (this.scene.fog) {
      (this.scene.fog as THREE.Fog).color = skyColor;
    }

    // 太阳位置
    const sunAngle = (timeOfDay - 0.25) * Math.PI * 2;
    this.directionalLight.position.set(
      Math.cos(sunAngle) * 40 + 32,
      Math.sin(sunAngle) * 40 + 10,
      32
    );
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
