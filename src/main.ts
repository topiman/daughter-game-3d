// 水方块生存游戏 3D 重制版 — 入口
import * as THREE from 'three';
import { Renderer } from './engine/Renderer';
import { InputManager } from './engine/InputManager';
import { VoxelWorld } from './engine/VoxelWorld';
import { ChunkMesher } from './engine/ChunkMesher';
import { Physics } from './engine/Physics';
import { Player } from './entities/Player';
import { WaterBlock } from './entities/WaterBlock';
import { TimeSystem } from './systems/TimeSystem';
import { SurvivalSystem } from './systems/SurvivalSystem';
import { InventorySystem } from './systems/InventorySystem';
import { PlacementSystem } from './systems/PlacementSystem';
import { SpawnSystem } from './systems/SpawnSystem';
import { HUD } from './ui/HUD';
import { PauseMenu } from './ui/PauseMenu';
import { GameOverScreen } from './ui/GameOverScreen';
import { TitleScreen } from './ui/TitleScreen';
import { createTextureAtlas } from './data/textures';
import { CONFIG } from './data/config';
import { getRandomItem, ItemCategory } from './data/items';

class Game {
  private renderer: Renderer;
  private input: InputManager;
  private world: VoxelWorld;
  private physics: Physics;
  private player: Player;
  private waterBlock: WaterBlock;
  private timeSystem: TimeSystem;
  private survivalSystem: SurvivalSystem;
  private inventory: InventorySystem;
  private placementSystem: PlacementSystem;
  private spawnSystem: SpawnSystem;
  private hud: HUD;
  private pauseMenu: PauseMenu;
  private gameOverScreen: GameOverScreen;
  private titleScreen: TitleScreen;
  private worldMesh: THREE.Mesh | null = null;
  private worldMaterial: THREE.MeshLambertMaterial;
  private running = false;
  private paused = false;
  private lastTime = 0;
  private needsRemesh = false;

  constructor() {
    // 创建canvas
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%;';
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.body.appendChild(canvas);

    // 初始化引擎
    this.renderer = new Renderer(canvas);
    this.input = new InputManager(canvas);

    // 纹理
    const atlas = createTextureAtlas();
    atlas.wrapS = THREE.RepeatWrapping;
    atlas.wrapT = THREE.RepeatWrapping;
    this.worldMaterial = new THREE.MeshLambertMaterial({ map: atlas });

    // 世界
    this.world = new VoxelWorld();
    this.physics = new Physics(this.world);

    // 玩家
    this.player = new Player();

    // 水方块
    const cx = Math.floor(CONFIG.WORLD_WIDTH / 2);
    const cz = Math.floor(CONFIG.WORLD_DEPTH / 2);
    this.waterBlock = new WaterBlock(cx, 0, cz); // 高度在 init 设

    // 系统
    this.timeSystem = new TimeSystem();
    this.survivalSystem = new SurvivalSystem();
    this.inventory = new InventorySystem();
    this.placementSystem = new PlacementSystem(this.renderer.scene);
    this.spawnSystem = new SpawnSystem();

    // UI
    this.hud = new HUD();
    this.pauseMenu = new PauseMenu();
    this.gameOverScreen = new GameOverScreen();
    this.titleScreen = new TitleScreen();

    this.hud.hide();

    // 事件
    this.titleScreen.onStart = () => this.startGame();
    this.pauseMenu.onResume = () => this.resumeGame();
    this.gameOverScreen.onRestart = () => this.restartGame();

    // Pointer Lock 变化
    document.addEventListener('pointerlockchange', () => {
      if (!this.input.isLocked && this.running && !this.paused) {
        this.pauseGame();
      }
    });
  }

