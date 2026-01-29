// Simple Retro Synthesizer using Web Audio API
// No assets required, generates sound on the fly

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let bgmInterval: number | null = null;
let isMuted = false;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3; // Volume geral (30%)
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const playTone = (freq: number, type: OscillatorType, duration: number, slideTo: number | null = null) => {
  if (isMuted) return;
  if (!audioCtx || !masterGain) initAudio();
  if (!audioCtx || !masterGain) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, audioCtx.currentTime + duration);
  }

  gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};

const playNoise = (duration: number) => {
    if (isMuted) return;
    if (!audioCtx || !masterGain) initAudio();
    if (!audioCtx || !masterGain) return;

    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    noise.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start();
};

export const music = {
  start: () => {
    if (bgmInterval) return;
    initAudio();
    
    let beat = 0;
    // Simple Synthwave Loop (120 BPM approx)
    const playStep = () => {
      if (!audioCtx || isMuted) return;
      
      const t = audioCtx.currentTime;
      
      // Kick (Every beat)
      if (beat % 4 === 0) {
        playTone(150, 'sine', 0.1, 50);
      }
      
      // Bassline (Rolling 8ths)
      const bassNote = beat < 16 ? 65 : 43; // F2 -> F1
      if (beat % 2 === 0) {
        playTone(bassNote, 'sawtooth', 0.1);
      }
      
      // Snare (Every other beat)
      if (beat % 8 === 4) {
        playNoise(0.15);
      }
      
      // Hi-hat (16ths)
      if (beat % 2 !== 0) {
        playNoise(0.05);
      }

      beat = (beat + 1) % 32;
    };

    bgmInterval = window.setInterval(playStep, 125); // 16th notes at 120bpm
  },
  stop: () => {
    if (bgmInterval) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }
  }
};

export const sfx = {
  shoot: () => playTone(800, 'square', 0.1, 300),
  explosion: () => playNoise(0.3),
  hit: () => playTone(150, 'sawtooth', 0.1, 50),
  collect: () => {
    playTone(1200, 'sine', 0.1, 1800); 
    setTimeout(() => playTone(1800, 'sine', 0.2), 50);
  },
  powerup: () => {
    playTone(400, 'square', 0.1);
    setTimeout(() => playTone(600, 'square', 0.1), 100);
    setTimeout(() => playTone(800, 'square', 0.2), 200);
  },
  gameOver: () => playTone(300, 'sawtooth', 1.0, 50),
  xp: () => playTone(2000, 'sine', 0.05),
  ultimateReady: () => {
    playTone(400, 'sine', 0.1);
    setTimeout(() => playTone(600, 'sine', 0.1), 100);
    setTimeout(() => playTone(800, 'sine', 0.3), 200);
  },
  ultimateUse: () => {
    playNoise(1.0); // Big woosh
    playTone(200, 'sawtooth', 1.5, 50);
  },
  init: initAudio
};