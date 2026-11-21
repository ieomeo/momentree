export const todayKey = (): string => new Date().toISOString().slice(0, 10);

// [추가] 내 시간대 기준 오늘 날짜(YYYY-MM-DD). 오늘의 쉼표에 사용합니다.
export function localDateKey(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// n년 전 오늘 날짜(YYYY-MM-DD). 가입 화면에서 만 14세 이상만 고를 수 있게 하는 데 써요.
export function yearsAgoKey(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 이용 제한 종료 시각을 사람이 읽기 쉬운 말로 (9000년 이후는 영구 제한)
export function restrictionLabel(until: string): string {
  const date = new Date(until);
  return date.getFullYear() >= 9000 ? '계속' : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}까지`;
}

export function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : '문제가 생겼어요. 다시 시도해주세요.';
}
