# CLAUDE.md

> LOOMA 작업 시 가장 먼저 읽는 운영 문서.
> 다른 문서와 충돌하면 이 문서를 우선 적용한다.

## 한 줄 요약

**LOOMA**는 본인·가족·지인·반려동물의 질병/증상을 루틴 단위로 매일 기록하는 모바일 PWA다.  
음성 또는 텍스트 입력을 받아 AI가 카테고리별 기록지로 정리한다. 현재 단계는 **MVP**다.

---

## 1. 행동 규범

### 1. 가정을 숨기지 마라
- 모호하면 추측해서 코딩하지 말고 먼저 질문한다.
- 해석이 둘 이상이면 조용히 하나를 고르지 말고 선택지를 제시한다.
- 더 단순한 접근이 보이면 그대로 밀지 말고 푸시백한다.

### 2. 단순함이 먼저다
- 요청한 것 이상 만들지 않는다.
- 1회용 코드에 추상화, 확장성, 설정화를 억지로 넣지 않는다.
- 발생 가능성이 낮은 시나리오를 위해 과한 에러 처리를 만들지 않는다.
- "지금 시니어가 보면 과설계라고 할까?" 싶으면 다시 단순하게 쓴다.

### 3. 외과적으로 수정한다
- 요청과 직접 연결된 부분만 건드린다.
- 무관한 리팩터링, 포맷팅, 주석 손보기는 하지 않는다.
- 망가지지 않은 기존 구조를 임의로 갈아엎지 않는다.
- 무관한 dead code는 언급만 하고 함부로 삭제하지 않는다.
- 내가 만든 orphan import/변수만 정리한다.

### 4. 검증 가능한 목표로 일한다
- 모든 작업은 "무엇이 통과 조건인지"를 먼저 정의한다.
- 예시:
  - STT 연결 → 더미 음성 입력 후 한국어 텍스트 응답 확인
  - Record 저장 → `POST /records` 후 DB에 sections 저장 확인
  - 버그 수정 → 재현 케이스 먼저 만들고 실패→통과 전환 확인
- 다단계 작업은 짧게 끊어서 적는다.
  - `1. [단계] -> 검증: [확인]`

---

## 2. LOOMA 도메인 절대 규칙

1. **민감정보 암호화**
   - `Record.sections`, `Record.summary`, `Record.notes`, `Conversation.messages`는 AES-256 없이 저장 금지.
2. **AI 키는 백엔드에서만**
   - Anthropic/OpenAI/Kakao 키를 프론트에 노출하지 않는다.
3. **의료 조언 차단**
   - Claude 프롬프트에 진단/처방 금지 명시.
   - "~병일 수 있다", "~을 드세요" 류 문구는 차단 대상으로 본다.
4. **Claude JSON 검증**
   - Zod 검증 통과 후에만 DB 저장.
   - 파싱 실패 시 1회 재시도, 그래도 실패하면 에러 플로우 + 유저 입력 보존.
5. **Routine 삭제는 soft delete**
   - 과거 Record는 보존하고 `deletedAt`만 사용한다.
6. **카카오 OAuth 단일**
   - 이메일/비밀번호 로그인 구현 금지.
7. **새 라이브러리 도입 전 확인**
   - 임의 추가 금지.

---

## 3. 프로젝트 빠른 지도

```text
LOOMA/
├─ CLAUDE.md
├─ docs/
├─ frontend/
└─ backend/
```

### 핵심 폴더
- `frontend/src/app/` : 화면 라우트
- `frontend/src/components/` : 재사용 UI
- `frontend/src/stores/` : 프론트 상태
- `backend/src/models/` : 실제 데이터 구조
- `backend/src/routes/` : API 엔드포인트
- `backend/src/services/` : Claude / Whisper / 암호화 로직

### 기술 스택
- Frontend: Next.js 14 + React 18
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: Kakao OAuth 2.0 + JWT
- STT: OpenAI Whisper API
- AI: Anthropic Claude API
- Monitoring: LangSmith

---

## 4. 문서 참조 규칙

작업할 때는 필요한 문서만 추가로 읽는다.

- 제품 범위 / 용어 / 금지사항 → `docs/01_PRODUCT_SPEC_LITE.md`
- 사용자 흐름 → `docs/02_CORE_FLOW.md`
- 화면 스펙 → `docs/03_SCREEN_MAP.md`
- 현재 구현 상태 / 최근 handoff → `docs/HANDOFF.md`
- Claude 프롬프트 / 카테고리 마스터 → `docs/04_AI_PROMPTS.md` (생기면 사용)
- 데이터 구조 정답 → `backend/src/models/`

### 정합성 우선순위
1. `CLAUDE.md`
2. `docs/*.md`
3. `notes/*.md`

단, **필드명이나 모델 구조가 문서와 실제 코드가 다르면 `backend/src/models/`를 더 최신 정답으로 본다.**

---

## 5. 작업 사이클

### 시작
1. 이 문서 적용
2. 관련 `docs`만 발췌해서 읽기
3. 기존 코드 먼저 읽기
4. 모호하면 질문

### 진행 중
- 작은 단위로 자른다
- 기존 스타일을 유지한다
- 새 환경변수가 생기면 `.env.example`도 같이 갱신한다

### 끝
1. 변경 파일 목록
2. 요청과의 매핑
3. 검증 증거
4. 의도치 않은 영향 영역
5. 다음 단계 제안

---

## 6. 커뮤니케이션 규칙

- 유저는 비개발자라고 가정한다.
- 한국어로 설명한다.
- 기술 용어는 줄이고, 에러는 "왜" + "어떻게 해결"만 짧게 말한다.
- 명령어는 복붙 가능하게 코드블록으로 준다.

---

## 7. 잘 작동하는 신호

- diff에 불필요한 변경이 줄어든다
- 과설계로 인한 재작업이 줄어든다
- 구현 후 해명보다 구현 전 질문이 늘어난다
- "왜 이 줄을 건드렸지?" 같은 변경이 줄어든다
