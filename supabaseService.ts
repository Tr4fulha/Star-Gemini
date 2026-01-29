import { createClient } from '@supabase/supabase-js';
import { PlayerData, Profile } from './types';

// Credenciais do seu projeto Supabase
const supabaseUrl = 'https://hkjnqyvxzphzkpgnlbwx.supabase.co';
const supabaseAnonKey = 'sb_publishable_M2UL2_lr7c2P7aNtnKjFKA_iwk5r173';

const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

const LOCAL_STORAGE_KEY = 'sg_arcade_save';

// Garante que o usuário está autenticado (Anônimo ou não)
export const ensureAuthenticated = async () => {
  if (!supabase) return null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return session.user;

    // Se não tiver sessão, faz login anônimo
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.warn("Supabase Auth Error:", error.message);
      return null;
    }
    return data.user;
  } catch (err) {
    console.warn("Auth initialization failed", err);
    return null;
  }
};

interface LoadResult {
  data: PlayerData;
  isOnline: boolean;
}

export const getPlayerData = async (): Promise<LoadResult> => {
  // 1. Tentar carregar do Supabase (Online)
  if (supabase) {
    try {
      const user = await ensureAuthenticated();
      
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, scrap, high_score, inventory')
          .eq('id', user.id)
          .single();
        
        // Se o perfil não existe (primeiro login do usuário), cria um
        if (error && error.code === 'PGRST116') {
           const initialData = { id: user.id, username: 'ROOKIE', scrap: 0, high_score: 0, inventory: [] };
           const { error: insertError } = await supabase.from('profiles').insert(initialData);
           
           if (!insertError) {
             return { 
               data: { username: 'ROOKIE', scrap: 0, highScore: 0, inventory: [] },
               isOnline: true
             };
           }
        }

        if (data) {
          return {
            data: {
              username: data.username || `PILOT-${user.id.substring(0,4).toUpperCase()}`,
              scrap: data.scrap || 0,
              highScore: data.high_score || 0,
              inventory: Array.isArray(data.inventory) ? data.inventory : []
            },
            isOnline: true
          };
        }
      }
    } catch (error) {
      console.warn('Erro ao conectar com Supabase, usando LocalStorage...', error);
    }
  }

  // 2. Fallback para LocalStorage (Modo Offline) se Supabase falhar
  try {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData) {
      return { 
        data: JSON.parse(localData),
        isOnline: false
      };
    }
  } catch (error) {
    console.warn('Failed to parse local storage data', error);
  }

  // 3. Novo Jogador Padrão (Sem dados salvos)
  return { 
    data: { username: 'ROOKIE', scrap: 0, highScore: 0, inventory: [] },
    isOnline: false
  };
};

export const savePlayerData = async (data: PlayerData) => {
  // Salva localmente primeiro para garantir a UI instantânea
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to local storage', error);
  }

  // Sincroniza com Supabase se estiver conectado
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        await supabase.from('profiles').upsert({
          id: session.user.id,
          username: data.username,
          scrap: data.scrap,
          high_score: data.highScore,
          inventory: data.inventory
        });
      }
    } catch (error) {
      // Falha silenciosa no save remoto para não travar o jogo
      console.warn('Failed to sync with Supabase', error);
    }
  }
};

export const getLeaderboard = async (): Promise<Profile[]> => {
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, high_score, scrap')
      .order('high_score', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.warn("Failed to fetch leaderboard", error);
    return [];
  }
};