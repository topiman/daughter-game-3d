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
import { getRandomItem, ItemCategory, BlockType, ITEMS } from './data/items';
import { WeatherSystem } from './systems/WeatherSystem';
import { FurnitureSystem } from './systems/FurnitureSystem';
import { AudioSystem } from './systems/AudioSystem';
import { LightingSystem } from './systems/LightingSystem';
import { StorageSystem } from './systems/StorageSystem';
import { Dog } from './entities/Dog';
import { isTentArea } from './systems/TentSystem';
import { SaveSystem, SaveData } from './systems/SaveSystem';
import { createSnowmanTracker } from './systems/SnowmanSystem';
import { hasPillowNearby } from './systems/PillowHelper';
import { TouchControls, isTouchDevice } from './ui/TouchControls';

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
  private weatherSystem: WeatherSystem;
  private furnitureSystem: FurnitureSystem;
  private audioSystem: AudioSystem;
  private lightingSystem: LightingSystem;
  private storageSystem: StorageSystem;
  private dog: Dog;
  private running = false;
  private paused = false;
  private lastTime = 0;
  private needsRemesh = false;
  private lastDayForWeather = 0;

  // P2 新增
  private saveSystem: SaveSystem;
  private snowmanTracker = createSnowmanTracker();
  private touchControls: TouchControls;
  private isTouch: boolean;

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
    this.isTouch = isTouchDevice();

    // 纹理
    const atlas = createTextureAtlas();
    atlas.wrapS = THREE.RepeatWrapping;
    atlas.wrapT = THREE.RepeatWrapping;
    this.worldMaterial = new THREE.MeshLambertMaterial({ map: atlas, vertexColors: true });

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
    this.hud.onSlotSelect = (index: number) => {
      this.inventory.setSelected(index);
    };
    this.pauseMenu = new PauseMenu();
    this.gameOverScreen = new GameOverScreen();
    this.titleScreen = new TitleScreen();

    // P1 新系统
    this.weatherSystem = new WeatherSystem();
    this.furnitureSystem = new FurnitureSystem();
    this.audioSystem = new AudioSystem();
    this.lightingSystem = new LightingSystem();
    this.storageSystem = new StorageSystem();
    this.dog = new Dog();

    // P2 新系统
    this.saveSystem = new SaveSystem();
    this.touchControls = new TouchControls();

    this.hud.hide();

    // 检查是否有存档 → 显示继续游戏
    if (this.saveSystem.hasSave()) {
      this.titleScreen.showContinueButton();
    }

    // 事件
    this.titleScreen.onStart = () => this.startGame();
    this.titleScreen.onContinue = () => this.startGame(true);
    this.pauseMenu.onResume = () => this.resumeGame();
    this.pauseMenu.onSave = () => this.manualSave();
    this.gameOverScreen.onRestart = () => this.restartGame();

    // Pointer Lock 变化（桌面端）
    if (!this.isTouch) {
      document.addEventListener('pointerlockchange', () => {
        if (!this.input.isLocked && this.running && !this.paused) {
          this.pauseGame();
        }
      });
    }
  }

  private startGame(loadSave = false): void {
    this.init(loadSave);
    if (!this.isTouch) {
      this.input.requestPointerLock();
    } else {
      // 触屏模式：直接标记为 locked 以正常运行
      this.input.isLocked = true;
      this.touchControls.init();
      this.touchControls.show();
    }
    this.running = true;
    this.paused = false;
    this.hud.show();

    // 操作提示
    if (this.isTouch) {
      this.hud.showMessage('摇杆移动 | 拖动视角 | 按钮操作', 3000);
    } else {
      this.hud.showMessage('WASD移动 | 鼠标视角 | 空格跳跃 | 左键攻击 | 右键放置 | E交互', 3000);
    }

    this.lastTime = performance.now();
    this.gameLoop();
  }

  private init(loadSave = false): void {
    // 生成世界
    this.world = new VoxelWorld();
    this.world.generate();
    this.world.enableTracking(); // 开始追踪变更
    this.physics = new Physics(this.world);

    // 玩家
    this.player = new Player();
    const spawnX = CONFIG.WORLD_WIDTH / 2 + 3;
    const spawnZ = CONFIG.WORLD_DEPTH / 2 + 3;
    const spawnY = this.world.getSurfaceHeight(Math.floor(spawnX), Math.floor(spawnZ));
    this.player.position.set(spawnX, spawnY, spawnZ);

    // 水方块
    const cx = Math.floor(CONFIG.WORLD_WIDTH / 2);
    const cz = Math.floor(CONFIG.WORLD_DEPTH / 2);
    const waterY = this.world.getSurfaceHeight(cx, cz);
    this.waterBlock = new WaterBlock(cx, waterY, cz);

    // 重置系统
    this.timeSystem = new TimeSystem();
    this.survivalSystem = new SurvivalSystem();
    this.inventory = new InventorySystem();
    this.placementSystem = new PlacementSystem(this.renderer.scene);
    this.spawnSystem = new SpawnSystem();

    // P1 系统重置
    this.weatherSystem = new WeatherSystem();
    this.furnitureSystem = new FurnitureSystem();
    this.lightingSystem = new LightingSystem();
    this.storageSystem = new StorageSystem();
    this.dog = new Dog();
    this.dog.position.set(spawnX + 2, spawnY, spawnZ + 2);
    this.lastDayForWeather = 0;

    // P2 系统重置
    this.snowmanTracker = createSnowmanTracker();

    // 读档恢复
    if (loadSave) {
      const saveData = this.saveSystem.load();
      if (saveData) {
        this.applySaveData(saveData);
      }
    }

    // 构建场景
    this.buildWorldMesh();
    this.renderer.scene.add(this.player.mesh);
    this.renderer.scene.add(this.waterBlock.mesh);
    this.renderer.scene.add(this.dog.mesh);
  }

  private applySaveData(data: SaveData): void {
    // 玩家
    this.player.position.set(data.player.x, data.player.y, data.player.z);
    this.player.hp = data.player.hp;
    this.player.hunger = data.player.hunger;
    this.player.kills = data.player.kills;
    this.player.daysSurvived = data.player.daysSurvived;

    // 物品栏
    this.inventory.loadFromSave(data.inventory.slots);

    // 时间
    this.timeSystem.elapsed = data.time.elapsed;
    this.timeSystem.gameDay = data.time.gameDay;

    // 世界变更
    this.world.applyChanges(data.world.changes);

    // 狗
    if (data.dog?.owned) {
      // 狗已拥有
    }

    // 存储空间
    if (data.storages) {
      this.storageSystem.loadFromSave(data.storages);
    }
  }

  private collectSaveData(): SaveData {
    return {
      version: 1,
      player: {
        x: this.player.position.x,
        y: this.player.position.y,
        z: this.player.position.z,
        hp: this.player.hp,
        hunger: this.player.hunger,
        kills: this.player.kills,
        daysSurvived: this.player.daysSurvived,
      },
      inventory: { slots: this.inventory.toSaveFormat() },
      time: { elapsed: this.timeSystem.elapsed, gameDay: this.timeSystem.gameDay },
      world: { changes: this.world.getChanges() },
      dog: { owned: true },
      storages: this.storageSystem.toSaveFormat(),
    };
  }

  private manualSave(): void {
    this.saveSystem.save(this.collectSaveData());
  }

  private buildWorldMesh(): void {
    if (this.worldMesh) {
      this.renderer.scene.remove(this.worldMesh);
      this.worldMesh.geometry.dispose();
    }
    this.worldMesh = ChunkMesher.buildMesh(this.world, this.worldMaterial);
    this.renderer.scene.add(this.worldMesh);
    this.needsRemesh = false;
  }

  private pauseGame(): void {
    this.paused = true;
    this.pauseMenu.show();
    if (this.isTouch) {
      this.touchControls.hide();
    }
  }

  private resumeGame(): void {
    if (!this.isTouch) {
      this.input.requestPointerLock();
    } else {
      this.input.isLocked = true;
      this.touchControls.show();
    }
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

    // 触控输入处理
    if (this.isTouch) {
      // 触控视角
      const look = this.touchControls.consumeLookDelta();
      if (look.dx !== 0 || look.dy !== 0) {
        this.input.mouseDX += look.dx;
        this.input.mouseDY += look.dy;
      }

      // 触控跳跃
      if (this.touchControls.consumeJump()) {
        this.input.keys.add('Space');
        setTimeout(() => this.input.keys.delete('Space'), 100);
      }

      // 触控攻击
      if (this.touchControls.consumeAttack()) {
        this.handleLeftClick();
      }

      // 触控交互
      if (this.touchControls.consumeInteract()) {
        this.handleInteraction();
      }

      // 触控放置
      if (this.touchControls.consumePlace()) {
        this.handleRightClick();
      }

      // 触控拆方块（收回物品栏）
      if (this.touchControls.consumeBreak()) {
        this.handleBreakBlock();
      }

      // 摇杆 → WASD
      const jx = this.touchControls.joystick.dx;
      const jy = this.touchControls.joystick.dy;
      if (Math.abs(jy) > 0.2) {
        if (jy < 0) this.input.keys.add('KeyW');
        else this.input.keys.add('KeyS');
      } else {
        this.input.keys.delete('KeyW');
        this.input.keys.delete('KeyS');
      }
      if (Math.abs(jx) > 0.2) {
        if (jx > 0) this.input.keys.add('KeyD');
        else this.input.keys.add('KeyA');
      } else {
        this.input.keys.delete('KeyD');
        this.input.keys.delete('KeyA');
      }
    }

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

    // 放置系统（传递天气状态）
    this.placementSystem.currentWeather = this.weatherSystem.currentWeather;
    this.placementSystem.update(this.player, this.world, this.inventory);

    // 水方块
    this.waterBlock.update(dt, this.player.position);

    // E键交互（桌面端）
    if (!this.isTouch && this.input.consumeEPress()) {
      this.handleInteraction();
    }

    // 左键（破坏/攻击）（桌面端）
    if (!this.isTouch && this.input.consumeLeftClick()) {
      this.handleLeftClick();
    }

    // 右键（放置）（桌面端）
    if (!this.isTouch && this.input.consumeRightClick()) {
      this.handleRightClick();
    }

    // 天气系统
    this.weatherSystem.update(dt, this.renderer.scene, this.player.position);
    if (this.timeSystem.gameDay > this.lastDayForWeather) {
      this.lastDayForWeather = this.timeSystem.gameDay;
      this.weatherSystem.tryTriggerWeather(this.renderer.scene);
    }

    // 小狗
    this.dog.update(dt, this.player.position, this.spawnSystem.mutants, this.player.grounded);
    if (this.dog.isBarking) {
      this.hud.showMessage('🐕 汪汪！有危险！', 2000);
    }

    // 变异人（带帐篷/光照检查）
    this.spawnSystem.update(dt, this.player, this.world, this.timeSystem, this.renderer.scene);
    for (const mutant of this.spawnSystem.mutants) {
      const playerInTent = isTentArea(this.player.position.x, this.player.position.y, this.player.position.z, this.world);
      const playerInLight = this.lightingSystem.isInLight(
        Math.floor(this.player.position.x), Math.floor(this.player.position.y), Math.floor(this.player.position.z)
      );
      if (!playerInTent && !playerInLight) {
        mutant.update(dt, this.player, this.physics);
      }
    }
    this.spawnSystem.removeDeadMutants(this.renderer.scene);

    // 雪人融化追踪
    this.snowmanTracker.update(dt, this.weatherSystem.currentWeather);
    const meltedSnowmen = this.snowmanTracker.getMelted();
    if (meltedSnowmen.length > 0) {
      for (const s of meltedSnowmen) {
        this.world.setBlock(s.x, s.y, s.z, BlockType.AIR);
      }
      this.snowmanTracker.clearMelted();
      this.needsRemesh = true;
    }

    // 自动存档
    this.saveSystem.updateAutoSave(dt, () => this.collectSaveData());

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
      if (!this.isTouch) {
        this.input.exitPointerLock();
      }
      if (this.isTouch) {
        this.touchControls.hide();
      }
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

    // 家具交互（检查玩家面前的方块）
    if (this.placementSystem.hitBlock) {
      const { x, y, z } = this.placementSystem.hitBlock;
      const block = this.world.getBlock(x, y, z);

      // 床/沙发/马桶（检查抱枕增强）
      if (block === BlockType.BED || block === BlockType.SOFA || block === BlockType.TOILET) {
        const pillow = hasPillowNearby(this.world, x, y, z);
        const result = this.furnitureSystem.interact(block, this.player, this.timeSystem, pillow);
        this.hud.showMessage(result.message);
        if (result.action === 'skip_night') {
          // 跳到早上
        }
        if (result.action === 'toilet') {
          this.audioSystem.playSFX('toilet');
        }
        return;
      }

      // 收纳家具
      if (block === BlockType.SHOE_CABINET || block === BlockType.WARDROBE) {
        this.storageSystem.openStorage(x, y, z);
        this.hud.showMessage('📦 打开了收纳家具');
        return;
      }
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
        this.player.playAttackAnimation();
        const origin = this.player.getEyePosition();
        const dir = this.player.getLookDirection();
        
        for (const mutant of this.spawnSystem.mutants) {
          const toMutant = new THREE.Vector3().subVectors(mutant.position, origin);
          toMutant.y = (mutant.position.y + 0.9) - origin.y;
          const dist = toMutant.length();
          
          if (dist <= CONFIG.SWORD_RANGE) {
            const knockDir = new THREE.Vector3(toMutant.x, 0, toMutant.z).normalize(); // 纯水平击退
            const dot = toMutant.clone().normalize().dot(dir);
            if (dot > 0.5) {
              mutant.takeDamage(CONFIG.SWORD_DAMAGE, knockDir);
              this.hud.showMessage('⚔️ 击中变异人！');
              this.audioSystem?.playSFX('sword');
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
    if (this.placementSystem.hitBlock) {
      const { x, y, z } = this.placementSystem.hitBlock;
      const block = this.world.getBlock(x, y, z);
      if (block === BlockType.LAMP || block === BlockType.NIGHTLIGHT) {
        this.lightingSystem.removeLight(x, y, z, this.renderer.scene);
      }
      // 如果破坏雪人，从追踪器移除
      if (block === BlockType.SNOWMAN) {
        this.snowmanTracker.removeSnowman(x, y, z);
      }
    }
    if (this.placementSystem.breakBlock(this.world, this.inventory)) {
      this.audioSystem.playSFX('break');
      this.needsRemesh = true;
    }
  }

  // 专门破坏方块（iPad拆按钮用，不触发攻击）
  private handleBreakBlock(): void {
    if (this.placementSystem.hitBlock) {
      const { x, y, z } = this.placementSystem.hitBlock;
      const block = this.world.getBlock(x, y, z);
      if (block === BlockType.LAMP || block === BlockType.NIGHTLIGHT) {
        this.lightingSystem.removeLight(x, y, z, this.renderer.scene);
      }
      if (block === BlockType.SNOWMAN) {
        this.snowmanTracker.removeSnowman(x, y, z);
      }
      if (this.placementSystem.breakBlock(this.world, this.inventory)) {
        this.audioSystem.playSFX('break');
        this.needsRemesh = true;
      }
    }
  }

  private handleRightClick(): void {
    if (this.inventory.isHoldingPlaceable()) {
      const item = this.inventory.getSelectedItem();
      if (this.placementSystem.placeBlockAction(this.world, this.player, this.inventory)) {
        this.audioSystem.playSFX('place');
        this.needsRemesh = true;
        if (this.placementSystem.placeBlock && item) {
          const { x, y, z } = this.placementSystem.placeBlock;
          if (item.blockType === BlockType.LAMP) {
            this.lightingSystem.addLight(x, y, z, CONFIG.LAMP_RADIUS, this.renderer.scene);
          } else if (item.blockType === BlockType.NIGHTLIGHT) {
            this.lightingSystem.addLight(x, y, z, CONFIG.NIGHTLIGHT_RADIUS, this.renderer.scene);
          } else if (item.blockType === BlockType.SNOWMAN) {
            // 添加雪人到融化追踪
            this.snowmanTracker.addSnowman(x, y, z);
          }
        }
      } else if (this.placementSystem.lastPlaceError) {
        this.hud.showMessage(this.placementSystem.lastPlaceError);
        this.placementSystem.lastPlaceError = '';
      }
    }
  }
}

// 启动
new Game();
