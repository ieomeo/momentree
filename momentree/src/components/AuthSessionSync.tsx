import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

// Existing pages share the server-confirmed ['me'] query, not the raw SDK user.
export default function AuthSessionSync() {
  const qc = useQueryClient();
  useEffect(() => {
    if (!supabase) return;
    let previous: string | null | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const id = session?.user.id ?? null;
      if (previous === undefined) { previous = id; return; }
      if (id === previous) return;
      previous = id;
      clearTimeout(timer);
      timer = setTimeout(() => {
        // Reset active queries as well, so pending data from the previous account is discarded.
        void qc.resetQueries();
      }, 0);
    });
    return () => { clearTimeout(timer); subscription.unsubscribe(); };
  }, [qc]);
  return null;
}
