# LOOMA Handoff

작성일: 2026-05-14  
기준 저장소: `C:\Users\주원석\Documents\LOOMA`

## 1. 현재 상태 한 줄 요약

프론트의 핵심 사용자 플로우는 대부분 구현되어 있고,  
백엔드는 **`POST /records` 기준으로 OpenAI 구조화 + MongoDB 저장까지 실제로 검증 완료**된 상태다.

---

## 2. 지금까지 완료된 큰 작업

### 프론트엔드

1. 스플래시 / 로그인 화면
2. 닉네임 입력 온보딩
3. 가입 완료 화면
4. 루틴 생성 1~3단계
5. 홈 빈 상태 / 루틴 존재 상태
6. 오늘의 기록 생성 플로우
7. 기록지 상세 보기
8. 기록지 항목 추가
9. 기록지 항목 수정

### 백엔드

1. `Patient` / `Routine` 모델 정리
2. AI 프롬프트 초안 작성
3. OpenAI 기반 기록 구조화 서비스 구현
4. `POST /records` 구현
5. OpenAI 응답 검증 로직 구현
6. MongoDB 저장 실검증 완료
7. 프론트 `기록 완료`와 실제 `POST /records` 연결 완료

---

## 3. 현재 사용자 플로우

### 인증 / 온보딩

- `/`
  - 현재는 카카오 실연동 없이 MVP용 시작 화면
- `/onboarding`
  - 닉네임 입력
  - 완료 화면
  - `홈으로` -> `/home`
  - `시작하기` -> `/routines/new`

### 루틴 생성

- `/routines/new`
  - 1단계: 기록 대상 선택
  - 2단계: 기본 정보 입력
  - 3단계: 질병/증상명 입력
  - 완료 후 홈 이동

### 홈

- `/home`
  - 피드백 카드
  - 날짜 네비게이션
  - 오늘의 기록 영역
  - 기록 루틴 영역
  - 각 루틴 카드의 `오늘의 기록 시작하기` -> `/record/new?routineId=...`

### 기록 생성

- `/record/new`
  - 초기 상태
  - 녹음 중 상태
  - 종료 모달
  - 검토 상태
  - 분석 중 상태
  - 결과 상태
  - 저장 완료 상태

### 기록 상세

- `/record/[recordId]`
  - 상세 보기
  - 항목 추가 바텀시트
  - 항목 수정 바텀시트
  - 저장 후 홈 복귀

---

## 4. 프론트 구현 상세

### A. 로그인 / 닉네임

- 로그인 보조 문구 목업 반영
- 닉네임 5자 제한
- 글자 수 카운트
- 버튼 활성/비활성
- 완료 화면 분기 동작 반영

관련 파일:
- `frontend/src/app/page.jsx`
- `frontend/src/app/(auth)/onboarding/page.jsx`
- `frontend/src/stores/authStore.js`

### B. 루틴 생성

- 대상 선택 UI
- `기타(직접 입력)` 분기
- 기본 정보 입력
- 생년월일 invalid 빨간 테두리
- 루틴 생성 완료 화면

관련 파일:
- `frontend/src/app/routines/new/page.jsx`
- `frontend/src/stores/routineStore.js`

### C. 홈

- 빈 상태 / 루틴 존재 상태
- 루틴 카드에 대상 문구 표시
  - `나에 대해 기록 중`
  - `OO에 대해 기록 중`
- 오늘 기록 카드 UI

관련 파일:
- `frontend/src/app/(main)/home/page.jsx`
- `frontend/src/components/layout/TabBar.jsx`
- `frontend/src/app/(main)/layout.jsx`

### D. 기록 생성

- 초기 입력 화면
- 녹음 중 화면
- 종료 모달
- 검토 화면
- 분석 중 화면
- 결과 화면
- 저장 완료 화면

중요:
- 현재 **분석 중 -> 결과 화면**은 아직 mock 기반이다.
- 하지만 **`기록 완료`를 누르면 실제 백엔드 `POST /records`**를 호출한다.
- 저장 후 홈/상세에 보이는 기록은 **백엔드가 반환한 실제 sections/summary** 기준이다.

관련 파일:
- `frontend/src/app/record/new/page.jsx`
- `frontend/src/components/record/NewRecordFlow.jsx`
- `frontend/src/lib/apiClient.js`

### E. 기록 상세 / 추가 / 수정