  private startGame(): void {
    this.init();
    this.input.requestPointerLock();
    this.running = true;
    this.paused = false;
    this.hud.show();
    this.hud.showMessage('靠近蓝色水方块按 E 获取物品！', 5000);
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private init(): void {
    // 生成世界
    this.world = new VoxelWorld();
    this.world.generate();
    this.physics = new Physics(this.world);

    // 构建世界 mesh
    this.buildWorldMesh();

    // 玩家位置
    this.player = new Player();
    const spawnX = CONFIG.WORLD_WIDTH / 2 + 3;
    const spawnZ = CONFIG.WORLD_DEPTH / 2 + 3;
    const spawnY = this.world.getSurfaceHeight(Math.floor(spawnX), Math.floor(spawnZ));
    this.player.position.set(spawnX, spawnY, spawnZ);
    this.renderer.scene.add(this.player.mesh);

    // 水方块
    const cx = Math.floor(CONFIG.WORLD_WIDTH / 2);
    const cz = Math.floor(CONFIG.WORLD_DEPTH / 2);
    const waterY = this.world.getSurfaceHeight(cx, cz);
    this.waterBlock = new WaterBlock(cx, waterY, cz);
    this.renderer.scene.add(this.waterBlock.mesh);

    // 重置系统
    this.timeSystem = new TimeSystem();
    this.survivalSystem = new SurvivalSystem();
    this.inventory = new InventorySystem();
    this.placementSystem = new PlacementSystem(this.renderer.scene);
    this.spawnSystem = new SpawnSystem();
  }

  private buildWorldMesh(): void {
    if (this.worldMesh) {
      this.renderer.scene.remove(this.worldMesh);
      this.worldMesh.geometry.dispose();
    }
    this.worldMesh = ChunkMesher.buildGreedyMesh(this.world, this.worldMaterial);
    this.renderer.scene.add(this.worldMesh);
    this.needsRemesh = false;
  }

  private pauseGame(): void {
    this.paused = true;
    this.pauseMenu.show();
  }

  private resumeGame(): void {
    this.input.requestPointerLock();
    this.paused = false;
    this.lastTime = performance.now();
  }

  private restartGame(): void {
    // 清理旧场景
    while (this.renderer.scene.children.length > 0) {
      this.renderer.scene.remove(this.renderer.scene.children[0]);
    }
    // 重新加灯光和云
    this.renderer = new Renderer(this.renderer.renderer.domElement);
    this.startGame();
  }

  private gameLoop(): void {
    if (!this.running) return;

    requestAnimationFrame(() => this.gameLoop());

    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    dt = Math.min(dt, 0.05); // 限制最大帧时间

    if (this.paused) {
      this.renderer.render();
      return;
    }

    this.update(dt);
    this.renderer.render();
  }

  private update(dt: number): void {
    if (!this.input.isLocked) return;

    // 数字键切换物品栏
    const numKey = this.input.getNumberKey();
    if (numKey >= 0) this.inventory.setSelected(numKey);
    
    // 滚轮
    const scroll = this.input.consumeScroll();
    if (scroll !== 0) this.inventory.scrollSelected(scroll);

    // 更新剑显示
    this.player.setSwordVisible(this.inventory.isHoldingSword());

    // 玩家
    this.player.update(dt, this.input, this.physics, this.renderer.camera);

    // 时间
    this.timeSystem.update(dt);
    this.renderer.updateLighting(this.timeSystem.getTimeOfDay());
    this.renderer.updateClouds(dt);

    // 生存
    this.survivalSystem.update(dt, this.player, this.timeSystem);

    // 放置系统
    this.placementSystem.update(this.player, this.world, this.inventory);

    // 水方块
    this.waterBlock.update(dt);

    // E键交互
    if (this.input.consumeEPress()) {
      this.handleInteraction();
    }

    // 左键（破坏/攻击）
    if (this.input.consumeLeftClick()) {
      this.handleLeftClick();
    }

    // 右键（放置）
    if (this.input.consumeRightClick()) {
      this.handleRightClick();
    }

    // 变异人
    this.spawnSystem.update(dt, this.player, this.world, this.timeSystem, this.renderer.scene);
    for (const mutant of this.spawnSystem.mutants) {
      mutant.update(dt, this.player, this.physics);
    }
    this.spawnSystem.removeDeadMutants(this.renderer.scene);

    // 重建 mesh
    if (this.needsRemesh) {
      this.buildWorldMesh();
    }

    // 夜晚提示
    if (this.timeSystem.isNight && this.timeSystem.gameHour >= 17.9 && this.timeSystem.gameHour < 18.1) {
      this.hud.showMessage('🌙 夜晚将至...', 3000);
    }

    // 死亡检查
    if (this.player.isDead()) {
      this.running = false;
      this.hud.hide();
      this.input.exitPointerLock();
      this.gameOverScreen.show(this.player.daysSurvived, this.player.kills);
      return;
    }

    // HUD
    this.hud.update(this.player, this.inventory, this.timeSystem);
  }

  private handleInteraction(): void {
    // 水方块交互
    const dist = this.player.position.distanceTo(this.waterBlock.position);
    if (dist <= CONFIG.WATER_BLOCK_INTERACT_DIST) {
      if (this.waterBlock.canInteract()) {
        this.waterBlock.interact();
        const item = getRandomItem();
        if (this.inventory.addItem(item)) {
          this.hud.showMessage(`✨ 获得了 ${item.name}！`);
        } else {
          this.hud.showMessage('❌ 物品栏已满！');
        }
      } else {
        const cd = this.waterBlock.getCooldownRemaining();
        this.hud.showMessage(`⏳ 冷却中... ${cd.toFixed(1)}秒`);
      }
      return;
    }

    // 食物交互
    if (this.inventory.isHoldingFood()) {
      const item = this.inventory.getSelectedItem()!;
      if (item.hungerRestore) {
        this.player.hunger = Math.min(CONFIG.MAX_HUNGER, this.player.hunger + item.hungerRestore);
        if (item.speedBoost) {
          this.player.speedBoostEndTime = performance.now() / 1000 + item.speedBoost;
          this.hud.showMessage(`🍦 吃了${item.name}，加速 ${item.speedBoost} 秒！`);
        } else {
          this.hud.showMessage(`🍽️ 吃了${item.name}，恢复了 ${item.hungerRestore}% 饥饿值`);
        }
        this.inventory.consumeSelected();
      }
    }
  }

  private handleLeftClick(): void {
    // 手持剑 → 攻击
    if (this.inventory.isHoldingSword()) {
      const now = performance.now() / 1000;
      if (now - this.player.lastAttackTime >= CONFIG.SWORD_COOLDOWN) {
        this.player.lastAttackTime = now;
        // 射线检测变异人
        const origin = this.player.getEyePosition();
        const dir = this.player.getLookDirection();
        
        for (const mutant of this.spawnSystem.mutants) {
          const toMutant = new THREE.Vector3().subVectors(mutant.position, origin);
          toMutant.y = (mutant.position.y + 0.9) - origin.y; // 瞄准中心
          const dist = toMutant.length();
          
          if (dist <= CONFIG.SWORD_RANGE) {
            // 检查角度
            const dot = toMutant.normalize().dot(dir);
            if (dot > 0.7) { // 大约45度内
              mutant.takeDamage(CONFIG.SWORD_DAMAGE);
              this.hud.showMessage('⚔️ 击中变异人！');
              if (mutant.isDead()) {
                this.player.kills++;
                this.hud.showMessage('💀 击杀变异人！');
              }
            }
          }
        }
      }
      return;
    }

    // 否则 → 破坏方块
    if (this.placementSystem.breakBlock(this.world, this.inventory)) {
      this.needsRemesh = true;
    }
  }

  private handleRightClick(): void {
    if (this.inventory.isHoldingPlaceable()) {
      if (this.placementSystem.placeBlockAction(this.world, this.player, this.inventory)) {
        this.needsRemesh = true;
      }
    }
  }
}

// 启动
new Game();
