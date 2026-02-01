
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;

let bgmInterval: number | null = null;
let bgmSource: AudioBufferSourceNode | null = null;
let currentTrackId: string | null = null;
let isMuted = false;

// Volumes
let volMaster = 0.5;
let volMusic = 0.5;
let volSfx = 0.5;

let cachedNoiseBuffer: AudioBuffer | null = null;

const buffers: Record<string, AudioBuffer> = {};
let packLoaded = false;

// Nomes dos arquivos (sem caminhos, apenas nomes)
const SOUND_FILES = {
    'shoot': 'shoot.mp3',
    'explosion': 'explosion.mp3',
    'hit': 'hit.mp3',
    'collect': 'collect.mp3',
    'powerup': 'powerup.mp3',
    'game_over': 'gameover.mp3',
    'ultimate_use': 'ultimate.mp3',
    'ui_click': 'click.mp3',
    'bgm_game': 'music_game.mp3',
    'bgm_menu': 'music_menu.mp3'
};

const initAudio = () => {
  if (!audioCtx) {
    try {
        const CtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (CtxClass) {
            audioCtx = new CtxClass();
            
            masterGain = audioCtx.createGain();
            masterGain.gain.value = volMaster;
            masterGain.connect(audioCtx.destination);
            
            musicGain = audioCtx.createGain();
            musicGain.gain.value = volMusic;
            musicGain.connect(masterGain);

            sfxGain = audioCtx.createGain();
            sfxGain.gain.value = volSfx;
            sfxGain.connect(masterGain);

            const bufferSize = audioCtx.sampleRate * 2.0; 
            cachedNoiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = cachedNoiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
        }
    } catch (e) {
        console.warn("AudioContext init failed", e);
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
};

// Helper para descobrir a URL base de forma segura e evitar erro de undefined
const getBaseUrl = () => {
    try {
        // @ts-ignore
        return (import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '/';
    } catch (e) {
        return '/';
    }
};

const fetchWithRetry = async (filename: string): Promise<ArrayBuffer> => {
    const baseUrl = getBaseUrl();
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    
    // Tenta vários caminhos possíveis para resolver problemas de deploy/ambiente
    const paths = [
        `${cleanBase}sounds/${filename}`,
        `/sounds/${filename}`,
        `sounds/${filename}`
    ];

    // Remove duplicatas
    const uniquePaths = [...new Set(paths)];

    for (const path of uniquePaths) {
        try {
            const response = await fetch(path);
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                // Algumas hospedagens retornam o index.html (200 OK) em vez de 404
                if (contentType && contentType.includes('text/html')) continue; 
                return await response.arrayBuffer();
            }
        } catch (e) {
            // Tenta o próximo caminho
        }
    }
    throw new Error(`Sound not found: ${filename}`);
};

const loadSound = async (key: string, filename: string) => {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;

    try {
        const arrayBuffer = await fetchWithRetry(filename);
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        buffers[key] = audioBuffer;
        packLoaded = true;
    } catch (error) {
        // Silencioso, usará fallback (sintetizador) se falhar
    }
};

export const loadAllSounds = async () => {
    const promises = Object.entries(SOUND_FILES).map(([key, filename]) => loadSound(key, filename));
    await Promise.allSettled(promises);
};

// --- PLAYBACK ---

const playBuffer = (key: string, vol: number = 1.0, loop: boolean = false): boolean => {
    if (isMuted || !audioCtx || !buffers[key]) return false;

    if (loop && currentTrackId === key && bgmSource) return true;
    
    if (loop && bgmSource) {
         try { bgmSource.stop(); } catch(e) {}
         bgmSource = null;
    }

    try {
        const source = audioCtx.createBufferSource();
        source.buffer = buffers[key];
        source.loop = loop;

        const gain = audioCtx.createGain();
        gain.gain.value = vol;

        source.connect(gain);
        if (loop && musicGain) gain.connect(musicGain);
        else if (sfxGain) gain.connect(sfxGain);
        
        source.start();
        
        if (loop) {
            bgmSource = source;
            currentTrackId = key;
        }
        return true;
    } catch (e) {
        return false;
    }
};

// --- SINTETIZADORES (FALLBACK - Usado quando arquivos não carregam) ---

const playTone = (freq: number, type: OscillatorType, duration: number, slideTo: number | null = null, vol: number = 0.5) => {
  if (isMuted || !audioCtx || !sfxGain) return;
  try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, audioCtx.currentTime + duration);
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
  } catch(e) {}
};