- 기록지 상세 보기
- 새 섹션 추가
  - 1단계: 항목명 입력
  - 2단계: 상세 내용 bullet 누적
  - `+`로 bullet 추가
  - `X`로 bullet 삭제
  - 새 섹션은 항상 최상단 삽입
- 기존 섹션 수정
  - 카드 탭 시 수정 바텀시트
  - 제목 수정
  - bullet 개별 수정 / 삭제
  - `기록 추가하기`로 새 bullet 추가
  - 섹션 삭제 확인 바텀시트

중요:
- 현재 이 수정/추가/삭제는 **로컬 store에만 반영**된다.
- 아직 `PUT /records/:recordId`로 저장되지 않는다.

관련 파일:
- `frontend/src/app/record/[recordId]/page.jsx`
- `frontend/src/stores/recordStore.js`

---

## 5. 백엔드 구현 상세

### A. 모델 정리

#### `Patient`
- `diseaseName` 제거
- Patient는 순수 신체 프로필 역할

#### `Routine`
- 기존 `items[]` 제거
- `diseaseName` 필드로 정리
- 현재 의미:
  - `Routine = Patient × 질병/증상`

#### `Record`
- `sections` 구조:
  - `title`
  - `items[]`
  - `order`

관련 파일:
- `backend/src/models/Patient.js`
- `backend/src/models/Routine.js`
- `backend/src/models/Record.js`

### B. OpenAI 기록 구조화

- Anthropic 대신 OpenAI Responses API 사용
- `OPENAI_API_KEY` 사용
- `OPENAI_MODEL` 기본값: `gpt-5-mini`
- 허용 카테고리 목록 기반 구조화
- JSON 파싱
- 구조 검증
- 1회 재시도

관련 파일:
- `backend/src/services/claudeService.js`
- `backend/src/services/structuredRecordSchema.js`
- `docs/04_AI_PROMPTS.md`

### C. `POST /records`

현재 동작:

1. `transcript` 수신
2. `routineId` 또는 `routineContext` 수신
3. 루틴 조회
4. 없으면 **로컬 demo user / patient / routine 자동 생성 또는 재사용**
5. OpenAI로 구조화
6. 응답 검증
7. MongoDB `records`에 저장
8. 저장된 record 반환

추가 사항:
- 회피성 응답 필터 추가
  - `원문 손상`
  - `인식되지 않음`
  - `정리할 수 없음`
  - `정보 부족`
  같은 문구는 검증 실패 처리

관련 파일:
- `backend/src/routes/records.js`
- `backend/src/services/structuredRecordSchema.js`

### D. 브라우저 연동

- 프론트 기본 env가 `http://localhost:4000/api`를 쓰고 있었기 때문에
- 백엔드에 `/api/*` 호환 라우트 추가
- `localhost:3000`, `localhost:3001` 모두 허용하는 CORS 추가

관련 파일:
- `backend/src/app.js`

---

## 6. 실제로 검증된 것

### 검증 완료

1. MongoDB 연결
2. OpenAI API 호출
3. `POST /records` 수동 PowerShell 호출
4. `records` 컬렉션 실제 저장 확인
5. UTF-8 인코딩 문제 수정 후 한국어 sections/summary 정상 저장 확인
6. 프론트 `기록 완료` -> 실제 백엔드 저장 연결 확인

### 실제 저장 예시

확인된 저장 결과는 대략 이런 형태다:

- `주요 증상`
  - `아침부터 속이 메스꺼움`
  - `점심 먹고 나서 더 답답함`
- `투약 기록`
  - `약은 먹었는데 바로 좋아지지 않음`
- `식사/음료`
  - `점심 먹고 나서 증상이 더 심해짐`

---

## 7. 현재 저장 규칙

### 루틴

- 프론트 루틴은 여전히 `sessionStorage` 기반
- 백엔드 `Routine`과 1:1 동기화는 아직 아니다
- 대신 기록 저장 시 `routineContext`로 backend routine을 자동 생성/재사용한다

### 기록

- 프론트 기록도 `sessionStorage`에 저장됨
- 저장 성공 시:
  - 백엔드 `Record` 생성
  - 응답 record를 프론트 local store로 반영

즉 현재는:
- **DB 저장도 되고**
- **프론트에서도 바로 보임**

---

## 8. 현재 남아 있는 큰 TODO

