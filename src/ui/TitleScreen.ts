// 标题画面 — 支持移动端检测 + 继续游戏
import { isTouchDevice } from './TouchControls';

export class TitleScreen {
  private container: HTMLDivElement;
  private continueBtn: HTMLButtonElement;
  onStart: (() => void) | null = null;
  onContinue: (() => void) | null = null;

  constructor() {
    const isTouch = typeof window !== 'undefined' && isTouchDevice();

    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(180deg, #87CEEB 0%, #4A90D9 100%);
      z-index: 300; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 20px;
      font-family: 'Courier New', monospace;
    `;

    const title = document.createElement('div');
    title.style.cssText = `
      color: white; font-size: 48px; text-shadow: 3px 3px 6px rgba(0,0,0,0.4);
      margin-bottom: 10px;
    `;
    title.textContent = '💧 水方块生存';
    this.container.appendChild(title);

    const subtitle = document.createElement('div');
    subtitle.style.cssText = 'color: rgba(255,255,255,0.8); font-size: 18px; margin-bottom: 30px;';
    subtitle.textContent = '3D 重制版';
    this.container.appendChild(subtitle);

    // 继续游戏按钮（默认隐藏）
    this.continueBtn = document.createElement('button');
    this.continueBtn.style.cssText = `
      padding: 16px 60px; font-size: 24px; cursor: pointer;
      background: rgba(255,200,50,0.9); color: #4A5030; border: none;
      border-radius: 12px; font-family: inherit; font-weight: bold;
      transition: transform 0.2s; display: none;
    `;
    this.continueBtn.textContent = '📂 继续游戏';
    this.continueBtn.onmouseenter = () => this.continueBtn.style.transform = 'scale(1.05)';
    this.continueBtn.onmouseleave = () => this.continueBtn.style.transform = 'scale(1)';
    this.continueBtn.onclick = () => {
      this.hide();
      this.onContinue?.();
    };
    this.container.appendChild(this.continueBtn);

    const btn = document.createElement('button');
    btn.style.cssText = `
      padding: 16px 60px; font-size: 24px; cursor: pointer;
      background: rgba(255,255,255,0.9); color: #4A90D9; border: none;
      border-radius: 12px; font-family: inherit; font-weight: bold;
      transition: transform 0.2s;
    `;
    btn.textContent = '🎮 新游戏';
    btn.onmouseenter = () => btn.style.transform = 'scale(1.05)';
    btn.onmouseleave = () => btn.style.transform = 'scale(1)';
    btn.onclick = () => {
      this.hide();
      this.onStart?.();
    };
    this.container.appendChild(btn);

    // 提示文字
    const startHint = document.createElement('div');
    startHint.style.cssText = 'color: rgba(255,255,255,0.7); font-size: 15px; margin-top: 10px;';
    startHint.textContent = isTouch ? '触摸开始游戏' : '点击画面开始游戏';
    this.container.appendChild(startHint);

    const hint = document.createElement('div');
    hint.style.cssText = 'color: rgba(255,255,255,0.6); font-size: 13px; margin-top: 20px;';
    if (isTouch) {
      hint.innerHTML = '摇杆移动 | 拖动视角 | 按钮操作';
    } else {
      hint.innerHTML = 'WASD移动 | 鼠标视角 | 空格跳跃 | E交互 | V切换视角<br>左键破坏/攻击 | 右键放置 | 1-8选物品';
    }
    this.container.appendChild(hint);

    document.body.appendChild(this.container);
  }

  showContinueButton(): void {
    this.continueBtn.style.display = 'block';
  }

  hideContinueButton(): void {
    this.continueBtn.style.display = 'none';
  }

  show(): void {
    this.container.style.display = 'flex';
  }

  hide(): void {
    this.container.style.display = 'none';
  }
}
