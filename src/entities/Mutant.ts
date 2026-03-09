// 变异人 — 绿色搞怪方块体
import * as THREE from 'three';
import { CONFIG } from '../data/config';
import { Physics, makeAABB, aabbOverlap } from '../engine/Physics';
import { Player } from './Player';

export class Mutant {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  hp: number;
  mesh: THREE.Group;
  private lastAttackTime = 0;
  private grounded = false;

  constructor(x: number, y: number, z: number) {
    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.hp = CONFIG.MUTANT_HP;

    // 搞怪绿色方块体
    this.mesh = new THREE.Group();
    const bodyColor = 0x44BB44;
    const eyeColor = 0xFF0000;

    // 身体
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.9, 0.5),
      new THREE.MeshLambertMaterial({ color: bodyColor })
    );
    body.position.y = 0.85;
    this.mesh.add(body);

    // 头（大头）
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.6),
      new THREE.MeshLambertMaterial({ color: bodyColor })
    );
    head.position.y = 1.6;
    this.mesh.add(head);

    // 眼睛（大而搞怪）
    const eyeGeo = new THREE.BoxGeometry(0.18, 0.22, 0.05);
    const eyeMat = new THREE.MeshLambertMaterial({ color: eyeColor });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.15, 1.65, 0.31);
    this.mesh.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.15, 1.65, 0.31);
    this.mesh.add(rightEye);

    // 白色瞳孔
    const pupilGeo = new THREE.BoxGeometry(0.08, 0.1, 0.05);
    const pupilMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.12, 1.67, 0.34);
    this.mesh.add(leftPupil);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.18, 1.63, 0.34);
    this.mesh.add(rightPupil);

    // 歪嘴笑
    const mouth = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.08, 0.05),
      new THREE.MeshLambertMaterial({ color: 0x226622 })
    );
    mouth.position.set(0.05, 1.42, 0.31);
    mouth.rotation.z = 0.15;
    this.mesh.add(mouth);

    // 手臂
    const armGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const armMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    const la = new THREE.Mesh(armGeo, armMat);
    la.position.set(-0.45, 0.8, 0);
    la.rotation.z = 0.3;
    this.mesh.add(la);
    const ra = new THREE.Mesh(armGeo, armMat);
    ra.position.set(0.45, 0.8, 0);
    ra.rotation.z = -0.3;
    this.mesh.add(ra);

    // 腿
    const legGeo = new THREE.BoxGeometry(0.22, 0.4, 0.22);
    const legMat = new THREE.MeshLambertMaterial({ color: 0x338833 });
    const ll = new THREE.Mesh(legGeo, legMat);
    ll.position.set(-0.16, 0.2, 0);
    this.mesh.add(ll);
    const rl = new THREE.Mesh(legGeo, legMat);
    rl.position.set(0.16, 0.2, 0);
    this.mesh.add(rl);
  }

  update(dt: number, player: Player, physics: Physics): void {
    // AI：朝玩家移动
    const toPlayer = new THREE.Vector3().subVectors(player.position, this.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();

    if (dist > 0.5) {
      toPlayer.normalize();
      const speed = CONFIG.PLAYER_SPEED * CONFIG.MUTANT_SPEED_RATIO;
      this.velocity.x = toPlayer.x * speed;
      this.velocity.z = toPlayer.z * speed;

      // 朝向玩家
      this.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    // 遇方块尝试跳跃
    if (this.grounded) {
      // 检查前方是否有方块
      const frontX = this.position.x + toPlayer.x * 0.8;
      const frontZ = this.position.z + toPlayer.z * 0.8;
      const frontBox = makeAABB(frontX, this.position.y, frontZ, 0.6, 1.8, 0.6);
      if (physics.collidesWithWorld(frontBox)) {
        this.velocity.y = CONFIG.PLAYER_JUMP_VELOCITY * 0.8;
        this.grounded = false;
      }
    }

    // 重力
    this.velocity.y += CONFIG.GRAVITY * dt;
    if (this.velocity.y < CONFIG.MAX_FALL_SPEED) this.velocity.y = CONFIG.MAX_FALL_SPEED;

    // 物理移动
    const pos = { x: this.position.x, y: this.position.y, z: this.position.z };
    const vel = { x: this.velocity.x, y: this.velocity.y, z: this.velocity.z };
    const result = physics.moveEntity(pos, vel, 0.6, 1.8, dt);
    this.position.set(pos.x, pos.y, pos.z);
    this.velocity.set(vel.x, vel.y, vel.z);
    this.grounded = result.grounded;

    // 更新模型位置
    this.mesh.position.copy(this.position);

    // 攻击玩家
    const now = performance.now() / 1000;
    if (dist < 1.5 && now - this.lastAttackTime > CONFIG.MUTANT_ATTACK_INTERVAL) {
      player.takeDamage(CONFIG.MUTANT_DAMAGE);
      this.lastAttackTime = now;
    }
  }

  takeDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
  }

  isDead(): boolean {
    return this.hp <= 0;
  }

  getAABB() {
    return makeAABB(this.position.x, this.position.y, this.position.z, 0.6, 1.8, 0.6);
  }
}
