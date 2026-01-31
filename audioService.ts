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

        // Criar buffer de ruído branco para explosões
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
};

// Função crucial para desbloquear áudio em navegadores (Chrome/Safari)
export const resumeAudio = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
            console.log("AudioContext resumed by user interaction");
        });
    } else if (!audioCtx) {
        initAudio();
    }
};

const loadSound = async (key: string, url: string) => {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const contentType = response.headers.get('content-type');
        // Se for texto, é provavelmente um ponteiro do Git LFS ou erro 404 HTML
        if (contentType && (contentType.includes('text/html') || contentType.includes('text/plain'))) {
             throw new Error(`Arquivo inválido (Text/HTML detectado)`);
        }

        const arrayBuffer = await response.arrayBuffer();

        // Verificação LFS: Arquivos < 2KB que são MP3 geralmente são ponteiros quebrados
        if (arrayBuffer.byteLength < 2048) {
             throw new Error(`Arquivo muito pequeno (${arrayBuffer.byteLength} bytes) - provável ponteiro Git LFS.`);
        }
        
        try {
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            buffers[key] = audioBuffer;
        } catch (decodeError) {
            // Falha na decodificação
        }

    } catch (error) {
        // Falha silenciosa: O sistema usará o sintetizador automaticamente
    }
};

export const loadAllSounds = async () => {
    const promises = Object.entries(SOUND_FILES).map(([key, url]) => loadSound(key, url));
    await Promise.allSettled(promises);
    
    const loadedCount = Object.keys(buffers).length;
    const totalCount = Object.keys(SOUND_FILES).length;
    
    if (loadedCount > totalCount / 2) {
        packLoaded = true;
        console.log(`[Audio] Modo HQ Ativo (${loadedCount}/${totalCount})`);
    } else {
        console.log(`[Audio] Modo Synth Arcade Ativo (Fallback)`);
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

    // Se já estiver tocando música, não reinicia
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

// --- SINTETIZADORES ARCADE (FALLBACK) ---
// Gera sons "Pew Pew" estilo 8-bit se o MP3 falhar

const playTone = (freq: number, type: OscillatorType, duration: number, slideTo: number | null = null, vol: number = 0.5) => {
  if (isMuted || !audioCtx || !sfxGain) return;

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
    if (isMuted || !audioCtx || !sfxGain || !cachedNoiseBuffer) return;

    const noise = audioCtx.createBufferSource();
    noise.buffer = cachedNoiseBuffer;

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(vol, audioCtx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    // Filtro para deixar o ruído mais grave (explosão)
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    noise.connect(filter);
    filter.connect(noiseGain);
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

    // Fallback: Gerador Procedural de Música (Dark Synthwave)
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
      
      // Bass (Baixo Arpeggiado)
      const bassNotes = [55, 55, 65, 55, 49, 49, 41, 41]; // Sequência Cyberpunk
      const freq = bassNotes[Math.floor(beat/4) % bassNotes.length];
      if (beat % 2 === 0) {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        // Filtro Lowpass para o baixo
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, t);
        filter.frequency.linearRampToValueAtTime(100, t + 0.1);

        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        
        osc.connect(filter); filter.connect(g); g.connect(musicGain!);
        osc.start(); osc.stop(t + 0.15);
      }

      beat = (beat + 1) % 32;
    };

    bgmInterval = window.setInterval(playStep, 120); // 125 BPM
  },
  playMenu: () => {
      initAudio();
      if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }
      // Tenta MP3, se falhar, silêncio no menu é aceitável ou poderia ter um drone
      playBuffer('bgm_menu', 0.6, true);
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
      // Som de Laser "Pew"
      if (!playBuffer('shoot', 0.5)) playTone(1200, 'square', 0.1, 300, 0.15);
  },
  explosion: () => {
      // Som de Explosão (Ruído Branco)
      if (!playBuffer('explosion', 0.6)) playNoise(0.4, 0.5);
  },
  hit: () => {
      // Dano (Sawtooth grave)
      if (!playBuffer('hit', 0.8)) playTone(150, 'sawtooth', 0.2, 50, 0.4);
  },
  collect: () => {
    // Coleta (Ping agudo e rápido)
    if (!playBuffer('collect', 0.6)) playTone(1500, 'sine', 0.1, 2000, 0.2); 
  },
  powerup: () => {
    // Powerup (Subida harmônica)
    if (!playBuffer('powerup', 0.7)) {
        playTone(440, 'square', 0.1, 440, 0.2);
        setTimeout(() => playTone(880, 'square', 0.2, 880, 0.2), 100);
    }
  },
  gameOver: () => {
      if (!playBuffer('game_over', 1.0)) {
          playTone(300, 'sawtooth', 0.5, 200, 0.5);
          setTimeout(() => playTone(200, 'sawtooth', 1.0, 50, 0.5), 500);
      }
  },
  ultimateReady: () => {
    playTone(600, 'sine', 0.2, 1200, 0.3);
  },
  ultimateUse: () => {
    // Som de Ultimate (Carregamento + Explosão)
    if (!playBuffer('ultimate_use', 0.8)) {
        playTone(100, 'sawtooth', 0.5, 800, 0.4); // Charge
        setTimeout(() => playNoise(1.5, 0.7), 500); // Blast
    }
  },
  uiClick: () => {
      if (!playBuffer('ui_click', 0.5)) playTone(800, 'sine', 0.05, undefined, 0.1);
  },
  init: initAudio,
  resume: resumeAudio,
  loadAllSounds: loadAllSounds,
  setVolume: setSfxVolume,
  setMasterVolume: setMasterVolume,
  isPackLoaded: () => packLoaded
};