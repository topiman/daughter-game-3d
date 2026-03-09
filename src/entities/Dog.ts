// 方块小狗伙伴
import * as THREE from 'three';
import { CONFIG } from '../data/config';

export class Dog {
  mesh: THREE.Group;
  position: THREE.Vector3;
  isBarking = false;
  private barkLabel: THREE.Mesh | null = null;

  constructor() {
    this.position = new THREE.Vector3(0, 0, 0);
    this.mesh = new THREE.Group();

    const bodyColor = 0xCC8844;
    const darkColor = 0x996633;
    const noseColor = 0x222222;

    // 身体
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.35, 0.7),
      new THREE.MeshLambertMaterial({ color: bodyColor })
    );
    body.position.set(0, 0.35, 0);
    this.mesh.add(body);

    // 头
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.3, 0.35),
      new THREE.MeshLambertMaterial({ color: bodyColor })
    );
    head.position.set(0, 0.55, 0.35);
    this.mesh.add(head);

    // 鼻子
    const nose = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.08, 0.08),
      new THREE.MeshLambertMaterial({ color: noseColor })
    );
    nose.position.set(0, 0.5, 0.54);
    this.mesh.add(nose);

    // 眼睛
    const eyeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.04);
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.08, 0.6, 0.53);
    this.mesh.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.08, 0.6, 0.53);
    this.mesh.add(rightEye);

    // 耳朵
    const earGeo = new THREE.BoxGeometry(0.1, 0.15, 0.08);
    const earMat = new THREE.MeshLambertMaterial({ color: darkColor });
    const leftEar = new THREE.Mesh(earGeo, earMat);
    leftEar.position.set(-0.16, 0.7, 0.3);
    this.mesh.add(leftEar);
    const rightEar = new THREE.Mesh(earGeo, earMat);
    rightEar.position.set(0.16, 0.7, 0.3);
    this.mesh.add(rightEar);

    // 腿
    const legGeo = new THREE.BoxGeometry(0.12, 0.2, 0.12);
    const legMat = new THREE.MeshLambertMaterial({ color: darkColor });
    const positions = [[-0.15, 0.1, 0.2], [0.15, 0.1, 0.2], [-0.15, 0.1, -0.2], [0.15, 0.1, -0.2]];
    for (const [lx, ly, lz] of positions) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, ly, lz);
      this.mesh.add(leg);
    }

    // 尾巴
    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.2, 0.08),
      new THREE.MeshLambertMaterial({ color: bodyColor })
    );
    tail.position.set(0, 0.5, -0.35);
    tail.rotation.x = -0.5;
    this.mesh.add(tail);
  }

  private groundY = 0;

  update(dt: number, playerPos: THREE.Vector3, mutants: Array<{ position: THREE.Vector3 }>, playerGrounded?: boolean): void {
    // 跟随玩家
    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();

    if (dist > CONFIG.DOG_FOLLOW_DIST + 0.5) {
      toPlayer.normalize();
      const speed = CONFIG.DOG_SPEED * dt;
      this.position.x += toPlayer.x * speed;
      this.position.z += toPlayer.z * speed;
      // 面朝玩家
      this.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
    }

    // 狗只在玩家落地时同步Y，跳跃时不跟
    if (playerGrounded !== false) {
      this.groundY = playerPos.y;
    }
    this.position.y = this.groundY;
    this.mesh.position.copy(this.position);

    // 检测变异人
    this.isBarking = this.isNearMutant(mutants);
  }

  isNearMutant(mutants: Array<{ position: THREE.Vector3 }>): boolean {
    for (const m of mutants) {
      const d = this.position.distanceTo(m.position);
      if (d <= CONFIG.DOG_BARK_RANGE) return true;
    }
    return false;
  }
}
