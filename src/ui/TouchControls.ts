// 移动端触控系统 — 虚拟摇杆 + 按钮

export function isTouchDevice(): boolean {
  return 'ontouchstart' in window;
}

// 虚拟摇杆（纯数据层，不依赖 DOM，方便测试）
export class VirtualJoystick {
  dx = 0;
  dy = 0;
  private maxRadius = 80;

  handleMove(offsetX: number, offsetY: number): void {
    const dist = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
    if (dist > this.maxRadius) {
      const scale = this.maxRadius / dist;
      offsetX *= scale;
      offsetY *= scale;
    }
    this.dx = offsetX / this.maxRadius;
    this.dy = offsetY / this.maxRadius;
  }

  handleEnd(): void {
    this.dx = 0;
    this.dy = 0;
  }
}

// 完整的触控 UI（依赖 DOM，游戏中使用）
export class TouchControls {
  joystick = new VirtualJoystick();
  jumpPressed = false;
  attackPressed = false;
  interactPressed = false;
  placePressed = false;
  breakPressed = false;

  // 右半屏拖动 → 视角
  lookDX = 0;
  lookDY = 0;

  private container: HTMLDivElement | null = null;
  private joystickCanvas: HTMLCanvasElement | null = null;
  private joystickCtx: CanvasRenderingContext2D | null = null;
  private joystickTouchId: number | null = null;
  private joystickCenterX = 0;
  private joystickCenterY = 0;
  private lookTouchId: number | null = null;
  private lookLastX = 0;
  private lookLastY = 0;
  private readonly JOYSTICK_RADIUS = 80;
  private visible = false;

