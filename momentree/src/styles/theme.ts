import type { Category } from '../types';

// 화면 설계 PDF의 팔레트
export const color = {
  bg: '#f5f0e6',
  paper: '#fdfaf0',
  green: '#cbd8b3',
  greenSoft: '#dfe8d2',
  brown: '#6b4f45',
  brownSoft: '#8c7b70',
  pink: '#f2dcd2',
  sand: '#e8dfd2',
  yellow: '#f3e5c1',
  border: '#d5dcb9',
  danger: '#b5543f',
  notice: '#1d4ed8',
  noticeSoft: '#eff6ff',
} as const;

export function categoryColor(category: Category): string {
  if (category === '공지글') return color.noticeSoft;
  if (category === '시') return color.pink;
  if (category === '가사') return color.sand;
  if (category === '일기') return color.greenSoft;
  return color.yellow;
}
