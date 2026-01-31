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

// Sistema de Diagnóstico
export interface AudioStatus {
    key: string;
    url: string;
    status: 'pending' | 'loaded' | 'error' | 'fallback';
    errorMsg?: string;
    size?: number;
}
const debugStatus: Record<string, AudioStatus> = {};

// Mapa de Arquivos - Caminhos base
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

// Inicializa o status de debug
Object.keys(SOUND_FILES).forEach(key => {
    // Exibe o caminho padrão para referência
    debugStatus[key] = { key, url: `sounds/${SOUND_FILES[key as keyof typeof SOUND_FILES]}`, status: 'pending' };
});

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

            // Criar buffer de ruído branco para explosões
            const bufferSize = audioCtx.sampleRate * 2.0; 
            cachedNoiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = cachedNoiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            console.log("[Audio] System Initialized");
        }
    } catch (e) {
        console.warn("[Audio] Context init failed", e);
    }
  }
};

export const resumeAudio = () => {
    if (!audioCtx) initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(e => console.error("Resume failed:", e));
    }
};

// Tenta fazer fetch de múltiplos caminhos até achar o arquivo
const fetchWithRetry = async (filename: string): Promise<ArrayBuffer> => {
    const pathsToTry = [
        `sounds/${filename}`,          // Relativo simples
        `/sounds/${filename}`,         // Raiz
        `public/sounds/${filename}`,   // Caminho físico (para alguns servidores dev)
        `./sounds/${filename}`         // Relativo explícito
    ];

    let lastError;

    for (const path of pathsToTry) {
        try {
            const cacheBuster = `?t=${Date.now()}`;
            const response = await fetch(path + cacheBuster);
            
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('text/html')) {
                    // Ignora, é provavelmente uma página 404 personalizada
                    continue;
                }
                const buffer = await response.arrayBuffer();
                if (buffer.byteLength < 1000) {
                     // Provável erro de LFS ou arquivo vazio
                     throw new Error('Arquivo muito pequeno');
                }
                return buffer; // Sucesso!
            }
        } catch (e) {
            lastError = e;
        }
    }
    throw new Error(`Falha ao carregar ${filename} após tentar múltiplos caminhos.`);
};

const loadSound = async (key: string, filename: string) => {
    if (!audioCtx) initAudio();
    
    // Atualiza status
    debugStatus[key].status = 'pending';

    try {
        const arrayBuffer = await fetchWithRetry(filename);
        debugStatus[key].size = arrayBuffer.byteLength;
        
        if (!audioCtx) throw new Error("AudioContext não iniciado");

        try {
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            buffers[key] = audioBuffer;
            debugStatus[key].status = 'loaded';
            debugStatus[key].url = `(OK) ${filename}`; // Atualiza UI para mostrar sucesso
        } catch (decodeError) {
            throw new Error(`Falha na decodificação (Arquivo corrompido?)`);
        }

    } catch (error: any) {
        console.warn(`[Audio] Erro final em ${key}:`, error.message);
        debugStatus[key].status = 'error';
        debugStatus[key].errorMsg = error.message;
    }
};

export const loadAllSounds = async () => {
    console.log("[Audio] Iniciando download de assets...");
    const promises = Object.entries(SOUND_FILES).map(([key, filename]) => loadSound(key, filename));
    await Promise.allSettled(promises);
    
    const loadedCount = Object.keys(buffers).length;
    const totalCount = Object.keys(SOUND_FILES).length;
    
    packLoaded = loadedCount > 0;
    console.log(`[Audio] Carregamento finalizado. ${loadedCount}/${totalCount} arquivos OK.`);
};

// --- CONTROLES DE VOLUME ---
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

// --- PLAYBACK ---
const playBuffer = (key: string, vol: number = 1.0, loop: boolean = false): boolean => {
    if (isMuted || !audioCtx || !buffers[key]) return false;

    // Se é música e já está tocando a mesma, ignora
    if (loop && currentTrackId === key && bgmSource) return true;
    
    // Se é música nova, para a anterior
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
        // Roteia para o canal certo
        if (loop && musicGain) gain.connect(musicGain);
        else if (sfxGain) gain.connect(sfxGain);
        
        source.start();
        
        if (loop) {
            bgmSource = source;
            currentTrackId = key;
        }
        return true;
    } catch (e) {
        console.error(`[Audio] Erro ao tocar ${key}`, e);
        return false;
    }
};

