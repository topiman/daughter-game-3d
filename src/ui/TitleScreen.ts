// 标题画面
export class TitleScreen {
  private container: HTMLDivElement;
  onStart: (() => void) | null = null;

  constructor() {
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

    const btn = document.createElement('button');
    btn.style.cssText = `
      padding: 16px 60px; font-size: 24px; cursor: pointer;
      background: rgba(255,255,255,0.9); color: #4A90D9; border: none;
      border-radius: 12px; font-family: inherit; font-weight: bold;
      transition: transform 0.2s;
    `;
    btn.textContent = '🎮 点击开始';
    btn.onmouseenter = () => btn.style.transform = 'scale(1.05)';
    btn.onmouseleave = () => btn.style.transform = 'scale(1)';
    btn.onclick = () => {
      this.hide();
      this.onStart?.();
    };
    this.container.appendChild(btn);

    const hint = document.createElement('div');
    hint.style.cssText = 'color: rgba(255,255,255,0.6); font-size: 13px; margin-top: 30px;';
    hint.innerHTML = 'WASD移动 | 鼠标视角 | 空格跳跃 | E交互 | V切换视角<br>左键破坏/攻击 | 右键放置 | 1-8选物品';
    this.container.appendChild(hint);

    document.body.appendChild(this.container);
  }

  show(): void {
    this.container.style.display = 'flex';
  }

  hide(): void {
    this.container.style.display = 'none';
  }
}
