
import { createClient } from '@supabase/supabase-js';
import { PlayerData, Profile, HUDSettings, AudioSettings, DailyScore } from './types';

// ATENÇÃO: Substitua pelas suas chaves REAIS do Supabase se mudar o projeto
const supabaseUrl = 'https://hkjnqyvxzphzkpgnlbwx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhram5xeXZ4enBoemtwZ25sYnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDI1MzEsImV4cCI6MjA4NTI3ODUzMX0.I3xJx2oiEaOGh45xJZmPXKVAipL7v9GvCJdIhJC8bXo';

const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

const LOCAL_STORAGE_KEY = 'sg_arcade_save';

const DEFAULT_HUD: HUDSettings = {
  opacity: 0.7,
  scale: 1.0,
  leftHanded: false,
  joystickPos: { x: 15, y: 75 },
  skillBtnPos: { x: 85, y: 75 }
};

const DEFAULT_AUDIO: AudioSettings = {
  masterVolume: 0.5,
  musicVolume: 0.5,
  sfxVolume: 0.5
};

export const ensureAuthenticated = async () => {
  if (!supabase) return null;
  try {
    // Tenta recuperar sessão existente
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    if (session?.user) return session.user;

    // Se não houver sessão, faz login anônimo
    const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
    if (anonError) throw anonError;
    return anonData.user;
  } catch (err) {
    console.warn("Offline mode: Auth unavailable", err);
    return null;
  }
};

interface LoadResult {
  data: PlayerData;
  isOnline: boolean;
}

export const getPlayerData = async (): Promise<LoadResult> => {
  const defaultData: PlayerData = { 
    username: 'ROOKIE', 
    scrap: 0, 
    darkMatter: 0,
    highScore: 0, 
    inventory: [],
    level: 1,
    currentXp: 0,
    maxWave: 0,
    lastSeenVersion: '0.0.0',
    tutorialCompleted: false, // Default
    language: 'pt',
    hudSettings: DEFAULT_HUD,
    audioSettings: DEFAULT_AUDIO,
    modules: { inventory: [], equipped: {} },
    shipMastery: {}
  };

  // 1. Tentar carregar do LocalStorage primeiro (para resposta instantânea)
  let localData = defaultData;
  try {
    const localString = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localString) {
      const parsed = JSON.parse(localString);
      // Mesclar com defaults para garantir que novos campos existam
      localData = { 
          ...defaultData, 
          ...parsed,
          hudSettings: { ...DEFAULT_HUD, ...(parsed.hudSettings || {}) },
          audioSettings: { ...DEFAULT_AUDIO, ...(parsed.audioSettings || {}) },
          modules: { inventory: [], equipped: {}, ...(parsed.modules || {}) },
          shipMastery: { ...(parsed.shipMastery || {}) },
          tutorialCompleted: parsed.tutorialCompleted ?? false
      };
    }
  } catch (e) {
    console.warn('Erro LocalStorage:', e);
  }

  // 2. Se tiver Supabase, tentar sincronizar
  if (supabase) {
    try {
      const user = await ensureAuthenticated();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*') 
          .eq('id', user.id)
          .single();
        
        // Se usuário existe mas não tem perfil, cria um
        if (error && error.code === 'PGRST116') {
           const initialData = { 
             id: user.id, 
             username: localData.username !== 'ROOKIE' ? localData.username : `PILOT-${user.id.substring(0,4).toUpperCase()}`,
             scrap: localData.scrap, // Preserva scrap local se existir
             dark_matter: 0,
             high_score: localData.highScore,
             inventory: localData.inventory,
             level: 1,
             current_xp: 0,
             max_wave: 0,
             language: 'pt',
             last_seen_version: '0.0.0',
             tutorial_completed: localData.tutorialCompleted,
             hud_settings: DEFAULT_HUD,
             audio_settings: DEFAULT_AUDIO,
             modules: { inventory: [], equipped: {} },
             ship_mastery: {}
           };
           await supabase.from('profiles').insert(initialData);
           return { data: { ...defaultData, ...initialData, ...localData }, isOnline: true };
        }

        if (data) {
          // Merge Cloud Data > Local Data
          const mergedData: PlayerData = {
              username: data.username || localData.username,
              scrap: Math.max(data.scrap || 0, localData.scrap), 
              darkMatter: data.dark_matter || 0,
              highScore: Math.max(data.high_score || 0, localData.highScore),
              inventory: (data.inventory?.length > localData.inventory.length) ? data.inventory : localData.inventory,
              level: Math.max(data.level || 1, localData.level),
              currentXp: data.current_xp || 0,
              maxWave: Math.max(data.max_wave || 0, localData.maxWave),
              lastSeenVersion: data.last_seen_version || '0.0.0',
              tutorialCompleted: data.tutorial_completed ?? false,
              language: data.language || 'pt',
              hudSettings: { ...DEFAULT_HUD, ...(data.hud_settings || {}) },
              audioSettings: { ...DEFAULT_AUDIO, ...(data.audio_settings || {}) },
              modules: data.modules || { inventory: [], equipped: {} },
              shipMastery: data.ship_mastery || {}
          };
          
          // Salva de volta no local storage para manter sync
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedData));
          
          return { data: mergedData, isOnline: true };
        }
      }
    } catch (error) {
      console.warn('Usando save local devido a erro de rede:', error);
    }
  }

  // Fallback: Retorna dados locais
  return { data: localData, isOnline: false };
};

