// 死亡结算画面
export class GameOverScreen {
  private container: HTMLDivElement;
  private daysEl: HTMLDivElement;
  private killsEl: HTMLDivElement;
  onRestart: (() => void) | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(139,0,0,0.8); z-index: 200;
      display: none; flex-direction: column;
      align-items: center; justify-content: center; gap: 16px;
      font-family: 'Courier New', monospace;
    `;

    const title = document.createElement('div');
    title.style.cssText = 'color: white; font-size: 48px; margin-bottom: 10px;';
    title.textContent = '💀 你死了';
    this.container.appendChild(title);

    this.daysEl = document.createElement('div');
    this.daysEl.style.cssText = 'color: #FFD700; font-size: 24px;';
    this.container.appendChild(this.daysEl);

    this.killsEl = document.createElement('div');
    this.killsEl.style.cssText = 'color: #FFD700; font-size: 24px;';
    this.container.appendChild(this.killsEl);

    const btn = document.createElement('button');
    btn.style.cssText = `
      padding: 14px 50px; font-size: 22px; cursor: pointer;
      background: #FF4444; color: white; border: none; border-radius: 8px;
      font-family: inherit; margin-top: 30px; pointer-events: auto;
    `;
    btn.textContent = '🔄 重新开始';
    btn.onclick = () => {
      this.hide();
      this.onRestart?.();
    };
    this.container.appendChild(btn);

    document.body.appendChild(this.container);
  }

  show(days: number, kills: number): void {
    this.daysEl.textContent = `⏳ 存活天数: ${days}`;
    this.killsEl.textContent = `⚔️ 击杀变异人: ${kills}`;
    this.container.style.display = 'flex';
  }

  hide(): void {
    this.container.style.display = 'none';
  }
}
