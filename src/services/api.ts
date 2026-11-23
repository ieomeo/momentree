import { callbackUrl, naver, requireSupabase, supabase } from './supabase';
import type {
  AppNotification, BlockedEmail, Category, Comment, CrisisAlert, IdentityAccessLog, IdentityInput, IdentityView,
  LeafLog, MemberSummary, PostView, ProcessStatus, Report, ReportAction, User,
} from '../types';
import { localDateKey } from './format';

// ───────────────────────────────────────────────────────────────────────────────
// 모먼트리 API 클라이언트
// 예전에는 이 파일이 브라우저 LocalStorage에 데이터를 저장했지만, 이제는 Express 서버(+ Supabase DB)에
// 요청만 보냅니다. 화면 코드가 쓰는 함수 이름과 모양은 그대로예요.
// ───────────────────────────────────────────────────────────────────────────────

// 서비스 규칙 (서버와 같은 값. 화면에 안내 문구를 보여줄 때 써요)
export const DAILY_CAP = 20;
export const SUBSCRIBE_COST = 10;
export const WITHDRAW_BLOCK_DAYS = 30;
export const NICKNAME_MAX = 12;
export const LIKES_WINDOW_HOURS = 24;
export const NOTE_MAX = 300;
export const CODE_TTL_MINUTES = 5;
export const CODE_RESEND_SECONDS = 30;

const API_BASE = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000').replace(/\/+$/, '');
async function getToken() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.access_token ?? null;
}

// 서버의 기능 하나를 부르는 공통 함수: POST /api/rpc/기능이름
async function rpc<T>(name: string, ...args: unknown[]): Promise<T> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/rpc/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ args }),
    });
  } catch {
    throw new Error('서버에 연결할 수 없어요. 인터넷을 확인하거나, 서버가 깨어나는 중이면 1분쯤 뒤 다시 시도해주세요.');
  }
  const body = (await res.json().catch(() => null)) as { data?: T; error?: { message?: string } } | null;
  if (!res.ok) {
    throw new Error(body?.error?.message ?? '요청에 실패했어요. 잠시 뒤 다시 시도해주세요.');
  }
  return body?.data as T;
}

// 총괄 운영자인지: 서버가 계산해서 알려줘요.
export const isSuperAdmin = (user: User): boolean => user.isSuperAdmin === true;