export const savePlayerData = async (data: PlayerData) => {
  // 1. Salva Localmente Sempre
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Erro no LocalStorage save', error);
  }

  // 2. Salva na Nuvem se possível
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        // Converter estruturas complexas para JSON puro para o Supabase
        await supabase.from('profiles').upsert({
          id: session.user.id,
          username: data.username,
          scrap: data.scrap,
          dark_matter: data.darkMatter,
          high_score: data.highScore,
          inventory: data.inventory,
          level: data.level,
          current_xp: data.currentXp,
          max_wave: data.maxWave,
          language: data.language,
          last_seen_version: data.lastSeenVersion,
          tutorial_completed: data.tutorialCompleted,
          // Casting explícito para garantir formato JSONB
          hud_settings: data.hudSettings as any,
          audio_settings: data.audioSettings as any,
          modules: data.modules as any,
          ship_mastery: data.shipMastery as any,
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.warn('Save na nuvem pendente (offline)', error);
    }
  }
};

export const getLeaderboard = async (): Promise<Profile[]> => {
  if (!supabase) return [];
  try {
    // Garantir que estamos autenticados para passar pelas regras de RLS
    await ensureAuthenticated();

    // Timeout mais relaxado (5s)
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000));
    
    const query = supabase
      .from('profiles')
      .select('id, username, high_score, scrap, level, ship_mastery')
      .order('high_score', { ascending: false })
      .limit(10);
      
    const { data, error } = await Promise.race([query, timeout]) as any;
    
    if (error) {
        console.error("Supabase Error:", error);
        throw error;
    }
    return data || [];
  } catch (error) {
    console.warn("Leaderboard offline or unreachable:", error); 
    return [];
  }
};

// --- DAILY OPS ---

export const submitDailyScore = async (score: number, wave: number, shipId: string) => {
    if (!supabase) return;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        // Formato YYYY-MM-DD
        const today = new Date().toISOString().slice(0, 10);

        // Busca score atual do dia
        const { data: existing } = await supabase
            .from('daily_scores')
            .select('score')
            .eq('user_id', session.user.id)
            .eq('date', today)
            .single();

        if (existing && existing.score >= score) {
            return; // Score atual é menor ou igual ao já salvo
        }

        const { data: profile } = await supabase.from('profiles').select('username').eq('id', session.user.id).single();
        
        await supabase.from('daily_scores').upsert({
            user_id: session.user.id,
            date: today,
            username: profile?.username || 'PILOT',
            score: score,
            wave: wave,
            ship_id: shipId
        }, { onConflict: 'user_id, date' });

    } catch (e) {
        console.warn("Daily score submission failed", e);
    }
};

export const getDailyLeaderboard = async (): Promise<DailyScore[]> => {
    if (!supabase) return [];
    try {
        await ensureAuthenticated();
        
        const today = new Date().toISOString().slice(0, 10);
        const { data, error } = await supabase
            .from('daily_scores')
            .select('*')
            .eq('date', today)
            .order('score', { ascending: false })
            .limit(10);

        if (error) throw error;
        return data || [];
    } catch (e) {
        console.warn("Daily Leaderboard unavailable:", e);
        return [];
    }
};
