// 音频系统 — Web Audio API 代码合成 8-bit BGM + 音效
export class AudioSystem {
  private audioCtx: AudioContext;
  private bgmGain: GainNode;
  private sfxGain: GainNode;
  private bgmPlaying = false;
  private bgmNodes: OscillatorNode[] = [];
  private bgmInterval: number | null = null;

  constructor() {
    this.audioCtx = new AudioContext();
    this.bgmGain = this.audioCtx.createGain();
    this.bgmGain.gain.value = 0.3;
    this.bgmGain.connect(this.audioCtx.destination);
    this.sfxGain = this.audioCtx.createGain();
    this.sfxGain.gain.value = 0.5;
    this.sfxGain.connect(this.audioCtx.destination);

    // iOS/iPad 需要在用户交互时解锁 AudioContext
    const unlock = () => {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('touchend', unlock);
      document.removeEventListener('click', unlock);
    };
    document.addEventListener('touchstart', unlock, { passive: true });
    document.addEventListener('touchend', unlock, { passive: true });
    document.addEventListener('click', unlock, { passive: true });
  }

  playBGM(): void {
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    // 简单的 C 大调 8-bit 循环旋律
    const notes = [262, 294, 330, 349, 392, 349, 330, 294]; // C D E F G F E D
    const durations = [0.25, 0.25, 0.25, 0.25, 0.5, 0.25, 0.25, 0.5];
    let noteIndex = 0;
    let time = this.audioCtx.currentTime;

    const scheduleNotes = () => {
      if (!this.bgmPlaying) return;
      for (let i = 0; i < notes.length; i++) {
        const idx = (noteIndex + i) % notes.length;
        const osc = this.audioCtx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = notes[idx];
        const noteGain = this.audioCtx.createGain();
        noteGain.gain.setValueAtTime(0.3, time);
        noteGain.gain.exponentialRampToValueAtTime(0.01, time + durations[idx] * 0.9);
        osc.connect(noteGain);
        noteGain.connect(this.bgmGain);
        osc.start(time);
        osc.stop(time + durations[idx]);
        time += durations[idx];
      }
      noteIndex = (noteIndex + notes.length) % notes.length;
    };

    scheduleNotes();
    this.bgmInterval = window.setInterval(() => {
      time = this.audioCtx.currentTime;
      scheduleNotes();
    }, 2500) as unknown as number;
  }

  stopBGM(): void {
    this.bgmPlaying = false;
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  setBGMVolume(v: number): void {
    this.bgmGain.gain.value = Math.max(0, Math.min(1, v));
  }

  setSFXVolume(v: number): void {
    this.sfxGain.gain.value = Math.max(0, Math.min(1, v));
  }

  playSFX(type: 'jump' | 'sword' | 'pickup' | 'eat' | 'hurt' | 'death' | 'bark' | 'place' | 'break' | 'toilet'): void {
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.sfxGain);

    switch (type) {
      case 'jump':
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
        break;
      case 'sword':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
        break;
      case 'pickup':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
        break;
      case 'eat':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(500, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
        break;
      case 'hurt':
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.2);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.25);
        osc.start(now); osc.stop(now + 0.25);
        break;
      case 'death':
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.5);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now); osc.stop(now + 0.6);
        break;
      case 'bark':
        osc.type = 'square';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.linearRampToValueAtTime(500, now + 0.05);
        osc.frequency.linearRampToValueAtTime(350, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
        break;
      case 'place':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(300, now + 0.08);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
        break;
      case 'break':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
        break;
      case 'toilet':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.1);
        osc.frequency.linearRampToValueAtTime(250, now + 0.2);
        osc.frequency.linearRampToValueAtTime(80, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.35);
        osc.start(now); osc.stop(now + 0.35);
        break;
    }
  }
}