// ---------- 인증 ----------
export class ProfilePendingError extends Error {}
export const authAPI = {
  // 이메일로 인증번호를 보냅니다. (메일 서비스가 없는 개발 환경에서는 demoCode가 함께 와요)
  requestEmailCode: (email: string) => rpc<{ delivered: boolean; demoCode?: string }>('auth.requestEmailCode', email),
  verifyEmailCode: (email: string, code: string) => rpc<{ proof: string }>('auth.verifyEmailCode', email, code),

  me: async (): Promise<User | null> => {
    const token = await getToken();
    if (!token) return null;
    const res = await fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.json().catch(() => null) as { data?: { user: User }; error?: { message?: string; code?: string } } | null;
    if (body?.error?.code === 'PROFILE_PENDING') throw new ProfilePendingError(body.error.message);
    if (!res.ok || !body?.data?.user) throw new Error(body?.error?.message ?? '사용자 정보를 확인하지 못했어요.');
    return body.data.user;
  },

  signup: async (input: {
    email: string; password: string; nickname: string; identity: IdentityInput; emailProof: string;
    consents: { terms: boolean; consent: boolean; privacy: boolean };
  }): Promise<User> => {
    const client = requireSupabase();
    const email = input.email.trim().toLowerCase();
    const { password, ...profile } = input;
    const current = await client.auth.getSession();
    if (current.error) throw current.error;
    if (current.data.session && current.data.session.user.email?.toLowerCase() !== email) {
      throw new Error('다른 이메일로 로그인되어 있어요. 로그아웃한 뒤 다시 시도해주세요.');
    }
    // A confirmed, unfinished signup can be resumed only with its existing password.
    const existing = current.data.session ? null : await client.auth.signInWithPassword({ email, password });
    if (current.data.session || existing?.data.session) {
      try {
        await rpc<void>('auth.signup', profile);
      } catch (error) {
        if (!current.data.session) await client.auth.signOut({ scope: 'local' });
        throw error;
      }
    } else {
      await rpc<{ created: boolean }>('auth.provisionSignup', { ...input, email });
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw new Error('가입은 완료됐지만 자동 로그인에 실패했어요. 로그인 화면에서 다시 시도해주세요.');
    }
    const user = await authAPI.me();
    if (!user) throw new Error('가입 정보를 확인하지 못했어요. 로그인 화면에서 다시 시도해주세요.');
    return user;
  },

  login: async (email: string, password: string): Promise<User> => {
    const client = requireSupabase();
    let result = await client.auth.signInWithPassword({ email, password });
    if (result.error?.code === 'invalid_credentials') {
      // Existing users prove the old password before the server provisions their SDK account.
      const res = await fetch(`${API_BASE}/api/rpc/auth.migrate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ args: [email, password] }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null) as { error?: { message?: string } } | null;
        throw new Error(body?.error?.message ?? '로그인에 실패했어요.');
      }
      result = await client.auth.signInWithPassword({ email, password });
    }
    if (result.error) throw result.error;
    const user = await authAPI.me().catch(async (error: unknown) => {
      if (!(error instanceof ProfilePendingError)) await authAPI.logout().catch(() => undefined);
      throw error;
    });
    if (!user) throw new Error('사용자 정보를 확인하지 못했어요.');
    return user;
  },

  providers: async () => {
    const response = await fetch(`${API_BASE}/api/auth/providers`);
    if (!response.ok) throw new Error('로그인 서비스 상태를 확인하지 못했어요.');
    return (await response.json() as { data: { email: { enabled: boolean }; naver: { enabled: boolean } } }).data;
  },

  startNaver: async (link = false) => {
    const client = requireSupabase();
    sessionStorage.setItem('momentree-auth-intent', link ? 'link' : 'naver');
    const credentials = { provider: naver, options: { redirectTo: callbackUrl(), scopes: 'openid' } };
    const { error } = link ? await client.auth.linkIdentity(credentials) : await client.auth.signInWithOAuth(credentials);
    if (error) { sessionStorage.removeItem('momentree-auth-intent'); throw error; }
  },

  logout: async (): Promise<void> => {
    const { error } = await requireSupabase().auth.signOut({ scope: 'local' });
    if (error) throw error;
  },

  updateAvatar: (avatar: string | null) => rpc<User>('auth.updateAvatar', avatar),
  changeNickname: (nickname: string) => rpc<User>('auth.changeNickname', nickname),

  // 탈퇴: 계정 삭제 + 같은 이메일 30일 재가입 제한
  withdraw: async (password: string): Promise<void> => {
    await rpc<void>('auth.withdraw', password);
    await authAPI.logout().catch(() => undefined);
  },
};

// ---------- 글 ----------
export const postAPI = {
  list: (category: Category | '전체' = '전체', sort: 'latest' | 'likes' = 'latest') =>
    rpc<PostView[]>('post.list', category, sort),
  search: (query: string) => rpc<PostView[]>('post.search', query),
  mine: () => rpc<PostView[]>('post.mine'),
  subscribedFeed: () => rpc<PostView[]>('post.subscribed'),
  get: (id: string) => rpc<PostView>('post.get', id),
  // 위기 키워드는 서버가 직접 세므로 두 번째 값은 참고용이에요.
  create: (input: { category: Category; title: string; content: string }, keywordCount = 0) =>
    rpc<PostView>('post.create', input, keywordCount),
  update: (id: string, input: { category: Category; title: string; content: string }) =>
    rpc<PostView>('post.update', id, input),
  toggleLike: (id: string) => rpc<void>('post.toggleLike', id),
  setPinned: (id: string, pinned: boolean) => rpc<void>('post.setPinned', id, pinned),
  setPrivate: (id: string, isPrivate: boolean) => rpc<void>('post.setPrivate', id, isPrivate),
  remove: (id: string) => rpc<void>('post.remove', id),
};

// ---------- 댓글 ----------
export const commentAPI = {
  list: (postId: string) => rpc<Comment[]>('comment.list', postId),
  add: (postId: string, content: string) => rpc<void>('comment.add', postId, content),
};

// ---------- 구독 · 차단 ----------
export const socialAPI = {
  subscribe: (authorId: string) => rpc<void>('social.subscribe', authorId),
  block: (userId: string) => rpc<void>('social.block', userId),
  unblock: (userId: string) => rpc<void>('social.unblock', userId),
  blockedUsers: () => rpc<{ id: string; nickname: string }[]>('social.blockedUsers'),
};

// ---------- 나뭇잎 ----------
export const leafAPI = {
  logs: () => rpc<LeafLog[]>('leaf.logs'),
};

// ---------- 신고 ----------
export const reportAPI = {
  create: (input: {
    targetType: Report['targetType']; targetId: string; targetPreview: string; reason: Report['reason']; detail?: string;
  }) => rpc<void>('report.create', input),
};

// ---------- 운영자 ----------
export const adminAPI = {
  // 운영자 계정을 만드는 유일한 경로
  createAdmin: (input: { email: string; password: string; nickname: string }) => rpc<void>('admin.createAdmin', input),

  // 총괄 운영자 전용
  listAdmins: () => rpc<{ id: string; email: string; nickname: string; createdAt: string }[]>('admin.listAdmins'),
  removeAdmin: (userId: string) => rpc<void>('admin.removeAdmin', userId),
  blockedEmails: () => rpc<BlockedEmail[]>('admin.blockedEmails'),
  unblockEmail: (email: string) => rpc<void>('admin.unblockEmail', email),
  listMembers: () => rpc<MemberSummary[]>('admin.listMembers'),
  viewIdentity: (userId: string) => rpc<IdentityView>('admin.viewIdentity', userId),
  identityLogs: () => rpc<IdentityAccessLog[]>('admin.identityLogs'),

  // 모든 운영자: 처리가 끝나지 않은 위기 알림의 작성자 개인정보
  identityForAlert: (alertId: string) => rpc<IdentityView>('admin.identityForAlert', alertId),

  reports: () => rpc<Report[]>('admin.reports'),
  alerts: () => rpc<CrisisAlert[]>('admin.alerts'),
  setReportStatus: (id: string, status: ProcessStatus) => rpc<void>('admin.setReportStatus', id, status),
  // 이용 제한은 기간(1·3·7·30일, 0=영구)을 함께 보내요.
  resolveReport: (id: string, action: ReportAction, days?: number) => rpc<void>('admin.resolveReport', id, action, days),
  liftRestriction: (reportId: string) => rpc<void>('admin.liftRestriction', reportId),
  setAlertStatus: (id: string, status: ProcessStatus) => rpc<void>('admin.setAlertStatus', id, status),
  sendCareNotice: (alertId: string) => rpc<void>('admin.sendCareNotice', alertId),
};

// ---------- 알림 ----------
export const notificationAPI = {
  list: () => rpc<AppNotification[]>('notification.list'),
  markAllRead: () => rpc<void>('notification.markAllRead'),
  clearAll: () => rpc<void>('notification.clear'),
};

// ---------- 오늘의 쉼표 (나만 볼 수 있어요) ----------
export const noteAPI = {
  today: () => rpc<string>('note.today', localDateKey()),
  saveToday: (text: string) => rpc<void>('note.save', text, localDateKey()),
};
