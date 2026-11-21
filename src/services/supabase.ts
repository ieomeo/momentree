import { createClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim();
export const supabase = url && key && !url.includes('your-project') && !key.includes('replace_with')
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'pkce' } })
  : null;

export function requireSupabase() {
  if (!supabase) throw new Error('Supabase 환경변수를 설정한 뒤 Vite를 다시 시작해주세요.');
  return supabase;
}

// SDK supports custom:* at runtime; older Provider declarations omit custom slugs.
export const naver = 'custom:naver' as Parameters<NonNullable<typeof supabase>['auth']['signInWithOAuth']>[0]['provider'];
export const callbackUrl = () => `${window.location.origin}/auth/callback`;
