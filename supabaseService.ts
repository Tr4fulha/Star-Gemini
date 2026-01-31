import { createClient } from '@supabase/supabase-js';
import { PlayerData, Profile, HUDSettings, AudioSettings, DailyScore } from './types';

// Configuração do Supabase
// NOTA: Em produção, utilize variáveis de ambiente (process.env.VITE_SUPABASE_URL)
const supabaseUrl = 'https://hkjnqyvxzphzkpgnlbwx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhram5xeXZ4enBoemtwZ25sYnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDI1MzEsImV4cCI6MjA4NTI3ODUzMX0.I3xJx2oiEaOGh45xJZmPXKVAipL7v9GvCJdIhJC8bXo';

const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      db: {
        schema: 'public'
      }
    }) 
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

// Função auxiliar para timeout
const withTimeout = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
    ]);
};

export const ensureAuthenticated = async () => {
  if (!supabase) return null;
  try {
    // Cast to any to bypass type checks if definition is outdated
    const { data: { session } } = await (supabase.auth as any).getSession();
    if (session?.user) return session.user;

    // Tenta login anônimo com timeout curto para não travar o jogo
    const { data, error } = await withTimeout(
        (supabase.auth as any).signInAnonymously(),
        3000, 
        { data: null, error: { message: 'Timeout' } as any }
    );
    
    if (error) throw error;
    return data?.user ?? null;
  } catch (err) {
    console.warn("Offline mode active: Auth skipped", err);
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
    tutorialCompleted: false,
    language: 'pt',
    hudSettings: DEFAULT_HUD,
    audioSettings: DEFAULT_AUDIO,
    modules: { inventory: [], equipped: {} },
    shipMastery: {}
  };

  // 1. Carregar do LocalStorage (Instantâneo)
  let localData = defaultData;
  try {
    const localString = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localString) {
      const parsed = JSON.parse(localString);
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

  // 2. Se não tiver configuração ou internet, retorna local
  if (!supabase || !navigator.onLine) {
      return { data: localData, isOnline: false };
  }

  // 3. Tentar sincronizar com a nuvem (com Timeout)
  try {
      const user = await ensureAuthenticated();
      if (!user) return { data: localData, isOnline: false };

      // Promise de busca de dados
      const fetchProfile = async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('*') 
            .eq('id', user.id)
            .single();

          if (error && error.code === 'PGRST116') {
             // Usuário novo, cria perfil
             const initialData = { 
               id: user.id, 
               username: localData.username !== 'ROOKIE' ? localData.username : `PILOT-${user.id.substring(0,4).toUpperCase()}`,
               scrap: localData.scrap, 
               high_score: localData.highScore,
               inventory: localData.inventory,
               hud_settings: localData.hudSettings,
               audio_settings: localData.audioSettings
             };
             await supabase.from('profiles').insert(initialData);
             return { ...defaultData, ...initialData };
          }
          return data;
      };

      // Timeout de 3 segundos para a rede. Se falhar, usa dados locais.
      const cloudData = await withTimeout(fetchProfile(), 3000, null);

      if (cloudData) {
          // Merge Inteligente (Cloud vence, mas mantém progresso local se for maior)
          const mergedData: PlayerData = {
              username: cloudData.username || localData.username,
              scrap: Math.max(cloudData.scrap || 0, localData.scrap), 
              darkMatter: cloudData.dark_matter || 0,
              highScore: Math.max(cloudData.high_score || 0, localData.highScore),
              inventory: (cloudData.inventory?.length > localData.inventory.length) ? cloudData.inventory : localData.inventory,
              level: Math.max(cloudData.level || 1, localData.level),
              currentXp: cloudData.current_xp || 0,
              maxWave: Math.max(cloudData.max_wave || 0, localData.maxWave),
              lastSeenVersion: cloudData.last_seen_version || '0.0.0',
              tutorialCompleted: cloudData.tutorial_completed ?? localData.tutorialCompleted,
              language: cloudData.language || 'pt',
              hudSettings: { ...DEFAULT_HUD, ...(cloudData.hud_settings || {}) },
              audioSettings: { ...DEFAULT_AUDIO, ...(cloudData.audio_settings || {}) },
              modules: cloudData.modules || { inventory: [], equipped: {} },
              shipMastery: cloudData.ship_mastery || {}
          };
          
          // Atualiza cache local
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedData));
          return { data: mergedData, isOnline: true };
      }
  } catch (error) {
      console.warn('Network sync skipped:', error);
  }

  return { data: localData, isOnline: false };
};

export const savePlayerData = async (data: PlayerData) => {
  // 1. Salva Localmente Sempre
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Erro LocalStorage save', error);
  }

  // 2. Salva na Nuvem (Fire and Forget)
  if (supabase && navigator.onLine) {
    ensureAuthenticated().then(user => {
        if (user) {
            // Removido 'updated_at' para evitar erros de schema se a coluna não existir
            supabase.from('profiles').upsert({
              id: user.id,
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
              hud_settings: data.hudSettings as any,
              audio_settings: data.audioSettings as any,
              modules: data.modules as any,
              ship_mastery: data.shipMastery as any
            }).then(({ error }) => {
                if (error) console.warn("Cloud save failed:", error.message);
            });
        }
    });
  }
};

export const getLeaderboard = async (): Promise<Profile[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, high_score, scrap, level, ship_mastery')
      .order('high_score', { ascending: false })
      .limit(10);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
};

export const submitDailyScore = async (score: number, wave: number, shipId: string) => {
    if (!supabase) return;
    try {
        const user = await ensureAuthenticated();
        if (!user) return;

        const today = new Date().toISOString().slice(0, 10);
        
        // Verifica se já tem score melhor hoje
        const { data: existing } = await supabase
            .from('daily_scores')
            .select('score')
            .eq('user_id', user.id)
            .eq('date', today)
            .single();

        if (existing && existing.score >= score) return;

        const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
        
        await supabase.from('daily_scores').upsert({
            user_id: user.id,
            date: today,
            username: profile?.username || 'UNKNOWN',
            score: score,
            wave: wave,
            ship_id: shipId
        }, { onConflict: 'user_id, date' });

    } catch (e) {
        console.warn("Daily score error", e);
    }
};

export const getDailyLeaderboard = async (): Promise<DailyScore[]> => {
    if (!supabase) return [];
    try {
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
        return [];
    }
};