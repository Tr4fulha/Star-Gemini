import { createClient } from '@supabase/supabase-js';
import { PlayerData } from './types';

// Safely retrieve environment variables to prevent runtime crashes
// if import.meta.env is not defined in the current environment.
const getEnv = (key: string) => {
  const meta = import.meta as any;
  if (meta && meta.env && meta.env[key]) {
    return meta.env[key];
  }
  return '';
};

// NOTE: These should be in your .env file
// If not present, the app falls back to local storage mode
const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Mock local storage key
const LOCAL_STORAGE_KEY = 'sg_arcade_save';

export const getPlayerData = async (): Promise<PlayerData> => {
  // 1. Try Supabase
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('scrap, high_score, inventory')
          .eq('id', user.id)
          .single();
        
        if (data && !error) {
          return {
            scrap: data.scrap || 0,
            highScore: data.high_score || 0,
            inventory: Array.isArray(data.inventory) ? data.inventory : []
          };
        }
      }
    } catch (error) {
      console.warn('Failed to fetch from Supabase, falling back to local storage', error);
    }
  }

  // 2. Fallback to LocalStorage
  try {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (localData) {
      return JSON.parse(localData);
    }
  } catch (error) {
    console.warn('Failed to parse local storage data', error);
  }

  // 3. Default new player
  return { scrap: 0, highScore: 0, inventory: [] };
};

export const savePlayerData = async (data: PlayerData) => {
  // Save locally first for instant feedback
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to local storage', error);
  }

  // Sync with Supabase if available
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          scrap: data.scrap,
          high_score: data.highScore,
          inventory: data.inventory
        });
      }
    } catch (error) {
      console.warn('Failed to sync with Supabase', error);
    }
  }
};