
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

// Mapa de Arquivos: Devem estar na pasta /public/sounds/
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
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(e => console.warn("Audio resume failed (interaction needed)", e));
  }
};

const loadSound = async (key: string, url: string) => {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;

    try {
        // Cache Buster: Adiciona versão para forçar atualização no Vercel
        const versionedUrl = `${url}?v=${APP_VERSION}`;
        
        const response = await fetch(versionedUrl);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        }

        // Verificação de tipo para evitar erro de decodificação de HTML (404 page)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
             throw new Error(`Recebido HTML em vez de Áudio. O arquivo provavelmente não existe (404). Verifique o nome/caminho.`);
        }

        const arrayBuffer = await response.arrayBuffer();
        
        // Decodificação segura
        try {
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            buffers[key] = audioBuffer;
            packLoaded = true; 
        } catch (decodeError) {
            throw new Error(`Erro ao decodificar áudio (Arquivo corrompido ou formato inválido): ${decodeError}`);
        }

    } catch (error) {
        console.warn(`[Audio] Falha ao carregar ${key} (${url}):`, error);
        // Não lançamos erro para permitir que o jogo continue com o sintetizador
    }
};

export const loadAllSounds = async () => {
    console.log(`[Audio] Iniciando carregamento de assets (v${APP_VERSION})...`);
    const promises = Object.entries(SOUND_FILES).map(([key, url]) => loadSound(key, url));
    await Promise.all(promises);
    if (packLoaded) {
        console.log("[Audio] Assets carregados com sucesso. Modo HQ ativado.");
    } else {
        console.warn("[Audio] Nenhum asset encontrado. Usando modo Sintetizador (Fallback). Verifique a pasta /public/sounds.");
    }
};

const setMasterVolume = (val: number) => {
    volMaster = Math.max(0, Math.min(1, val));
    if (masterGain) masterGain.gain.setTargetAtTime(volMaster, audioCtx?.currentTime || 0, 0.1);
}

const setMusicVolume = (val: number) => {
    volMusic = Math.max(0, Math.min(1, val));
    if (musicGain) musicGain.gain.setTargetAtTime(volMusic, audioCtx?.currentTime || 0, 0.1);
}

const setSfxVolume = (val: number) => {
    volSfx = Math.max(0, Math.min(1, val));
    if (sfxGain) sfxGain.gain.setTargetAtTime(volSfx, audioCtx?.currentTime || 0, 0.1);
}

const playBuffer = (key: string, vol: number = 1.0, loop: boolean = false): boolean => {
    if (isMuted || !audioCtx || !sfxGain || !buffers[key]) return false;

    if (loop) {
        if (currentTrackId === key && bgmSource) {
            return true;
        }
        if (bgmSource) {
             try { bgmSource.stop(); } catch(e) {}
             bgmSource = null;
        }
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

// --- CONTROLES PÚBLICOS ---

export const music = {
  playGame: () => {
    initAudio();
    
    if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }

    // Tenta tocar arquivo MP3
    if (playBuffer('bgm_game', 0.8, true)) return;

    // Fallback Sintetizador
    let beat = 0;
    const playStep = () => {
      if (!audioCtx || !musicGain || isMuted) return;
      
      const t = audioCtx.currentTime;
      
      // Kick
      if (beat % 4 === 0) {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.1);
        g.gain.setValueAtTime(0.6, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(g); g.connect(musicGain!);
        osc.start(); osc.stop(t + 0.1);
      }
      
      // Bass
      const bassFreqs = [55, 55, 41, 41, 48, 48, 36, 36];
      const freq = bassFreqs[Math.floor(beat/4) % bassFreqs.length];
      if (beat % 2 === 0) {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.connect(g); g.connect(musicGain!);
        osc.start(); osc.stop(t + 0.12);
      }

      if (beat % 8 === 4 && cachedNoiseBuffer) {
        const n = audioCtx.createBufferSource();
        n.buffer = cachedNoiseBuffer;
        const ng = audioCtx.createGain();
        ng.gain.setValueAtTime(0.2, t);
        ng.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        n.connect(ng); ng.connect(musicGain!);
        n.start(t, 0, 0.2);
      }
      
      if (beat % 4 === 2) {
        const melody = [440, 523, 659, 783];
        const mFreq = melody[Math.floor(beat/8) % melody.length];
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(mFreq, t);
        osc.frequency.exponentialRampToValueAtTime(mFreq * 0.5, t + 0.2);
        g.gain.setValueAtTime(0.05, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(g); g.connect(musicGain!);
        osc.start(); osc.stop(t + 0.2);
      }

      beat = (beat + 1) % 32;
    };

    bgmInterval = window.setInterval(playStep, 125);
  },
  playMenu: () => {
      initAudio();
      if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }
      playBuffer('bgm_menu', 0.6, true);
  },
  stop: () => {
    if (bgmSource) {
        bgmSource.stop();
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
      if (!playBuffer('shoot', 0.6)) playTone(800, 'square', 0.1, 400, 0.2);
  },
  explosion: () => {
      if (!playBuffer('explosion', 0.7)) playNoise(0.4, 0.5);
  },
  hit: () => {
      if (!playBuffer('hit', 0.8)) playTone(150, 'sawtooth', 0.1, 50, 0.4);
  },
  collect: () => {
    if (!playBuffer('collect', 0.6)) {
        playTone(1200, 'sine', 0.1, 1800, 0.3); 
        setTimeout(() => playTone(1800, 'sine', 0.2, null, 0.3), 50);
    }
  },
  powerup: () => {
    if (!playBuffer('powerup', 0.7)) playTone(400, 'square', 0.1, 800, 0.3);
  },
  gameOver: () => {
      if (!playBuffer('game_over', 1.0)) playTone(300, 'sawtooth', 1.0, 50, 0.5);
  },
  ultimateReady: () => {
    playTone(400, 'sine', 0.1, 800, 0.5);
  },
  ultimateUse: () => {
    if (!playBuffer('ultimate_use', 1.0)) {
        playNoise(1.5, 0.7);
        playTone(100, 'sawtooth', 1.0, 10, 0.8);
    }
  },
  uiClick: () => {
      if (!playBuffer('ui_click', 0.5)) playTone(2000, 'sine', 0.05, 3000, 0.08);
  },
  init: initAudio,
  loadAllSounds: loadAllSounds,
  setVolume: setSfxVolume,
  setMasterVolume: setMasterVolume,
  isPackLoaded: () => packLoaded
};
