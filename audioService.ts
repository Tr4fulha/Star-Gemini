import { APP_VERSION } from './constants';

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

// --- ASSET MANAGER ---
const buffers: Record<string, AudioBuffer> = {};
let packLoaded = false; 

// Mapa de Arquivos
const SOUND_FILES = {
    'shoot': '/sounds/shoot.mp3',
    'explosion': '/sounds/explosion.mp3',
    'hit': '/sounds/hit.mp3',
    'collect': '/sounds/collect.mp3',
    'powerup': '/sounds/powerup.mp3',
    'game_over': '/sounds/gameover.mp3',
    'ultimate_use': '/sounds/ultimate.mp3',
    'ui_click': '/sounds/click.mp3',
    'bgm_game': '/sounds/music_game.mp3',
    'bgm_menu': '/sounds/music_menu.mp3'
};

const initAudio = () => {
  if (!audioCtx) {
    try {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
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
    } catch (e) {
        console.warn("AudioContext init failed", e);
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
};

const loadSound = async (key: string, url: string) => {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        // Verificação de Segurança: Tipos MIME inválidos
        const contentType = response.headers.get('content-type');
        if (contentType && (contentType.includes('text/html') || contentType.includes('text/plain'))) {
             throw new Error(`Arquivo inválido (Text/HTML detectado em vez de Audio)`);
        }

        const arrayBuffer = await response.arrayBuffer();

        // Verificação LFS / Corrupção
        if (arrayBuffer.byteLength < 500) {
             // Arquivos muito pequenos geralmente são ponteiros LFS ou erros
             throw new Error(`Arquivo muito pequeno (${arrayBuffer.byteLength} bytes) - provável ponteiro Git LFS ou erro.`);
        }
        
        // Decodificação Segura
        try {
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            buffers[key] = audioBuffer;
        } catch (decodeError) {
            // Falha silenciosa para usar o sintetizador depois
        }

    } catch (error) {
        // Fallback silencioso
    }
};

export const loadAllSounds = async () => {
    // Carrega sons em paralelo
    const promises = Object.entries(SOUND_FILES).map(([key, url]) => loadSound(key, url));
    await Promise.allSettled(promises);
    
    // Se carregou pelo menos 50% dos sons, considera pack ativo
    const loadedCount = Object.keys(buffers).length;
    const totalCount = Object.keys(SOUND_FILES).length;
    
    if (loadedCount > totalCount / 2) {
        packLoaded = true;
        console.log(`[Audio] Modo HQ Ativo (${loadedCount}/${totalCount})`);
    } else {
        console.log(`[Audio] Modo Synth Ativo (Fallback)`);
        packLoaded = false;
    }
};

const setMasterVolume = (val: number) => {
    volMaster = Math.max(0, Math.min(1, val));
    if (masterGain && audioCtx) masterGain.gain.setTargetAtTime(volMaster, audioCtx.currentTime, 0.1);
}

const setMusicVolume = (val: number) => {
    volMusic = Math.max(0, Math.min(1, val));
    if (musicGain && audioCtx) musicGain.gain.setTargetAtTime(volMusic, audioCtx.currentTime, 0.1);
}

const setSfxVolume = (val: number) => {
    volSfx = Math.max(0, Math.min(1, val));
    if (sfxGain && audioCtx) sfxGain.gain.setTargetAtTime(volSfx, audioCtx.currentTime, 0.1);
}

const playBuffer = (key: string, vol: number = 1.0, loop: boolean = false): boolean => {
    if (isMuted || !audioCtx || !sfxGain || !buffers[key]) return false;

    // Se a música já estiver tocando, não reinicia
    if (loop && currentTrackId === key && bgmSource) return true;
    
    if (loop && bgmSource) {
         try { bgmSource.stop(); } catch(e) {}
         bgmSource = null;
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffers[key];
    source.loop = loop;

    const gain = audioCtx.createGain();
    gain.gain.value = vol;

    source.connect(gain);
    gain.connect(loop ? musicGain! : sfxGain!);
    
    source.start();
    
    if (loop) {
        bgmSource = source;
        currentTrackId = key;
    }

    return true;
};

// --- SINTETIZADORES (FALLBACK) ---
// Usados quando o arquivo MP3 falha ou não existe

const playTone = (freq: number, type: OscillatorType, duration: number, slideTo: number | null = null, vol: number = 0.5) => {
  if (isMuted) return;
  if (!audioCtx || !sfxGain) initAudio();
  if (!audioCtx || !sfxGain) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, audioCtx.currentTime + duration);
  }

  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

  osc.connect(gain);
  gain.connect(sfxGain);

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};

