# CLAUDE.md

> Claude Code가 이 프로젝트에서 작업할 때 **반드시 따라야 할 규칙**.
> 모든 대화·작업 시작 전 이 문서를 우선 참조한다.

---

## 🎯 프로젝트 한 줄 요약

**LOOMA**는 본인·가족·지인·반려동물의 **질병/증상을 루틴 단위로 매일 기록**하는 모바일 웹앱(PWA). 유저가 음성이나 텍스트로 편하게 말하면 **AI가 카테고리별 기록지로 자동 정리**한다. 운영 주체는 LOOMA.

**현재 단계**: MVP. 빠르게 동작하는 것 최우선. 목표: 1주일 내 배포 가능한 수준.

---

## 🧠 작업 전 필수 숙지 사항

### 프로젝트 구조
```
LOOMA/
├── CLAUDE.md                   ← 이 문서 (항상 참조)
├── docs/                       ← 상세 문서 (작업 시 필요한 것만 로드)
│   ├── 01_PRODUCT_SPEC_LITE.md    ← 제품 스펙 요약
│   ├── 02_CORE_FLOW.md            ← 7개 사용자 흐름
│   ├── 03_SCREEN_MAP.md           ← 화면 카탈로그
│   └── 04_AI_PROMPTS.md           ← (작성 예정) Claude 프롬프트
├── frontend/                   ← Next.js 14 App Router
│   └── src/
│       ├── app/                ← 페이지 라우트
│       ├── components/
│       ├── hooks/
│       ├── stores/             ← 상태관리
│       ├── lib/                ← 유틸/API 클라이언트
│       └── styles/
├── backend/                    ← Node.js + Express
│   └── src/
│       ├── routes/             ← auth, onboarding, records, routines, users
│       ├── models/             ← User, Patient, Routine, Record, Conversation
│       ├── services/           ← claudeService, whisperService
│       ├── middleware/
│       └── config/
```

### 문서 참조 규칙
작업에 따라 다음 문서를 **추가로 읽어라**:
- **사용자 흐름 관련** → `docs/02_CORE_FLOW.md`
- **특정 화면 구현** → `docs/03_SCREEN_MAP.md`
- **Claude/Whisper 관련** → `docs/04_AI_PROMPTS.md` (있으면)
- **제품 의도/범위 헷갈릴 때** → `docs/01_PRODUCT_SPEC_LITE.md`

---

## 🧱 기술 스택 (고정, 임의 변경 금지)

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 14 (App Router) + React 18 |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | Kakao OAuth 2.0 + JWT |
| STT | OpenAI Whisper API |
| AI | Anthropic Claude API (Haiku 또는 Sonnet) |
| LLM 모니터링 | LangSmith |
| 보안 | AES-256 (민감정보), HTTPS, bcrypt |
| 배포 | Vercel (frontend) + Railway/Render (backend) |

**새 라이브러리 추가 시 반드시 사전 확인 요청할 것.** 임의 도입 금지.

---

## 🗄️ 데이터 모델 (실제 코드 기준)

`backend/src/models/` 참조. 요약:

```
User          — 카카오 로그인 유저
  └─ Patient  — 기록 대상 프로필 (본인/가족/반려동물)
      └─ Routine  — 대상 × 질병 단위 (예: "엄마 고혈압")
          └─ Record    — 일별 기록지 (AI 분석 결과)
              └─ sections: [{ title, items[], order }]
          └─ Conversation  — 음성 세션 (audioUrls + messages)
```

### 핵심 관계
- **User → Patient**: 1:N (본인 + 가족 여러 명)
- **Patient → Routine**: 1:N (엄마의 고혈압 + 당뇨 각각 루틴)
- **Routine → Record**: 1:N (매일의 기록)
- **Record ↔ Conversation**: MVP에서는 1:1 매핑

### 암호화 대상 필드
`Record.rawTranscript`, `Record.sections`, `Record.summary`, `Record.notes` → **AES-256 암호화 필수** (pre-save 훅).

### Soft Delete
- `User.deletedAt`, `Routine.deletedAt`, `Record.deletedAt` 활용
- 루틴 삭제 시 과거 Record는 절대 삭제하지 말 것 (`Routine.deletedAt`만 세움)

---

## 🚫 구현 금지 사항 (MVP 범위 위반)

Claude Code는 다음을 **요청받지 않는 한 구현하지 말 것**:

