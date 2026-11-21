// LocalStorage 읽기/쓰기 도우미. JSON이 깨져 있으면 fallback을 돌려줍니다.
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const newId = (): string => crypto.randomUUID();