const playNoise = (duration: number, vol: number = 0.5) => {
    if (isMuted) return;
    if (!audioCtx || !sfxGain || !cachedNoiseBuffer) initAudio();
    if (!audioCtx || !sfxGain || !cachedNoiseBuffer) return;

    const noise = audioCtx.createBufferSource();
    noise.buffer = cachedNoiseBuffer;

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(vol, audioCtx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    noise.connect(noiseGain);
    noiseGain.connect(sfxGain);
    
    noise.start(0, 0, duration);
};

// --- API PÚBLICA ---

export const music = {
  playGame: () => {
    initAudio();
    if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }

    // Tenta tocar arquivo MP3
    if (playBuffer('bgm_game', 0.8, true)) return;

    // Fallback: Gerador Procedural de Música
    let beat = 0;
    const playStep = () => {
      if (!audioCtx || !musicGain || isMuted || audioCtx.state === 'suspended') return;
      
      const t = audioCtx.currentTime;
      
      // Kick (Bumbo)
      if (beat % 4 === 0) {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.1);
        g.gain.setValueAtTime(0.7, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(g); g.connect(musicGain!);
        osc.start(); osc.stop(t + 0.1);
      }
      
      // Bass (Baixo)
      const bassFreqs = [55, 55, 41, 41, 48, 48, 36, 36];
      const freq = bassFreqs[Math.floor(beat/4) % bassFreqs.length];
      if (beat % 2 === 0) {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.connect(g); g.connect(musicGain!);
        osc.start(); osc.stop(t + 0.12);
      }

      // HiHat (Chimbal)
      if (beat % 4 === 2 && cachedNoiseBuffer) {
        const n = audioCtx.createBufferSource();
        n.buffer = cachedNoiseBuffer;
        const ng = audioCtx.createGain();
        ng.gain.setValueAtTime(0.15, t);
        ng.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        n.connect(ng); ng.connect(musicGain!);
        n.start(t, 0, 0.05);
      }
      
      // Melody (Arpejo simples)
      if (beat % 8 === 0 || beat % 8 === 3 || beat % 8 === 6) {
        const melody = [440, 523, 659, 783]; // Am, C, E, G
        const mFreq = melody[Math.floor(beat/8) % melody.length];
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(mFreq * (beat%2===0?1:2), t);
        g.gain.setValueAtTime(0.05, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(g); g.connect(musicGain!);
        osc.start(); osc.stop(t + 0.1);
      }

      beat = (beat + 1) % 32;
    };

    bgmInterval = window.setInterval(playStep, 110); // ~136 BPM
  },
  playMenu: () => {
      initAudio();
      if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }
      if (!playBuffer('bgm_menu', 0.6, true)) {
          // Fallback silencioso ou drone para menu
      }
  },
  stop: () => {
    if (bgmSource) {
        try { bgmSource.stop(); } catch(e){}
        bgmSource = null;
    }
    currentTrackId = null;
    if (bgmInterval) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }
  },
  setVolume: setMusicVolume
};

export const sfx = {
  shoot: () => {
      if (!playBuffer('shoot', 0.5)) playTone(800, 'square', 0.1, 400, 0.15);
  },
  explosion: () => {
      if (!playBuffer('explosion', 0.6)) playNoise(0.3, 0.4);
  },
  hit: () => {
      if (!playBuffer('hit', 0.8)) playTone(150, 'sawtooth', 0.15, 50, 0.3);
  },
  collect: () => {
    if (!playBuffer('collect', 0.6)) {
        playTone(1200, 'sine', 0.1, 1800, 0.2); 
    }
  },
  powerup: () => {
    if (!playBuffer('powerup', 0.7)) playTone(400, 'square', 0.2, 800, 0.3);
  },
  gameOver: () => {
      if (!playBuffer('game_over', 1.0)) playTone(300, 'sawtooth', 1.5, 50, 0.5);
  },
  ultimateReady: () => {
    playTone(600, 'sine', 0.2, 1200, 0.3);
  },
  ultimateUse: () => {
    if (!playBuffer('ultimate_use', 0.8)) {
        playNoise(1.0, 0.6);
        playTone(100, 'sawtooth', 1.0, 10, 0.6);
    }
  },
  uiClick: () => {
      if (!playBuffer('ui_click', 0.5)) playTone(2000, 'sine', 0.05, 3000, 0.1);
  },
  init: initAudio,
  loadAllSounds: loadAllSounds,
  setVolume: setSfxVolume,
  setMasterVolume: setMasterVolume,
  isPackLoaded: () => packLoaded
};