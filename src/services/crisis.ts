// 명확한 위기 키워드만 감지합니다. 완벽하지 않으므로 신고 기능으로 보완합니다.
const CRISIS_KEYWORDS = ['자살', '자해', '유서', '죽고 싶', '죽고싶'];

export function countCrisisKeywords(text: string): number {
  return CRISIS_KEYWORDS.reduce((sum, keyword) => sum + text.split(keyword).length - 1, 0);
}