  init(): void {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = 'touch-controls';
    this.container.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 15; display: none;
    `;

    // 虚拟摇杆 Canvas
    this.joystickCanvas = document.createElement('canvas');
    this.joystickCanvas.width = 200;
    this.joystickCanvas.height = 200;
    this.joystickCanvas.style.cssText = `
      position: absolute; bottom: 80px; left: 20px;
      pointer-events: auto; touch-action: none;
    `;
    this.joystickCtx = this.joystickCanvas.getContext('2d')!;
    this.container.appendChild(this.joystickCanvas);

    // 按钮
    this.createButton('⬆', 'right: 30px; bottom: 80px; width: 70px; height: 70px; font-size: 28px;', () => { this.jumpPressed = true; });
    this.createButton('⚔', 'right: 30px; bottom: 170px; width: 60px; height: 60px; font-size: 24px;', () => { this.attackPressed = true; });
    this.createButton('E', 'right: 30px; bottom: 250px; width: 56px; height: 56px; font-size: 22px;', () => { this.interactPressed = true; });
    this.createButton('📦', 'right: 100px; bottom: 250px; width: 50px; height: 50px; font-size: 20px;', () => { this.placePressed = true; });
    this.createButton('⛏', 'right: 100px; bottom: 170px; width: 50px; height: 50px; font-size: 20px;', () => { this.breakPressed = true; });

    document.body.appendChild(this.container);

    // 摇杆触摸事件
    this.joystickCanvas.addEventListener('touchstart', (e) => this.onJoystickStart(e), { passive: false });
    this.joystickCanvas.addEventListener('touchmove', (e) => this.onJoystickMove(e), { passive: false });
    this.joystickCanvas.addEventListener('touchend', (e) => this.onJoystickEnd(e), { passive: false });
    this.joystickCanvas.addEventListener('touchcancel', (e) => this.onJoystickEnd(e), { passive: false });

    // 右半屏视角触摸（绑在 document 上，pointer-events: none 不会阻止）
    document.addEventListener('touchstart', (e) => this.onLookStart(e), { passive: false });
    document.addEventListener('touchmove', (e) => this.onLookMove(e), { passive: false });
    document.addEventListener('touchend', (e) => this.onLookEnd(e), { passive: false });
    document.addEventListener('touchcancel', (e) => this.onLookEnd(e), { passive: false });

    this.drawJoystick(0, 0);
  }

  show(): void {
    if (this.container) {
      this.container.style.display = 'block';
      this.visible = true;
    }
  }

  hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
      this.visible = false;
    }
  }

  isVisible(): boolean {
    return this.visible;
  }

  consumeJump(): boolean {
    if (this.jumpPressed) { this.jumpPressed = false; return true; }
    return false;
  }

  consumeAttack(): boolean {
    if (this.attackPressed) { this.attackPressed = false; return true; }
    return false;
  }

  consumeInteract(): boolean {
    if (this.interactPressed) { this.interactPressed = false; return true; }
    return false;
  }

  consumePlace(): boolean {
    if (this.placePressed) { this.placePressed = false; return true; }
    return false;
  }

  consumeBreak(): boolean {
    if (this.breakPressed) { this.breakPressed = false; return true; }
    return false;
  }

  consumeLookDelta(): { dx: number; dy: number } {
    const dx = this.lookDX;
    const dy = this.lookDY;
    this.lookDX = 0;
    this.lookDY = 0;
    return { dx, dy };
  }

  private createButton(label: string, posStyle: string, onPress: () => void): void {
    const btn = document.createElement('div');
    btn.style.cssText = `
      position: absolute; ${posStyle}
      background: rgba(255,255,255,0.25); border: 2px solid rgba(255,255,255,0.4);
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      pointer-events: auto; touch-action: none; user-select: none;
    `;
    btn.textContent = label;
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onPress();
      btn.style.background = 'rgba(255,255,255,0.45)';
    }, { passive: false });
    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      btn.style.background = 'rgba(255,255,255,0.25)';
    }, { passive: false });
    this.container!.appendChild(btn);
  }

  private onJoystickStart(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.changedTouches[0];
    this.joystickTouchId = touch.identifier;
    const rect = this.joystickCanvas!.getBoundingClientRect();
    this.joystickCenterX = rect.left + rect.width / 2;
    this.joystickCenterY = rect.top + rect.height / 2;
  }

  private onJoystickMove(e: TouchEvent): void {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.joystickTouchId) {
        const ox = touch.clientX - this.joystickCenterX;
        const oy = touch.clientY - this.joystickCenterY;
        this.joystick.handleMove(ox, oy);
        this.drawJoystick(this.joystick.dx * this.JOYSTICK_RADIUS, this.joystick.dy * this.JOYSTICK_RADIUS);
        break;
      }
    }
  }

  private onJoystickEnd(e: TouchEvent): void {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.joystickTouchId) {
        this.joystickTouchId = null;
        this.joystick.handleEnd();
        this.drawJoystick(0, 0);
        break;
      }
    }
  }

  private onLookStart(e: TouchEvent): void {
    if (this.lookTouchId !== null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      // 右半屏
      if (touch.clientX > window.innerWidth * 0.4 && touch.clientY < window.innerHeight * 0.7) {
        this.lookTouchId = touch.identifier;
        this.lookLastX = touch.clientX;
        this.lookLastY = touch.clientY;
        break;
      }
    }
  }

  private onLookMove(e: TouchEvent): void {
    if (this.lookTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.lookTouchId) {
        this.lookDX += (touch.clientX - this.lookLastX) * 0.5;
        this.lookDY += (touch.clientY - this.lookLastY) * 0.5;
        this.lookLastX = touch.clientX;
        this.lookLastY = touch.clientY;
        break;
      }
    }
  }

  private onLookEnd(e: TouchEvent): void {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.lookTouchId) {
        this.lookTouchId = null;
        break;
      }
    }
  }

  private drawJoystick(ix: number, iy: number): void {
    if (!this.joystickCtx) return;
    const ctx = this.joystickCtx;
    const cx = 100;
    const cy = 100;
    const r = this.JOYSTICK_RADIUS;

    ctx.clearRect(0, 0, 200, 200);

    // 外圈
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fill();

    // 内圈
    ctx.beginPath();
    ctx.arc(cx + ix, cy + iy, 30, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
