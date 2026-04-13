# LOOMA

음성으로 건강 상태를 기록하고 AI가 자동 구조화해주는 모바일 웹 서비스

## 프로젝트 구조

```
LOOMA/
├── frontend/          # Next.js (App Router) - Vercel 배포
│   └── src/
│       ├── app/       # 페이지 라우트
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       ├── stores/
│       └── styles/
│
└── backend/           # Node.js + Express API - Railway/Render 배포
    └── src/
        ├── routes/
        ├── models/
        ├── middleware/
        ├── services/
        └── config/
```

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 14 (App Router), React 18 |
| Backend | Node.js, Express |
| Database | MongoDB + Mongoose |
| Auth | Kakao OAuth 2.0 + JWT |
| STT | OpenAI Whisper API |
| AI | Anthropic Claude API |
| LLM Monitoring | LangSmith |
| 보안 | AES-256 (건강데이터 암호화), HTTPS |

## 시작하기

### Backend
```bash
cd backend
cp .env.example .env
# .env 파일 수정
npm install
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env.local
# .env.local 파일 수정
npm install
npm run dev
```