// --- SINTETIZADORES (FALLBACK) ---
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
  } catch (e) {}
};

const playNoise = (duration: number, vol: number = 0.5) => {
    if (isMuted || !audioCtx || !sfxGain || !cachedNoiseBuffer) return;
    try {
        const noise = audioCtx.createBufferSource();
        noise.buffer = cachedNoiseBuffer;
        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(vol, audioCtx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(sfxGain);
        noise.start();
    } catch (e) {}
};

// --- API PÚBLICA ---

export const getDebugStatus = () => debugStatus;

// Função específica para testar som no menu de opções (força tocar mesmo se falhar)
export const playTestSound = (key: string) => {
    initAudio();
    resumeAudio();
    
    // Tenta tocar o arquivo MP3 carregado
    const played = playBuffer(key, 1.0, false);
    
    // Se falhar, toca o synth correspondente para confirmar que o áudio funciona
    if (!played) {
        console.log(`[Audio] Teste ${key}: Arquivo não disponível, tocando Synth.`);
        if (key === 'shoot') playTone(800, 'square', 0.1, 200, 0.1);
        else if (key === 'explosion') playNoise(0.4, 0.5);
        else if (key === 'ui_click') playTone(1000, 'sine', 0.05, 1500, 0.1);
        else playTone(440, 'sine', 0.1); // Som genérico
    } else {
        console.log(`[Audio] Teste ${key}: Tocando arquivo MP3.`);
    }
};

export const music = {
  playGame: () => {
    initAudio();
    if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }

    // Prioridade: Arquivo MP3
    if (playBuffer('bgm_game', 0.8, true)) return;

    // Fallback: Synth Music
    let beat = 0;
    bgmInterval = window.setInterval(() => {
      if (!audioCtx || !musicGain || isMuted || audioCtx.state !== 'running') return;
      const t = audioCtx.currentTime;
      
      // Kick simplificado
      if (beat % 4 === 0) playTone(150, 'sine', 0.1, 50, 0.7);
      
      // Bassline Cyberpunk simples
      const notes = [55, 55, 65, 55];
      if (beat % 2 === 0) {
          playTone(notes[Math.floor(beat/4)%4], 'sawtooth', 0.15, null, 0.3);
      }
      beat = (beat + 1) % 32;
    }, 120); 
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
  setVolume: setMusicVolume
};

export const sfx = {
  shoot: () => { if (!playBuffer('shoot', 0.4)) playTone(800, 'square', 0.1, 200, 0.1); },
  explosion: () => { if (!playBuffer('explosion', 0.6)) playNoise(0.4, 0.5); },
  hit: () => { if (!playBuffer('hit', 0.8)) playTone(150, 'sawtooth', 0.2, 50, 0.4); },
  collect: () => { if (!playBuffer('collect', 0.6)) playTone(1500, 'sine', 0.1, 2000, 0.2); },
  powerup: () => { 
      if (!playBuffer('powerup', 0.7)) {
        playTone(440, 'square', 0.1, 440, 0.2);
        setTimeout(() => playTone(880, 'square', 0.2, 880, 0.2), 100);
      }
  },
  gameOver: () => { if (!playBuffer('game_over', 1.0)) playTone(300, 'sawtooth', 0.5, 200, 0.5); },
  ultimateUse: () => { 
      if (!playBuffer('ultimate_use', 0.8)) {
        playTone(100, 'sawtooth', 0.5, 800, 0.4); 
        setTimeout(() => playNoise(1.5, 0.7), 500); 
      }
  },
  uiClick: () => { if (!playBuffer('ui_click', 0.5)) playTone(1000, 'sine', 0.05, 1500, 0.1); },
  
  init: initAudio,
  resume: resumeAudio,
  loadAllSounds: loadAllSounds,
  setVolume: setSfxVolume,
  setMasterVolume: setMasterVolume,
  isPackLoaded: () => packLoaded,
  // Exporta função de teste
  playTest: playTestSound
};