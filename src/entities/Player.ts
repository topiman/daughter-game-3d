// 玩家实体 — 移动/跳跃/视角
import * as THREE from 'three';
import { CONFIG } from '../data/config';
import { InputManager } from '../engine/InputManager';
import { Physics, makeAABB } from '../engine/Physics';

export class Player {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  yaw = 0;   // 水平旋转
  pitch = 0; // 俯仰
  grounded = false;
  isFirstPerson = false;
  hp = CONFIG.MAX_HP;
  hunger = CONFIG.MAX_HUNGER;
  kills = 0;
  daysSurvived = 0;
  lastAttackTime = 0;
  speedBoostEndTime = 0;
  
  // 坠落检测
  private lastGroundedY = 0;
  private wasFalling = false;
  
  // 身体朝向（第三人称时独立于摄像机）
  private bodyYaw = 0;
  
  // 攻击动画
  private attackAnimTime = 0;
  private isAttacking = false;

  // 方块人模型
  mesh: THREE.Group;
  private bodyMesh: THREE.Mesh;
  private headMesh: THREE.Mesh;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private swordMesh: THREE.Mesh;
  private walkTime = 0;

  constructor() {
    this.position = new THREE.Vector3(32, 10, 32);
    this.velocity = new THREE.Vector3(0, 0, 0);

    // 构建可爱方块人
    this.mesh = new THREE.Group();

    const skinColor = 0xFFDBAC;
    const shirtColor = 0x4488FF;
    const pantsColor = 0x3344AA;
    const hairColor = 0x553311;

    // 头
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    this.headMesh = new THREE.Mesh(headGeo, new THREE.MeshLambertMaterial({ color: skinColor }));
    this.headMesh.position.y = 1.55;
    this.mesh.add(this.headMesh);

    // 头发
    const hairGeo = new THREE.BoxGeometry(0.52, 0.2, 0.52);
    const hairMesh = new THREE.Mesh(hairGeo, new THREE.MeshLambertMaterial({ color: hairColor }));
    hairMesh.position.y = 1.75;
    this.mesh.add(hairMesh);

    // 眼睛
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.05);
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.12, 1.55, 0.26);
    this.mesh.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.12, 1.55, 0.26);
    this.mesh.add(rightEye);

    // 身体
    const bodyGeo = new THREE.BoxGeometry(0.45, 0.6, 0.3);
    this.bodyMesh = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({ color: shirtColor }));
    this.bodyMesh.position.y = 1.0;
    this.mesh.add(this.bodyMesh);

    // 手臂
    const armGeo = new THREE.BoxGeometry(0.18, 0.55, 0.18);
    this.leftArm = new THREE.Mesh(armGeo, new THREE.MeshLambertMaterial({ color: skinColor }));
    this.leftArm.position.set(-0.32, 1.0, 0);
    this.mesh.add(this.leftArm);
    this.rightArm = new THREE.Mesh(armGeo, new THREE.MeshLambertMaterial({ color: skinColor }));
    this.rightArm.position.set(0.32, 1.0, 0);
    this.mesh.add(this.rightArm);

    // 腿
    const legGeo = new THREE.BoxGeometry(0.2, 0.5, 0.2);
    this.leftLeg = new THREE.Mesh(legGeo, new THREE.MeshLambertMaterial({ color: pantsColor }));
    this.leftLeg.position.set(-0.12, 0.45, 0);
    this.mesh.add(this.leftLeg);
    this.rightLeg = new THREE.Mesh(legGeo, new THREE.MeshLambertMaterial({ color: pantsColor }));
    this.rightLeg.position.set(0.12, 0.45, 0);
    this.mesh.add(this.rightLeg);

    // 剑（附在右手）
    const swordGeo = new THREE.BoxGeometry(0.08, 0.8, 0.08);
    this.swordMesh = new THREE.Mesh(swordGeo, new THREE.MeshLambertMaterial({ color: 0xCCCCCC }));
    this.swordMesh.position.set(0.32, 1.1, 0.3);
    this.swordMesh.visible = false;
    this.mesh.add(this.swordMesh);

    // 剑柄
    const hiltGeo = new THREE.BoxGeometry(0.15, 0.08, 0.08);
    const hiltMesh = new THREE.Mesh(hiltGeo, new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
    hiltMesh.position.set(0, -0.35, 0);
    this.swordMesh.add(hiltMesh);
  }

  setSwordVisible(visible: boolean): void {
    this.swordMesh.visible = visible;
  }

  // 触发攻击动画
  playAttackAnimation(): void {
    this.isAttacking = true;
    this.attackAnimTime = 0;
  }

  update(dt: number, input: InputManager, physics: Physics, camera: THREE.PerspectiveCamera): void {
    // 视角旋转
    const { dx, dy } = input.consumeMouseDelta();
    this.yaw -= dx;
    this.pitch -= dy;
    this.pitch = Math.max(-Math.PI / 2 * 0.9, Math.min(Math.PI / 2 * 0.9, this.pitch));

    // 移动方向
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const now = performance.now() / 1000;
    const speed = now < this.speedBoostEndTime 
      ? CONFIG.PLAYER_SPRINT_SPEED 
      : CONFIG.PLAYER_SPEED;

    const moveDir = new THREE.Vector3(0, 0, 0);
    if (input.isKeyDown('KeyW')) moveDir.add(forward);
    if (input.isKeyDown('KeyS')) moveDir.sub(forward);
    if (input.isKeyDown('KeyA')) moveDir.sub(right);
    if (input.isKeyDown('KeyD')) moveDir.add(right);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      this.velocity.x = moveDir.x * speed;
      this.velocity.z = moveDir.z * speed;
    } else {
      this.velocity.x *= 0.85;
      this.velocity.z *= 0.85;
      if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
      if (Math.abs(this.velocity.z) < 0.01) this.velocity.z = 0;
    }

    // 跳跃 — 宽容设计：着地或刚离地短时间内都能跳
    if (input.isKeyDown('Space') && this.grounded) {
      this.velocity.y = CONFIG.PLAYER_JUMP_VELOCITY;
      this.grounded = false;
    }

    // 重力
    this.velocity.y += CONFIG.GRAVITY * dt;
    if (this.velocity.y < CONFIG.MAX_FALL_SPEED) this.velocity.y = CONFIG.MAX_FALL_SPEED;

    // 记录下落前高度
    if (this.grounded) {
      this.lastGroundedY = this.position.y;
      this.wasFalling = false;
    } else if (this.velocity.y < -1) {
      this.wasFalling = true;
    }

    // 物理移动
    const pos = { x: this.position.x, y: this.position.y, z: this.position.z };
    const vel = { x: this.velocity.x, y: this.velocity.y, z: this.velocity.z };
    const result = physics.moveEntity(pos, vel, CONFIG.PLAYER_WIDTH, CONFIG.PLAYER_HEIGHT, dt);
    this.position.set(pos.x, pos.y, pos.z);
    this.velocity.set(vel.x, vel.y, vel.z);
    
    const wasGrounded = this.grounded;
    this.grounded = result.grounded;

    // 坠落伤害检测
    if (this.grounded && !wasGrounded && this.wasFalling) {
      const fallDist = this.lastGroundedY - this.position.y;
      if (fallDist > CONFIG.FALL_DAMAGE_MAX_HEIGHT) {
        this.hp = 0; // 即死
      } else if (fallDist > CONFIG.FALL_DAMAGE_MIN_HEIGHT) {
        this.hp = Math.max(0, this.hp - CONFIG.FALL_DAMAGE_AMOUNT);
      }
      this.wasFalling = false;
    }

    // 视角切换
    if (input.consumeVPress()) {
      this.isFirstPerson = !this.isFirstPerson;
      camera.fov = this.isFirstPerson ? CONFIG.FIRST_PERSON_FOV : CONFIG.THIRD_PERSON_FOV;
      camera.updateProjectionMatrix();
    }

    // 身体朝向：第三人称时跟随移动方向，第一人称跟随摄像机
    if (this.isFirstPerson) {
      this.bodyYaw = this.yaw;
    } else if (moveDir.lengthSq() > 0) {
      // 计算移动方向的角度（脸朝移动方向）
      const targetBodyYaw = Math.atan2(moveDir.x, moveDir.z);
      // 平滑转身
      let diff = targetBodyYaw - this.bodyYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.bodyYaw += diff * Math.min(1, dt * 12);
    }

    // 更新模型位置和朝向
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.bodyYaw;

    // 在第一人称隐藏模型
    this.mesh.visible = !this.isFirstPerson;

    // 攻击动画更新
    if (this.isAttacking) {
      this.attackAnimTime += dt;
      const animDuration = 0.3;
      if (this.attackAnimTime < animDuration) {
        // 右臂+剑向前挥动
        const t = this.attackAnimTime / animDuration;
        const swing = Math.sin(t * Math.PI) * -2.5; // 大幅前挥
        this.rightArm.rotation.x = swing;
        this.swordMesh.rotation.x = swing * 0.6;
      } else {
        this.isAttacking = false;
        this.attackAnimTime = 0;
      }
    }

    // 走路动画
    if (moveDir.lengthSq() > 0 && this.grounded) {
      this.walkTime += dt * 8;
      const swing = Math.sin(this.walkTime) * 0.4;
      this.leftArm.rotation.x = swing;
      if (!this.isAttacking) this.rightArm.rotation.x = -swing;
      this.leftLeg.rotation.x = -swing;
      this.rightLeg.rotation.x = swing;
    } else {
      this.leftArm.rotation.x *= 0.9;
      if (!this.isAttacking) this.rightArm.rotation.x *= 0.9;
      this.leftLeg.rotation.x *= 0.9;
      this.rightLeg.rotation.x *= 0.9;
    }

    // 摄像机位置
    this.updateCamera(camera);
  }

  private updateCamera(camera: THREE.PerspectiveCamera): void {
    const eyeY = this.position.y + CONFIG.PLAYER_HEIGHT - 0.1;

    if (this.isFirstPerson) {
      camera.position.set(this.position.x, eyeY, this.position.z);
    } else {
      // 第三人称：在角色身后上方
      const dist = CONFIG.CAMERA_DISTANCE;
      const camX = this.position.x + Math.sin(this.yaw) * dist * Math.cos(this.pitch * 0.5);
      const camY = eyeY + CONFIG.CAMERA_HEIGHT_OFFSET + Math.sin(-this.pitch * 0.5) * dist * 0.3;
      const camZ = this.position.z + Math.cos(this.yaw) * dist * Math.cos(this.pitch * 0.5);
      camera.position.set(camX, camY, camZ);
    }

    // 注视方向
    const lookDir = new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    );
    const lookTarget = new THREE.Vector3(
      this.position.x + lookDir.x * 10,
      eyeY + lookDir.y * 10,
      this.position.z + lookDir.z * 10
    );
    camera.lookAt(lookTarget);
  }

  getLookDirection(): THREE.Vector3 {
    return new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    ).normalize();
  }

  getEyePosition(): THREE.Vector3 {
    return new THREE.Vector3(
      this.position.x,
      this.position.y + CONFIG.PLAYER_HEIGHT - 0.1,
      this.position.z
    );
  }

  getAABB() {
    return makeAABB(
      this.position.x, this.position.y, this.position.z,
      CONFIG.PLAYER_WIDTH, CONFIG.PLAYER_HEIGHT, CONFIG.PLAYER_WIDTH
    );
  }

  takeDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
  }

  isDead(): boolean {
    return this.hp <= 0;
  }
}
