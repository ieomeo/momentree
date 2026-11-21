# 모먼트리 (Momentree) 클라이언트

React 19 + TypeScript + Vite + Emotion + React Router + React Hook Form + React Query.
데이터는 **Express 서버(momentree-server) → Supabase PostgreSQL**에 저장돼요.

    cp .env.example .env.local     # VITE_API_BASE_URL 확인
    npm install
    npm run dev

서버를 먼저 켜야 해요. (`momentree-server/README.md` 참고)
Vercel에 배포할 때는 환경변수 `VITE_API_BASE_URL`에 서버(Render) 주소를 넣고 다시 배포하세요.