1. **주간/월간 AI 요약지** — 향후 확장
2. **기록 리마인더/푸시 알림** — 향후 확장
3. **1:1 문의 내부 구현** — 구글폼 외부 링크로 대체
4. **실시간 STT 스트리밍** — Whisper는 녹음 종료 후 일괄 변환
5. **개인화된 의료 조언/진단** — 법적 리스크, Claude 프롬프트에서도 명시적 차단
6. **가족 간 공유 / 의료진 공유** — 향후 확장
7. **PDF/이미지 내보내기** — 향후 확장
8. **중복 기록 병합 로직** — 같은 루틴 하루 여러 번 기록 = 여러 Record 단순 생성
9. **이메일/비밀번호 로그인** — 카카오 OAuth 단일
10. **unsaved changes 경고** — MVP에선 단순 처리

---

## 🛡️ 코드 작성 원칙 (위반 금지)

### 1. 민감정보 보호
- `Record.rawTranscript`, `sections`, `summary`, `notes` → **Mongoose pre-save 훅으로 AES-256 암호화**
- `.env` 파일에 암호화 키 저장, 절대 하드코딩 금지
- API 키(Anthropic, OpenAI, Kakao)는 반드시 `process.env.XXX`로만 접근

### 2. AI 호출 안전성
- **Claude/Whisper 호출은 백엔드에서만**. 프론트에서 API 키 직접 노출 절대 금지
- Claude 응답 JSON은 **Zod 또는 수동 검증 레이어** 통과 후 DB 저장
- JSON 파싱 실패 시 **1회 재시도**, 재시도도 실패하면 에러 플로우

### 3. 의료 조언 차단
- Claude 시스템 프롬프트에 **"의학적 진단/처방/조언 생성 금지"** 명시
- 응답에 "~병일 수 있다", "~약을 드세요" 같은 문구 탐지 시 후처리로 제거/경고

### 4. 에러 처리
- 모든 API 엔드포인트는 try-catch로 에러 포착
- 유저에게는 **친근한 한국어 메시지**로 변환 ("서버에 문제가 생겼어요" 등)
- 기술 에러 메시지 그대로 노출 금지

### 5. 데이터 일관성
- Record 생성 시 반드시 `routineId`, `date`, `source` 필수 검증
- 날짜는 `YYYY-MM-DD` 문자열로 통일
- ObjectId 참조는 Mongoose populate 활용

### 6. 타입 일관성
- 백엔드/프론트엔드 간 데이터 구조 일치
- 필드 네이밍은 **camelCase** (`rawTranscript`, `patientId` 등)
- UI 표기는 한국어, 코드는 영어

---

## 🔄 핵심 기능 흐름 (매우 중요)

### 기록 작성 플로우 (앱의 심장)

```
1. [홈] 유저가 루틴 카드의 [오늘의 기록 시작하기] 탭
2. [기록 작성] 마이크 탭 → 음성 녹음
   - 녹음 중에는 시각적 피드백만 (파형/점 애니메이션)
   - MVP는 실시간 STT 아님, 중지 후 일괄 변환
3. [중지] 탭 → Whisper API 호출 → 변환된 텍스트 표시
4. 유저가 텍스트 검토/수정 (STT 오류 교정)
5. [전송 ↑] 탭 → Claude API 호출
   - 시스템 프롬프트: 사전 정의된 카테고리로만 분류
   - 카테고리 없는 내용은 "기타" 카테고리로 분류
   - JSON 형식으로 응답: { sections: [{ title, items[] }] }
6. Record 생성 (DB 저장, 암호화 적용)
7. [기록 완료] 탭 → 저장 완료 화면
8. [확인하기] 또는 [홈으로] → 홈 복귀
```

### 기록 수정 플로우
- 섹션 카드 탭 → 바텀시트에서 편집 (로컬 상태)
- 바텀시트 [저장] = 메인 화면 반영 (DB 아님)
- 하단 [저장하기] = DB UPDATE 커밋
- [취소] 시 모든 편집 폐기 (원본 복구)

### 중요 UX 원칙
- **Whisper/Claude 실패 시 유저 입력 텍스트 보존** — 다시 타이핑 요구는 UX 치명적
- **분석 중 뒤로가기 금지** — 녹음 중 이탈은 경고 모달
- **평균 Claude 응답 5초 이내** 목표 (Haiku/Sonnet 사용)

---

## 🎨 프론트엔드 작업 시 유의사항

### Next.js 14 App Router
- Server Components 기본, Client Components는 `"use client"` 명시
- 음성 녹음/폼 입력은 반드시 Client Component
- API Route보다 **백엔드 Express 서버** 우선 사용 (기존 구조 유지)

