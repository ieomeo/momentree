import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { requireSupabase } from '../services/supabase';
import { authAPI, ProfilePendingError } from '../services/api';
import { errorMessage } from '../services/format';

async function exchange() {
  const url = new URL(window.location.href);
  const intent = sessionStorage.getItem('momentree-auth-intent');
  sessionStorage.removeItem('momentree-auth-intent');
  const params = [url.searchParams, new URLSearchParams(url.hash.slice(1))];
  const code = url.searchParams.get('code');
  window.history.replaceState(window.history.state, '', url.pathname);
  if (params.some((p) => p.has('error') || p.has('error_code') || p.has('error_description'))) {
    throw new Error('인증이 취소되었거나 실패했어요. 다시 시도해주세요.');
  }
  if (!code) throw new Error('인증 코드를 찾을 수 없어요. 다시 시도해주세요.');
  const { data, error } = await requireSupabase().auth.exchangeCodeForSession(code);
  if (error || !data.session) throw new Error('인증 코드를 확인하지 못했어요. 같은 브라우저에서 다시 시작해주세요.');
  try {
    const user = await authAPI.me();
    if (!user) throw new Error('사용자 정보를 확인하지 못했어요.');
    return { route: user.role === 'admin' ? '/admin' : '/feed', user };
  } catch (error) {
    if (error instanceof ProfilePendingError) return { route: '/signup?complete=1', user: null };
    if (intent !== 'link') await authAPI.logout().catch(() => undefined);
    throw error;
  }
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const exchangeOnce = useRef<ReturnType<typeof exchange> | null>(null);
  useEffect(() => {
    let active = true;
    exchangeOnce.current ??= exchange();
    void exchangeOnce.current.then(({ route, user }) => {
      if (!active) return;
      qc.clear();
      qc.setQueryData(['me'], user);
      navigate(route, { replace: true });
    }).catch((error: unknown) => {
      if (!active) return;
      toast.error(errorMessage(error));
      navigate('/login', { replace: true });
    });
    return () => { active = false; };
  }, [navigate, qc]);
  return <p role="status">인증 결과를 확인하고 있어요…</p>;
}
