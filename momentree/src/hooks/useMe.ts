import { useQuery } from '@tanstack/react-query';
import { authAPI } from '../services/api';

// 현재 로그인한 사용자 (없으면 null)
export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: authAPI.me });
}