### 상태 관리
- `frontend/src/stores/` 폴더 활용 (Zustand 또는 유사 라이브러리로 추정, 확인 후 사용)
- 전역 상태: 유저 정보, 선택된 Patient/Routine
- 로컬 상태: 폼 입력, 편집 중 기록

### 모바일 웹 (PWA 방향)
- 모바일 뷰포트 기준 설계 (360~420px 너비)
- 디자인은 **목업 그대로** 구현, 임의 디자인 수정 금지
- Tailwind 또는 CSS Module 사용 (기존 스타일 확인 후)

---

## 🔌 백엔드 작업 시 유의사항

### 라우트 구조
```
/api/auth/kakao         POST   카카오 OAuth 콜백
/api/auth/logout        POST
/api/users/signup       POST   닉네임 입력 완료 후 가입 확정
/api/users/me           GET, PATCH, DELETE
/api/users/me/notifications  PATCH

/api/patients           GET, POST
/api/patients/:id       GET, PATCH

/api/routines           GET, POST
/api/routines/:id       PATCH, DELETE (soft)

/api/records            POST (AI 분석 + 저장 통합)
/api/records?date=YYYY-MM-DD    GET
/api/records/calendar?month=YYYY-MM    GET (점 표시용)
/api/records/:id        GET, PATCH, DELETE

/api/stt/transcribe     POST (Whisper 래퍼)
```

### 미들웨어
- JWT 인증 미들웨어 → 모든 `/api/*` 경로 (auth 제외)
- 에러 핸들러 → Express 최후단
- Rate limiting → 특히 `/api/stt`, `/api/records` 호출 빈도 제한

### LangSmith 추적
- Claude 호출 시마다 자동 로깅
- 항목: 프롬프트, 응답, 소요시간, 토큰 사용량
- 개발 단계부터 붙여서 품질 모니터링

---

## 📋 작업 요청 시 Claude Code의 동작

### 작업 시작 전
1. **CLAUDE.md 재확인** (이 문서)
2. 관련 `docs/` 문서 로드 (해당되는 경우)
3. 기존 코드 구조 확인 (이미 있는 파일 수정 vs 새 파일 생성)
4. 의도 확인 필요 시 **먼저 질문** (임의 추측 금지)

### 작업 중
1. **작은 단위로 작업**. 한 번에 여러 기능 구현 금지
2. 코드 수정 전 **반드시 기존 파일 내용 먼저 읽기**
3. 민감정보 다루는 코드는 **암호화 헬퍼 통과** 필수
4. 새 환경변수 필요 시 `.env.example`에도 추가

### 작업 후
1. 수정한 파일 목록 보고
2. 다음 단계 제안
3. 테스트 방법 안내 (curl 예시, 프론트 확인 방법 등)

---

## 🚀 MVP 구현 우선순위 (7일 로드맵)

| Day | 작업 | 주요 파일 |
|-----|------|----------|
| 1 | 환경 세팅 + 기존 코드 파악 | `.env`, `CLAUDE.md` |
| 2 | DB 연결 + 카카오 OAuth | `backend/src/config`, `routes/auth.js` |
| 3 | Patient/Routine/Record CRUD API | `backend/src/routes/*` |
| 4 | Whisper + Claude 서비스 구현 | `backend/src/services/*` |
| 5 | 프론트: 인증/홈/루틴 생성 | `frontend/src/app/*` |
| 6 | 프론트: 기록 작성/수정/조회 | `frontend/src/app/record/*` |
| 7 | 통합 테스트 + 버그 수정 + 배포 | Vercel, Railway |

**Day가 밀리더라도 순서는 엄수** — 프론트 먼저 만들면 백엔드 맞추느라 재작업 증가.

---

## 💬 유저 커뮤니케이션 언어

- 유저는 **비개발자**. 기술 용어 최소화.
- 코드 설명 시 **한국어로, 초보자 눈높이**에 맞춰서.
- 에러나 실수 발생 시 **왜 그런지 짧게 설명** + **해결 방법 제시**.
- 명령어는 복사-붙여넣기 가능하게 **코드블록으로** 제공.

---

## 🎯 이 문서의 위상

이 문서는 **프로젝트 헌법**이다. 
- 내용이 바뀌면 모든 작업 방향이 바뀐다.
- 수정 시 반드시 유저와 합의 후 진행.
- 다른 `docs/*.md` 문서가 이 문서와 충돌하면 **이 문서가 우선**한다.
