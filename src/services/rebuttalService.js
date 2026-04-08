import { supabase } from '../lib/supabase';
import localLibrary from '../data/rebuttals.json'; // Your existing local file

export const fetchSmartRebuttal = async (detectedObjection) => {
  // 1. Attempt to fetch from Supabase first
  try {
    const { data, error } = await supabase
      .from('fixetta_rebuttals')
      .select('strategy, script')
      .eq('objection_type', detectedObjection);

    if (data && data.length > 0) {
      // Return a random script from the matched category to keep it natural
      const randomIndex = Math.floor(Math.random() * data.length);
      return data[randomIndex];
    }
  } catch (err) {
    console.warn("Supabase fetch failed, defaulting to local JSON.");
  }

  // 2. Fallback to local JSON if DB is empty or fails
  const fallback = localLibrary.rebuttals.find(r => r.objection_type === detectedObjection);
  return fallback ? { strategy: fallback.strategy, script: fallback.scripts[0] } : null;
};