// 方块小狗伙伴
import * as THREE from 'three';
import { CONFIG } from '../data/config';
import { Physics, makeAABB } from '../engine/Physics';

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

  private velocity = new THREE.Vector3(0, 0, 0);
  private grounded = false;
  private readonly DOG_WIDTH = 0.4;
  private readonly DOG_HEIGHT = 0.7;

  update(dt: number, playerPos: THREE.Vector3, mutants: Array<{ position: THREE.Vector3 }>, _playerGrounded?: boolean, physics?: Physics): void {
    // 跟随玩家（水平方向）
    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();

    if (dist > CONFIG.DOG_FOLLOW_DIST + 0.5) {
      toPlayer.normalize();
      this.velocity.x = toPlayer.x * CONFIG.DOG_SPEED;
      this.velocity.z = toPlayer.z * CONFIG.DOG_SPEED;
      this.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    // 遇障碍自动跳
    if (this.grounded && physics && dist > CONFIG.DOG_FOLLOW_DIST + 0.5) {
      const frontX = this.position.x + toPlayer.x * 0.5;
      const frontZ = this.position.z + toPlayer.z * 0.5;
      const frontBox = makeAABB(frontX, this.position.y, frontZ, this.DOG_WIDTH, this.DOG_HEIGHT, this.DOG_WIDTH);
      if (physics.collidesWithWorld(frontBox)) {
        this.velocity.y = CONFIG.PLAYER_JUMP_VELOCITY; // 和玩家跳一样高
        this.grounded = false;
      }
    }

    // 重力
    this.velocity.y += CONFIG.GRAVITY * dt;
    if (this.velocity.y < CONFIG.MAX_FALL_SPEED) this.velocity.y = CONFIG.MAX_FALL_SPEED;

    // 物理碰撞
    if (physics) {
      const pos = { x: this.position.x, y: this.position.y, z: this.position.z };
      const vel = { x: this.velocity.x, y: this.velocity.y, z: this.velocity.z };
      const result = physics.moveEntity(pos, vel, this.DOG_WIDTH, this.DOG_HEIGHT, dt);
      this.position.set(pos.x, pos.y, pos.z);
      this.velocity.set(vel.x, vel.y, vel.z);
      this.grounded = result.grounded;
    } else {
      // 无物理时退回简单模式
      this.position.y = playerPos.y;
    }

    // 距离太远则传送（防止掉队）
    if (dist > 15) {
      this.position.set(playerPos.x - 1, playerPos.y, playerPos.z - 1);
      this.velocity.set(0, 0, 0);
    }

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
