// 暂停菜单 — 增加保存按钮
export class PauseMenu {
  private container: HTMLDivElement;
  private visible = false;
  onResume: (() => void) | null = null;
  onSave: (() => void) | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.7); z-index: 100;
      display: none; flex-direction: column;
      align-items: center; justify-content: center; gap: 20px;
      font-family: 'Courier New', monospace;
    `;

    const title = document.createElement('div');
    title.style.cssText = 'color: white; font-size: 36px; margin-bottom: 20px;';
    title.textContent = '⏸️ 暂停';
    this.container.appendChild(title);

    const resumeBtn = document.createElement('button');
    resumeBtn.style.cssText = `
      padding: 12px 40px; font-size: 20px; cursor: pointer;
      background: #4488FF; color: white; border: none; border-radius: 8px;
      font-family: inherit; pointer-events: auto;
    `;
    resumeBtn.textContent = '继续游戏';
    resumeBtn.onclick = () => {
      this.hide();
      this.onResume?.();
    };
    this.container.appendChild(resumeBtn);

    // 保存游戏按钮
    const saveBtn = document.createElement('button');
    saveBtn.style.cssText = `
      padding: 12px 40px; font-size: 20px; cursor: pointer;
      background: #44AA44; color: white; border: none; border-radius: 8px;
      font-family: inherit; pointer-events: auto;
    `;
    saveBtn.textContent = '💾 保存游戏';
    saveBtn.onclick = () => {
      this.onSave?.();
      saveBtn.textContent = '✅ 已保存！';
      setTimeout(() => { saveBtn.textContent = '💾 保存游戏'; }, 2000);
    };
    this.container.appendChild(saveBtn);

    const hint = document.createElement('div');
    hint.style.cssText = 'color: #aaa; font-size: 14px; margin-top: 20px;';
    hint.textContent = '点击「继续游戏」锁定鼠标继续';
    this.container.appendChild(hint);

    document.body.appendChild(this.container);
  }

  show(): void {
    this.visible = true;
    this.container.style.display = 'flex';
  }

  hide(): void {
    this.visible = false;
    this.container.style.display = 'none';
  }

  isVisible(): boolean {
    return this.visible;
  }
}
