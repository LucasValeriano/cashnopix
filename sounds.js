/**
 * CashNoPix - Sound Engine
 * Synthesized sounds using Web Audio API - no external files needed
 */

const SFX = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function playTone(opts) {
    try {
      const ac = getCtx();
      const { type = 'sine', freq = 440, freq2 = null, attack = 0.01, decay = 0.1, sustain = 0, release = 0.1, gain = 0.3, delay = 0 } = opts;

      setTimeout(() => {
        const osc = ac.createOscillator();
        const gainNode = ac.createGain();
        osc.connect(gainNode);
        gainNode.connect(ac.destination);

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ac.currentTime);
        if (freq2) osc.frequency.linearRampToValueAtTime(freq2, ac.currentTime + attack + decay + sustain);

        gainNode.gain.setValueAtTime(0, ac.currentTime);
        gainNode.gain.linearRampToValueAtTime(gain, ac.currentTime + attack);
        gainNode.gain.linearRampToValueAtTime(gain * 0.7, ac.currentTime + attack + decay);
        if (sustain > 0) gainNode.gain.setValueAtTime(gain * 0.7, ac.currentTime + attack + decay + sustain);
        gainNode.gain.linearRampToValueAtTime(0, ac.currentTime + attack + decay + sustain + release);

        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + attack + decay + sustain + release);
      }, delay);
    } catch (e) {}
  }

  return {
    /**
     * Tick sound when typing a letter in código
     */
    tick() {
      playTone({ type: 'sine', freq: 800, gain: 0.18, attack: 0.005, decay: 0.05, release: 0.03 });
    },

    /**
     * Success chime when correct code entered
     */
    success() {
      // C - E - G chord arpeggio
      playTone({ freq: 523, gain: 0.25, attack: 0.01, decay: 0.15, release: 0.2, delay: 0 });
      playTone({ freq: 659, gain: 0.25, attack: 0.01, decay: 0.15, release: 0.2, delay: 80 });
      playTone({ freq: 784, gain: 0.30, attack: 0.01, decay: 0.2, release: 0.3, delay: 160 });
    },

    /**
     * Error buzz when wrong code
     */
    error() {
      playTone({ type: 'sawtooth', freq: 180, freq2: 120, gain: 0.2, attack: 0.01, decay: 0.3, release: 0.1 });
    },

    /**
     * Coin/credit sound when clicking evaluation buttons
     */
    coin() {
      // High-pitched coin sound
      playTone({ type: 'sine', freq: 1047, freq2: 1568, gain: 0.22, attack: 0.005, decay: 0.08, release: 0.12 });
      playTone({ type: 'sine', freq: 1568, gain: 0.15, attack: 0.005, decay: 0.05, release: 0.15, delay: 80 });
    },

    /**
     * Ka-ching! Credit modal appears
     */
    kaching() {
      // Multiple coins
      for (let i = 0; i < 4; i++) {
        const freqs = [880, 1047, 1175, 1319];
        playTone({ type: 'sine', freq: freqs[i], gain: 0.2, attack: 0.005, decay: 0.07, release: 0.12, delay: i * 60 });
      }
    },

    /**
     * Navigation/page transition click
     */
    click() {
      playTone({ type: 'sine', freq: 440, gain: 0.12, attack: 0.005, decay: 0.08, release: 0.06 });
    },

    /**
     * Bonus unlock fanfare
     */
    fanfare() {
      const melody = [
        { freq: 523, delay: 0 },
        { freq: 659, delay: 100 },
        { freq: 784, delay: 200 },
        { freq: 1047, delay: 300 },
      ];
      melody.forEach(n => {
        playTone({ freq: n.freq, gain: 0.25, attack: 0.01, decay: 0.12, release: 0.2, delay: n.delay });
      });
    },

    /**
     * Notification pop
     */
    pop() {
      playTone({ type: 'sine', freq: 600, freq2: 900, gain: 0.14, attack: 0.005, decay: 0.1, release: 0.1 });
    },

    /**
     * Copy to clipboard
     */
    copied() {
      playTone({ freq: 880, gain: 0.18, attack: 0.01, decay: 0.08, release: 0.1 });
      playTone({ freq: 1047, gain: 0.15, attack: 0.01, decay: 0.08, release: 0.1, delay: 80 });
    }
  };
})();
