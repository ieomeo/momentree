// 일반 카테고리 (모든 사용자가 글쓰기에서 선택 가능)
export const CATEGORIES = ['시', '가사', '일기', '단상', '한 줄 문구', '작은 온기', '연결'] as const;
// 공지글 카테고리: 운영자만 글쓰기에서 선택할 수 있고, 항상 서재 맨 위에 파란 테두리로 보입니다.
export const NOTICE_CATEGORY = '공지글' as const;
export const ALL_CATEGORIES = [NOTICE_CATEGORY, ...CATEGORIES] as const;
export type Category = (typeof ALL_CATEGORIES)[number];

export const REPORT_REASONS = [
  '자극적이거나 위험한 내용(방법·수단 묘사)',
  '욕설·악성 표현',
  '스팸·광고',
  '기타',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_ACTIONS = ['문제 없음', '경고 및 게시 중단', '이용 제한'] as const;
export type ReportAction = (typeof REPORT_ACTIONS)[number];

// pending: 미확인/대기, reviewing: 검토 중, done: 처리 완료
export type ProcessStatus = 'pending' | 'reviewing' | 'done';

export interface User {
  id: string;
  email: string;
  nickname: string;
  role: 'user' | 'admin';
  leaves: number;
  earnedToday: number;
  earnedDate: string;
  blocked: string[];
  subscribed: string[];
  avatar?: string; // 프로필 사진 (data URL)
  createdAt: string;
  isSuperAdmin?: boolean; // 총괄 운영자 여부 (서버가 알려줘요)
  restrictedUntil?: string; // 이용 제한이 끝나는 시각 (제한 중일 때만)
  restrictionReason?: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorAvatar?: string;
  nickname: string;
  category: Category;
  title: string;
  content: string;
  createdAt: string;
  likedBy: string[];
  hidden?: boolean;
  pinned?: boolean; // 운영자가 고정한 글
  isPrivate?: boolean; // 비공개(작성자만 볼 수 있음)
}

export type PostView = Post & { commentCount: number; authorIsAdmin: boolean };

export interface BlockedEmail {
  email: string;
  at: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  nickname: string;
  content: string;
  createdAt: string;
}

export interface Report {
  memo?: string;
  targetDeleted?: boolean;
  stopped?: boolean;
  days?: number | null;
  id: string;
  targetType: 'post' | 'comment' | 'note';
  targetId: string;
  targetPreview: string;
  reason: ReportReason;
  detail?: string;
  reporterId: string;
  status: ProcessStatus;
  action?: string;
  createdAt: string;
}

export interface CrisisAlert {
  memo?: string;
  id: string;
  postId: string;
  keywordCount: number;
  status: ProcessStatus;
  createdAt: string;
  careSent?: boolean; // [추가] 운영자가 작성자에게 도움 안내를 보냈는지
}

// [추가] 알림
export type NotificationType =
  | 'like' // 내 글에 공감
  | 'comment' // 내 글에 댓글
  | 'subscribe' // 누군가 나를 구독
  | 'new-post' // 내가 구독한 사람의 새 글
  | 'notice' // 운영자 공지글
  | 'warning' // 운영자 경고
  | 'removed' // 글 삭제·게시 중단
  | 'restricted' // 이용 제한
  | 'crisis' // 운영자용 위기 알림
  | 'care'; // 운영자가 보낸 도움 안내

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  text: string;
  link?: string;
  createdAt: string;
  read: boolean;
}

export interface LeafLog {
  id: string;
  userId: string;
  type: 'earn' | 'spend';
  label: string;
  amount: number;
  createdAt: string;
}

// [추가] 개인정보(실명·생년월일·연락처): 가입 시 받아 운영자만 확인할 수 있어요.
export interface IdentityInput {
  name: string;
  birthDate: string; // YYYY-MM-DD
  phone: string;
}

export interface Identity extends IdentityInput {
  userId: string;
  createdAt: string;
}

export interface IdentityView {
  userId: string;
  nickname: string;
  email: string;
  identity: IdentityInput | null; // 수집된 개인정보가 없으면 null
}

export interface IdentityAccessLog {
  id: string;
  adminId: string;
  adminNickname: string;
  targetNickname: string;
  reason: 'crisis-alert' | 'super-admin';
  at: string;
}

export interface MemberSummary {
  id: string;
  nickname: string;
  email: string;
  role: User['role'];
  hasIdentity: boolean;
  createdAt: string;
}
