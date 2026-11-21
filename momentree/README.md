# 모먼트리 (Momentree) 클라이언트

React 19 + TypeScript + Vite + Emotion + React Router + React Hook Form + React Query.
데이터는 **Express 서버(momentree-server) → Supabase PostgreSQL**에 저장돼요.

    cp .env.example .env.local     # VITE_API_BASE_URL 확인
    npm install
    npm run dev

서버를 먼저 켜야 해요. (`momentree-server/README.md` 참고)
Vercel에 배포할 때는 환경변수 `VITE_API_BASE_URL`에 서버(Render) 주소를 넣고 다시 배포하세요.

## 인증 설정

`.env.example`을 참고해 `.env.local`에 `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`를 설정합니다. 서버 README의 인증 마이그레이션·OIDC 설정을 먼저 완료하세요. 기존 모먼트리 화면과 경로를 유지하며, 외부 인증만 `/auth/callback`을 거칩니다. 네이버 로그인 전 이메일로 로그인한 뒤 상단 **네이버 연결**을 사용합니다.