### 프론트

1. 분석 중 -> 결과 화면도 실제 백엔드 응답 기준으로 전환
2. 홈의 오늘 기록 목록을 실제 `GET /records` 기준으로 전환
3. 기록 상세를 실제 `GET /records/:recordId` 기준으로 전환

### 백엔드

1. `GET /records`
2. `GET /records/:recordId`
3. `PUT /records/:recordId`
4. `DELETE /records/:recordId`
5. `GET /routines`, `POST /routines` 등 루틴 CRUD
6. JWT 인증 실제 구현
7. 민감정보 AES-256 암호화
8. Whisper STT 연동

### 제품/UX

1. 카카오 OAuth 실연동
2. 약관 동의
3. 홈 액션시트
4. 루틴 수정 / 삭제
5. 캘린더 확장

---

## 9. 다음 작업 추천 순서

가장 자연스러운 다음 작업:

1. `PUT /records/:recordId` 구현
2. 프론트 기록 상세의 `저장하기`를 실제 백엔드 수정 저장으로 연결
3. `GET /records/:recordId` 구현
4. 상세 화면을 local store 우선이 아니라 백엔드 데이터 기준으로 전환

즉 다음 라운드의 핵심 목표는:

**기록 생성뿐 아니라 기록 수정까지 실제 DB에 반영되게 만드는 것**

---

## 10. 자주 보는 핵심 파일

### 프론트

- `frontend/src/app/page.jsx`
- `frontend/src/app/(auth)/onboarding/page.jsx`
- `frontend/src/app/(main)/home/page.jsx`
- `frontend/src/app/routines/new/page.jsx`
- `frontend/src/app/record/new/page.jsx`
- `frontend/src/app/record/[recordId]/page.jsx`
- `frontend/src/components/record/NewRecordFlow.jsx`
- `frontend/src/stores/authStore.js`
- `frontend/src/stores/routineStore.js`
- `frontend/src/stores/recordStore.js`
- `frontend/src/lib/apiClient.js`

### 백엔드

- `backend/src/app.js`
- `backend/src/routes/records.js`
- `backend/src/models/Patient.js`
- `backend/src/models/Routine.js`
- `backend/src/models/Record.js`
- `backend/src/services/claudeService.js`
- `backend/src/services/structuredRecordSchema.js`
- `backend/src/config/env.js`

### 문서

- `docs/01_PRODUCT_SPEC_LITE.md`
- `docs/02_CORE_FLOW.md`
- `docs/03_SCREEN_MAP.md`
- `docs/04_AI_PROMPTS.md`
- `docs/HANDOFF.md`

---

## 11. 실행 방법

### 프론트

```powershell
Set-Location 'C:\Users\주원석\Documents\LOOMA\frontend'
npm run dev
```

### 백엔드

```powershell
Set-Location 'C:\Users\주원석\Documents\LOOMA\backend'
npm run dev
```

### 프론트 / 백엔드 동시 실행

```powershell
Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location 'C:\Users\주원석\Documents\LOOMA\backend'; npm run dev"; Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location 'C:\Users\주원석\Documents\LOOMA\frontend'; npm run dev"
```

---

## 12. 환경 변수 관련 메모

### 백엔드

- `.env` 위치:
  - `backend/.env`

기록 구조화 기준 필수:

```env
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5-mini
```

### 프론트

- `.env.local` 위치:
  - `frontend/.env.local`

현재 기본 API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

백엔드가 `/api/*` 호환 라우트를 받아주므로 이 상태로 동작 가능하다.

---

## 13. 주의 사항

1. 현재 기록 생성 결과 화면은 아직 mock 카드다.
   - 저장 후 홈/상세에서 보이는 데이터는 실제 백엔드 응답이다.

2. 현재 기록 수정 저장은 아직 로컬 store만 바꾼다.
   - DB 반영 아님

3. 현재 인증 미들웨어는 TODO 상태다.
   - local demo user 생성 로직이 임시 브리지 역할을 한다.

4. `Record.sections`, `summary`, `notes` 암호화는 아직 미구현이다.

5. 다음 세션에서 작업 시작 시 우선 읽을 문서:
   - `CLAUDE.md`
   - `docs/HANDOFF.md`
   - 필요 시 `docs/02_CORE_FLOW.md`, `docs/03_SCREEN_MAP.md`, `docs/04_AI_PROMPTS.md`