const playNoise = (duration: number, vol: number = 0.5) => {
    if (isMuted || !audioCtx || !sfxGain || !cachedNoiseBuffer) return;
    try {
        const noise = audioCtx.createBufferSource();
        noise.buffer = cachedNoiseBuffer;
        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(vol, audioCtx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        noise.connect(noiseGain);
        noiseGain.connect(sfxGain);
        noise.start();
    } catch(e) {}
};

// --- PUBLIC API ---

export const music = {
  playGame: () => {
    initAudio();
    if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }
    if (playBuffer('bgm_game', 0.8, true)) return;

    // Fallback Synth Music (Cyberpunk Beat)
    let beat = 0;
    bgmInterval = window.setInterval(() => {
      if (!audioCtx || !musicGain || isMuted || audioCtx.state !== 'running') return;
      // Kick
      if (beat % 4 === 0) playTone(100, 'sine', 0.1, 50, 0.6);
      // Bass
      if (beat % 2 === 0) playTone(55, 'sawtooth', 0.2, null, 0.2);
      // Lead
      if (beat % 8 === 0) playTone(440, 'square', 0.1, 880, 0.05);
      beat = (beat + 1) % 32;
    }, 125);
  },
  playMenu: () => {
      initAudio();
      if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }
      playBuffer('bgm_menu', 0.6, true);
  },
  stop: () => {
    if (bgmSource) { try { bgmSource.stop(); } catch(e){} bgmSource = null; }
    currentTrackId = null;
    if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }
  },
  setVolume: (val: number) => {
      volMusic = Math.max(0, Math.min(1, val));
      if (musicGain && audioCtx) musicGain.gain.setTargetAtTime(volMusic, audioCtx.currentTime, 0.1);
  }
};

export const sfx = {
  shoot: () => { if (!playBuffer('shoot', 0.4)) playTone(600, 'square', 0.1, 300, 0.1); },
  explosion: () => { if (!playBuffer('explosion', 0.6)) playNoise(0.4, 0.4); },
  hit: () => { if (!playBuffer('hit', 0.8)) playTone(150, 'sawtooth', 0.1, 50, 0.3); },
  collect: () => { if (!playBuffer('collect', 0.6)) playTone(1500, 'sine', 0.1, 2000, 0.2); },
  powerup: () => { if (!playBuffer('powerup', 0.7)) playTone(440, 'square', 0.2, 880, 0.2); },
  gameOver: () => { if (!playBuffer('game_over', 1.0)) playTone(200, 'sawtooth', 1.0, 100, 0.5); },
  ultimateUse: () => { if (!playBuffer('ultimate_use', 0.8)) playNoise(1.0, 0.6); },
  uiClick: () => { if (!playBuffer('ui_click', 0.5)) playTone(2000, 'sine', 0.05, null, 0.1); },
  
  init: initAudio,
  loadAllSounds: loadAllSounds,
  setVolume: (val: number) => {
      volSfx = Math.max(0, Math.min(1, val));
      if (sfxGain && audioCtx) sfxGain.gain.setTargetAtTime(volSfx, audioCtx.currentTime, 0.1);
  },
  setMasterVolume: (val: number) => {
      volMaster = Math.max(0, Math.min(1, val));
      if (masterGain && audioCtx) masterGain.gain.setTargetAtTime(volMaster, audioCtx.currentTime, 0.1);
  },
  isPackLoaded: () => packLoaded
};
