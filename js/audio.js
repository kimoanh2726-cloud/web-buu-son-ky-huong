/**
 * Hệ thống Âm Thanh Tâm Linh Chân Thực sử dụng Web Audio API
 * Tự tổng hợp âm thanh vật lý: Tiếng chuông bát, gõ mõ, lắc ống tre, rơi keo gỗ
 * Hoạt động 100% offline, không phụ thuộc file ngoài, không bị trễ.
 */
class ZenAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.ambientRunning = false;
    this.ambientInterval = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.ambientRunning) {
      this.stopAmbient();
    }
    return this.isMuted;
  }

  // Tiếng chuông chùa / Chuông bát đồng ngân vang sâu lắng
  playTempleBell(pitch = 260) {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    // Các họa âm của chuông đồng cổ (hài âm không chuẩn)
    const partials = [
      { ratio: 1.0, gain: 0.6, decay: 4.5 },
      { ratio: 1.51, gain: 0.35, decay: 3.5 },
      { ratio: 2.05, gain: 0.25, decay: 2.8 },
      { ratio: 2.76, gain: 0.18, decay: 2.0 },
      { ratio: 3.42, gain: 0.12, decay: 1.4 },
      { ratio: 4.80, gain: 0.08, decay: 0.9 }
    ];

    partials.forEach(p => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch * p.ratio, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(p.gain * 0.4, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + p.decay + 0.1);
    });
  }

  // Tiếng mõ gỗ trầm ấm
  playWoodBlock() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.08);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Tiếng que tre va đập trong ống xăm (Bamboo Sticks Rattle)
  playBambooRattle() {
    if (this.isMuted) return;
    this.init();

    const count = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const delay = Math.random() * 0.12;
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        
        // Tạo tiếng cạch của tre
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        const baseFreq = 1200 + (Math.random() * 800);
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + 0.025);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(baseFreq, now);
        filter.Q.setValueAtTime(5, now);

        gain.gain.setValueAtTime(0.25 + Math.random() * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);
      }, delay * 1000);
    }
  }

  // Tiếng 1 thẻ tre văng ra rơi xuống bàn
  playStickDrop() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    // Tiếng cạch đầu tiên
    this.createWoodClick(now, 920, 0.4, 0.08);
    // Tiếng nảy thứ hai
    this.createWoodClick(now + 0.09, 1100, 0.2, 0.06);
    // Tiếng nảy thứ ba nhẹ
    this.createWoodClick(now + 0.16, 1250, 0.08, 0.04);
  }

  // Tiếng gieo 2 đồng keo âm dương rơi lách cách
  playTossDivinationBlocks() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    // Miếng keo 1 rơi
    this.createWoodClick(now, 620, 0.5, 0.1);
    this.createWoodClick(now + 0.06, 780, 0.25, 0.07);

    // Miếng keo 2 rơi lệch 0.12s
    this.createWoodClick(now + 0.12, 540, 0.45, 0.1);
    this.createWoodClick(now + 0.19, 680, 0.2, 0.06);
    this.createWoodClick(now + 0.26, 850, 0.08, 0.04);
  }

  createWoodClick(time, freq, volume, duration) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.35, time + duration);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  // Tiếng thanh tịnh khi chọn đúng / Đắc Quẻ
  playSuccessChime() {
    if (this.isMuted) return;
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Cát Tường)
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playSingingBowl(freq, 1.8);
      }, idx * 110);
    });
  }

  // Tiếng trầm nhắc nhở khi chọn sai / Chưa thông
  playFailChime() {
    if (this.isMuted) return;
    this.init();
    this.playSingingBowl(185.0, 1.5); // Nốt trầm tĩnh lặng
  }

  // Tiếng chuông xoay Tây Tạng / Khánh đồng ngân dài
  playSingingBowl(freq = 440, duration = 2.5) {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Tạo hiệu ứng ngân rung (beating) nhẹ 1.5Hz
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq + 1.5, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + duration + 0.1);
    osc2.stop(now + duration + 0.1);
  }

  // Khởi động nhạc nền thiền vi vu nhẹ nhàng (Tùy chọn)
  startAmbient() {
    if (this.ambientRunning) return;
    this.init();
    this.ambientRunning = true;
    
    // Thỉnh thoảng một nốt chuông ngân xa
    const pentatonic = [220, 246.94, 277.18, 329.63, 369.99]; // Ngũ cung Nam Bộ
    this.ambientInterval = setInterval(() => {
      if (this.isMuted || !this.ambientRunning) return;
      const note = pentatonic[Math.floor(Math.random() * pentatonic.length)];
      this.playSingingBowl(note, 4.0);
    }, 7000);
  }

  stopAmbient() {
    this.ambientRunning = false;
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }
}

// Khởi tạo instance toàn cục
window.zenAudio = new ZenAudio();
