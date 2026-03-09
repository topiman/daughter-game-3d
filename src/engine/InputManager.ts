// 输入管理 — Pointer Lock + 键鼠
import { CONFIG } from '../data/config';

export class InputManager {
  keys: Set<string> = new Set();
  mouseX = 0;
  mouseY = 0;
  mouseDX = 0;
  mouseDY = 0;
  leftClick = false;
  rightClick = false;
  scrollDelta = 0;
  isLocked = false;

  private _ePressed = false;
  private _vPressed = false;
  private _leftClickConsumed = false;
  private _rightClickConsumed = false;

  constructor(private canvas: HTMLCanvasElement) {
    document.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'KeyE') this._ePressed = true;
      if (e.code === 'KeyV') this._vPressed = true;
    });
    document.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked) return;
      this.mouseDX += e.movementX;
      this.mouseDY += e.movementY;
    });
    document.addEventListener('mousedown', (e) => {
      if (!this.isLocked) return;
      if (e.button === 0) { this.leftClick = true; this._leftClickConsumed = false; }
      if (e.button === 2) { this.rightClick = true; this._rightClickConsumed = false; }
    });
    document.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.leftClick = false;
      if (e.button === 2) this.rightClick = false;
    });
    document.addEventListener('wheel', (e) => {
      this.scrollDelta += Math.sign(e.deltaY);
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.canvas;
    });
  }

  requestPointerLock(): void {
    this.canvas.requestPointerLock();
  }

  exitPointerLock(): void {
    document.exitPointerLock();
  }

  consumeMouseDelta(): { dx: number; dy: number } {
    const dx = this.mouseDX * CONFIG.MOUSE_SENSITIVITY;
    const dy = this.mouseDY * CONFIG.MOUSE_SENSITIVITY;
    this.mouseDX = 0;
    this.mouseDY = 0;
    return { dx, dy };
  }

  consumeScroll(): number {
    const d = this.scrollDelta;
    this.scrollDelta = 0;
    return d;
  }

  consumeEPress(): boolean {
    if (this._ePressed) { this._ePressed = false; return true; }
    return false;
  }

  consumeVPress(): boolean {
    if (this._vPressed) { this._vPressed = false; return true; }
    return false;
  }

  consumeLeftClick(): boolean {
    if (this.leftClick && !this._leftClickConsumed) {
      this._leftClickConsumed = true;
      return true;
    }
    return false;
  }

  consumeRightClick(): boolean {
    if (this.rightClick && !this._rightClickConsumed) {
      this._rightClickConsumed = true;
      return true;
    }
    return false;
  }

  isKeyDown(code: string): boolean {
    return this.keys.has(code);
  }

  getNumberKey(): number {
    for (let i = 1; i <= 8; i++) {
      if (this.keys.has(`Digit${i}`)) return i - 1;
    }
    return -1;
  }

  endFrame(): void {
    // Reset per-frame states
  }
}
