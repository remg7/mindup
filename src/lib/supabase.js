import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.trim() !== '' && supabaseAnonKey.trim() !== '');
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Carga las entradas del Diario Mental desde Supabase
 */
export async function fetchJournalEntries() {
  if (!isSupabaseConfigured()) {
    return null; // Fallback a estado local
  }

  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching journal entries from Supabase:', error.message);
      return null;
    }

    return data.map(entry => ({
      id: entry.id,
      title: entry.title,
      content: entry.content,
      time: new Date(entry.created_at).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));
  } catch (err) {
    console.warn('Supabase fetch error:', err);
    return null;
  }
}

/**
 * Guarda una nueva entrada del Diario Mental en Supabase
 */
export async function saveJournalEntry(entry) {
  if (!isSupabaseConfigured()) {
    return null; // Fallback a estado local
  }

  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert([
        {
          title: entry.title,
          content: entry.content
        }
      ])
      .select();

    if (error) {
      console.error('Error saving journal entry to Supabase:', error.message);
      return null;
    }

    return data[0];
  } catch (err) {
    console.error('Supabase save error:', err);
    return null;
  }
}

/**
 * Registra o guarda un cambio de estado de ánimo en Supabase
 */
export async function saveMoodLog(moodKey) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('mood_logs')
      .insert([{ mood_key: moodKey }])
      .select();

    if (error) {
      console.warn('Error logging mood to Supabase:', error.message);
      return null;
    }

    return data[0];
  } catch (err) {
    console.warn('Supabase mood save error:', err);
    return null;
  }
}
