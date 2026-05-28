# 출근 마일리지 (Commute Mileage) 구현 계획

## 아키텍처 결정

| 결정 | 선택 | 이유 |
|---|---|---|
| 환경 데이터 소스 | Open-Meteo `forecast` + `air-quality` 두 엔드포인트 (무인증) | 서울 좌표로 PM2.5/PM10/강수/풍속/UV 모두 결측 없이 응답 검증 완료. 키·CORS 비용 0. `wind_speed_unit=ms`로 m/s 수신. |
| 데이터+AI 결합 위치 | 단일 Route Handler `GET /api/commute?city=<id>` | AI 키를 서버에만 두기 위함. 데이터 fetch→점수→AI→fallback을 한 곳에서 처리해 클라이언트는 결과만 받는다. |
| AI 호출 | Gemini Flash REST (`generativelanguage.googleapis.com`) raw fetch, `GEMINI_API_KEY` | SDK 의존 추가 없이 server-only fetch. 키 없거나 실패 시 deterministic fallback으로 graceful degrade (Scenario 6) → 키 없어도 앱은 동작·시연 가능, 키 있으면 "AI 본체" 가치 발현. |
| 누적 저장 | 브라우저 `localStorage` (`commute-mileage:v1`), 날짜별 1 레코드 | 인증·DB 0. 같은 날 재방문 시 저장된 레코드를 그대로 사용해 점수·칭호 보존(Scenario 2). |
| 같은 날 잠금 | 클라이언트: 오늘 레코드 있으면 API 미호출, 저장값 사용 | 불변 규칙(같은 날 동일 값) 보장. fallback 결과도 저장돼 일관. |
| 캘린더 | 커스텀 월 그리드 (shadcn Card/Badge/Button 조합, 신규 dep 없음) | 셀마다 칭호 텍스트 렌더가 필요 — react-day-picker 커스텀보다 단순하고 wireframe과 정확히 일치. `components/ui/*`는 수정하지 않음(shadcn-guard 준수). |
| 점수 공식 | 07:00~10:00 평균의 가중합을 반올림한 비음수 정수 (0~100 normalize 안 함) | "오늘 난이도 47"이 직관적. 미결정(정수 변환) 해소. |

## 인프라 리소스

| 리소스 | 유형 | 선언 위치 | 생성 Task |
|---|---|---|---|
| `GEMINI_API_KEY` | Env var | 로컬 `.env.local` + Vercel 프로젝트 Environment Variables | Task 2 (없어도 fallback 동작) |

> **사용자 행동 필요(차단 아님)**: Google AI Studio(aistudio.google.com)에서 Gemini API 키를 발급해 `.env.local`에 `GEMINI_API_KEY=...` 추가. 미설정 시에도 앱은 fallback 칭호로 정상 동작하므로, 키는 execute 중 언제든 추가 가능. 배포 시 Vercel 환경변수에도 동일 등록 필요.

## 데이터 모델

### City (config 상수)
- id (required) — 예: `"seoul"`
- name (required) — 예: `"서울"`
- latitude, longitude (required)

### EnvSnapshot (07:00~10:00 평균)
- pm2_5, pm10, precipitation, windSpeed, uvIndex (required, number)
- severe (required, boolean) — weather_code가 뇌우/폭우/폭설 구간이면 true

### DayResult (localStorage 레코드, 날짜별)
- date (required) — `"YYYY-MM-DD"` (Asia/Seoul 기준)
- cityId, cityName (required)
- score (required, 비음수 정수)
- title (required) — 칭호
- narrative (required) — 1줄 서사
- source (required) — `"ai"` | `"fallback"`
- env (required) — EnvSnapshot

## 필요 스킬

| 스킬 | 적용 Task | 용도 |
|---|---|---|
| next-best-practices | 1, 2, 3, 5 | route-handlers(route.ts·GET), data-patterns(Promise.all 병렬 fetch), rsc-boundaries("use client" 경계), async searchParams, env |
| shadcn | 3, 4, 5 | Card 풀 조합·Select·Button·Badge(env pill)·Separator·Empty(미선택)·sonner(toast)·Skeleton(로딩). 시맨틱 토큰만, `components/ui/*` 직접 수정 금지 |
| vercel-react-best-practices | 3, 5 | 클라이언트 패칭·리렌더 최소화 |
| web-design-guidelines | 3 | 점수 카드 "캡쳐각" 인상 human review |

## 영향 받는 파일

| 파일 경로 | 변경 유형 | 관련 Task |
|---|---|---|
| `types/commute.ts` | New | 1 |
| `config/cities.ts` | New | 1 |
| `lib/score.ts` | New | 1 |
| `lib/open-meteo.ts` | New | 1 |
| `lib/score.test.ts` | New | 1 |
| `app/api/commute/route.ts` | New | 1, 2 |
| `app/api/commute/route.test.ts` | New | 1, 2 |
| `lib/title-fallback.ts` | New | 2 |
| `lib/gemini.ts` | New | 2 |
| `lib/title-fallback.test.ts` | New | 2 |
| `hooks/use-mileage.ts` | New | 3, 5 |
| `hooks/use-mileage.test.ts` | New | 3, 5 |
| `components/commute/city-select.tsx` | New | 3 |
| `components/commute/score-card.tsx` | New | 3, 4 |
| `components/commute/today-view.tsx` | New | 3 |
| `components/commute/today-view.test.tsx` | New | 3, 4 |
| `components/commute/commute-nav.tsx` | New | 3 |
| `app/page.tsx` | Modify | 3 |
| `components/commute/mileage-calendar.tsx` | New | 5 |
| `components/commute/mileage-view.tsx` | New | 5 |
| `components/commute/mileage-view.test.tsx` | New | 5 |
| `app/mileage/page.tsx` | New | 5 |
| `components/ui/sonner.tsx` (shadcn add) | New | 4 |
| `components/ui/empty.tsx` (shadcn add) | New | 3 |

## Tasks

### Task 1: 도시 선택 → 환경 데이터 → 점수 산출 API ✅ 완료

- **담당 시나리오**: Scenario 1 (partial — 점수·날짜·도시 부분), Scenario 5 (full — 데이터 fetch 실패)
- **크기**: M
- **의존성**: None (고위험 1순위 — 외부 데이터·점수 코어)
- **참조**:
  - (next-best-practices — route-handlers, data-patterns Promise.all, async searchParams)
  - Open-Meteo forecast: `https://api.open-meteo.com/v1/forecast?latitude=&longitude=&hourly=precipitation,wind_speed_10m,uv_index,weather_code&wind_speed_unit=ms&timezone=Asia%2FSeoul&forecast_days=1`
  - Open-Meteo air-quality: `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=&longitude=&hourly=pm10,pm2_5&timezone=Asia%2FSeoul&forecast_days=1`
- **구현 대상**:
  - `types/commute.ts`, `config/cities.ts` (서울/부산/대구/인천/광주/대전/울산/세종 8곳 + 좌표)
  - `lib/open-meteo.ts` (두 엔드포인트 병렬 fetch, 07:00~10:00 평균 추출, severe 판정)
  - `lib/score.ts` (`score(env) = round(pm2_5*0.5 + pm10*0.3 + precipitation*1.5 + windSpeed*1.0 + uvIndex*1.0 + (severe?20:0))`, 비음수)
  - `lib/score.test.ts`, `app/api/commute/route.ts`, `app/api/commute/route.test.ts`
- **수용 기준**:
  - [ ] `lib/score`: 알려진 EnvSnapshot 입력 → 기대 정수 점수 (가중치 공식대로, 예: pm2_5=47,pm10=40,비0,풍속3,uv4,severe=false → 47*0.5+40*0.3+0+3+4 = round(42.5)=43)
  - [ ] `lib/score`: severe=true 입력 → 동일 입력 대비 +20 큰 점수
  - [ ] `GET /api/commute?city=seoul` (Open-Meteo fetch 모킹) → `200` + `{ score: <비음수 정수>, env, date, cityName: "서울" }`
  - [ ] `GET /api/commute?city=unknown` → `400` (유효하지 않은 도시)
  - [ ] Open-Meteo fetch 실패(모킹) → `502` + `{ error: ... }` (점수·env 없음)
- **검증**: `bun run test -- score`, `bun run test -- api/commute`; `bun run build`

---

### Task 2: AI 칭호·서사 생성 + 실패 시 기본 칭호 fallback

- **담당 시나리오**: Scenario 1 (partial — 칭호·서사 부분), Scenario 6 (full — AI 실패 fallback)
- **크기**: M
- **의존성**: Task 1 (route handler·EnvSnapshot 타입에 얹음) — 고위험 2순위(AI 다양성)
- **참조**:
  - (next-best-practices — route-handlers 환경, runtime-selection Node 런타임)
  - Gemini REST: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent` (header `x-goog-api-key: $GEMINI_API_KEY`)
- **구현 대상**:
  - `lib/title-fallback.ts` (점수 구간별 기본 칭호+서사: 예 0–30 "맑은 길의 산책자" / 31–60 "끈기의 출근자" / 61+ "역경의 출근자", 점수 기반 1줄)
  - `lib/gemini.ts` (server-only; 점수+env 컨텍스트 → `{title, narrative}`; 키 없거나 실패/타임아웃 시 throw)
  - `app/api/commute/route.ts` (Gemini 호출, 실패 시 title-fallback 사용, 응답에 `source: "ai"|"fallback"` 포함)
  - `lib/title-fallback.test.ts`, `app/api/commute/route.test.ts` 확장
- **수용 기준**:
  - [ ] `title-fallback`: 점수 20 → 낮은 구간 칭호 문자열 + 1줄 서사(마침표 포함) 반환
  - [ ] `title-fallback`: 점수 75 → 높은 구간 칭호(20점대와 다른 문자열) 반환
  - [ ] `GET /api/commute` (Gemini 모킹 성공) → 응답 `title`·`narrative`가 모킹된 AI 값, `source: "ai"`
  - [ ] `GET /api/commute` (Gemini 모킹 실패) → 응답에 점수 정상 + `title`·`narrative`는 fallback 값, `source: "fallback"`, 본문에 "에러"/"실패" 문자열 없음
  - [ ] `GEMINI_API_KEY` 미설정 → fallback 경로로 `200` 응답 (`source: "fallback"`)
- **검증**: `bun run test -- title-fallback`, `bun run test -- api/commute`; `bun run build`. (칭호 다양성=Must #2는 Checkpoint A에서 수동 10회 호출로 별도 점검)

---

### Checkpoint: Tasks 1-2 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] dev 서버에서 `GET /api/commute?city=seoul` 실제 호출 → 점수+칭호+서사 JSON 반환 (키 있으면 `source:"ai"`, 없으면 `"fallback"`)
- [ ] **Must #2 점검**: 키 설정 후 같은 도시로 10회 호출 → 칭호 중복률 30% 이하 확인. 초과 시 Task 2 프롬프트(어휘 풀·다양성 지시) 재튜닝. 증거 `artifacts/commute-mileage/evidence/checkpoint-a-titles.txt`

---

### Task 3: 메인 페이지 — 도시 선택 + 점수 카드 (+ 같은 날 보존)

- **담당 시나리오**: Scenario 1 (full UI), Scenario 2 (full — 같은 날 재방문 보존), Scenario 3 (partial — 날짜 변경 시 새 레코드 생성 트리거), Scenario 5 (full — 에러 UI), Scenario 6 (full — fallback 카드)
- **크기**: M
- **의존성**: Task 2 (`/api/commute` 완성 payload 소비)
- **참조**:
  - (shadcn — Card 풀 조합, Select+SelectGroup+SelectItem, Button, Badge, Separator, Empty, Skeleton; 시맨틱 토큰)
  - (next-best-practices — rsc-boundaries "use client")
  - (vercel-react-best-practices — 클라이언트 패칭)
  - `artifacts/commute-mileage/wireframe.html` (메인 기본/초기/에러/fallback 화면), `components/ui/select.tsx`, `components/ui/card.tsx`
- **구현 대상**:
  - `hooks/use-mileage.ts` (오늘 레코드 read/write; 오늘 레코드 있으면 그대로 반환·API 미호출, 없으면 `/api/commute` 호출 후 저장. "오늘"은 Asia/Seoul 날짜 키 — 날짜가 바뀌면 새 레코드 트리거)
  - `components/commute/city-select.tsx`, `components/commute/score-card.tsx`, `components/commute/commute-nav.tsx`(오늘/마일리지 탭), `components/commute/today-view.tsx`(클라이언트 컴포넌트, 상태 조합)
  - 환경 리본: score-card 하단에 EnvSnapshot(pm2_5·pm10·precipitation·windSpeed·uvIndex·severe)을 Badge 5~6개로 표시 (wireframe "오늘의 적군" 리본)
  - 로딩: 데이터 대기 중 Skeleton (점수·칭호 자리)
  - rotate-cw 아이콘 버튼은 **범위 제외** — 같은 날 잠금과 모순. 카드 액션은 "카드 공유"만(Task 4). 도시 변경은 드롭다운이 담당.
  - `app/page.tsx` (today-view 렌더), `hooks/use-mileage.test.ts`, `components/commute/today-view.test.tsx`
  - `bunx --bun shadcn@latest add empty` (미선택 빈 상태)
- **수용 기준**:
  - [ ] 도시 미선택 진입 → "도시를 선택하세요" 안내(Empty)와 점수 카드 미표시
  - [ ] "서울" 선택(`/api/commute` 모킹) → 카드에 오늘 날짜(`2026년 5월 28일` 형식)·"서울"·정수 점수·칭호·1줄 서사가 모두 표시
  - [ ] 카드 하단 환경 리본에 PM2.5·PM10·강수·풍속·UV·특보 값이 표시됨
  - [ ] 도시 선택 후 데이터 대기 동안 Skeleton 표시 → 응답 수신 후 1초 이내 점수·날짜·도시가 카드에 렌더 (loading 시작~카드 렌더 단언 또는 Browser MCP 측정)
  - [ ] 점수 카드 전체가 360×640px viewport에서 잘림 없이 표시됨 (Browser MCP 모바일 시뮬레이션, 증거 스크린샷)
  - [ ] 카드 표시 후 컴포넌트 재마운트(리로드 시뮬레이션) → 동일 점수·칭호·서사 (API 재호출 없음)
  - [ ] `/api/commute` 실패 응답 모킹 → "환경 데이터를 받지 못했어요…" 메시지 + "다시 시도" 버튼 표시, 누적 미기록
  - [ ] "다시 시도" 버튼 클릭 → `/api/commute` 재요청이 발생 (fetch 호출 횟수 증가 단언)
  - [ ] `source:"fallback"` 응답 모킹 → 카드에 점수+fallback 칭호 표시, "에러"/"실패" 문구 없음
  - [ ] 카드 발급 시 레코드는 localStorage에만 기록되고, 어떤 네트워크 요청 본문에도 레코드가 POST되지 않음 (프라이버시 불변 규칙)
- **검증**: `bun run test -- today-view`, `bun run test -- use-mileage`; Browser MCP — `/`에서 도시 선택→카드 확인 + 360×640 모바일 잘림 확인, 증거 `artifacts/commute-mileage/evidence/task-3-card.png`; web-design-guidelines로 카드 인상 human review

---

### Task 4: 카드 공유 — 클립보드 복사 + 토스트

- **담당 시나리오**: Scenario 7 (full)
- **크기**: S
- **의존성**: Task 3 (score-card에 동작 추가)
- **참조**:
  - (shadcn — sonner toast)
  - `components/commute/score-card.tsx`
- **구현 대상**:
  - `bunx --bun shadcn@latest add sonner` + `app/layout.tsx`에 `<Toaster/>` 1회 마운트
  - `score-card.tsx` 공유 버튼 핸들러(`navigator.clipboard.writeText`), `components/commute/today-view.test.tsx` 확장
- **수용 기준**:
  - [ ] "카드 공유" 클릭 → 클립보드 텍스트에 오늘 날짜·도시명·점수·칭호·서사가 모두 포함 (clipboard 모킹으로 단언)
  - [ ] 클릭 후 "복사되었어요"(또는 동등) 토스트가 표시되고 1~2초(sonner 기본 duration) 후 사라짐
- **검증**: `bun run test -- today-view`; Browser MCP — 공유 클릭→토스트 확인, 증거 `artifacts/commute-mileage/evidence/task-4-toast.png`

---

### Checkpoint: Tasks 3-4 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] dev 서버에서 메인 페이지: 도시 선택→카드→공유까지 end-to-end 동작, 새로고침 시 같은 날 카드 보존

---

### Task 5: 마일리지 누적 + 캘린더 페이지

- **담당 시나리오**: Scenario 3 (full — 다음날 새 점수+누적 증가), Scenario 4 (full — 캘린더+통계)
- **크기**: M
- **의존성**: Task 3 (use-mileage 레코드 구조 재사용)
- **참조**:
  - (shadcn — Card, Badge, Button; 커스텀 월 그리드)
  - (next-best-practices — file-conventions app/mileage/page.tsx)
  - `artifacts/commute-mileage/wireframe.html` (마일리지 화면)
- **구현 대상**:
  - `hooks/use-mileage.ts` 확장 (전체 레코드 집계: 총 출근일·누적 점수 합·날짜별 맵)
  - `components/commute/mileage-calendar.tsx` (월 그리드, 기록일 셀에 칭호, 오늘 셀 강조, 월 prev/next)
  - `components/commute/mileage-view.tsx`, `app/mileage/page.tsx`, `components/commute/mileage-view.test.tsx`
- **수용 기준**:
  - [ ] 3일치 레코드 seed → "총 출근일 3일", "누적 점수 = 세 점수 합"이 표시
  - [ ] 기록 있는 일자 셀에 칭호 텍스트 표시, 기록 없는 일자 셀에는 칭호 없음
  - [ ] 2일치 레코드(날짜 A↔칭호 X, 날짜 B↔칭호 Y) seed → 날짜 A 셀은 칭호 X, 날짜 B 셀은 칭호 Y가 각각 표시 (날짜 키 독립 단언, Scenario 3)
  - [ ] 오늘 일자 셀이 시각적으로 강조(테두리 강조)됨
  - [ ] 레코드 1건 추가 후 재집계 → 총 출근일 +1, 누적 점수가 추가 점수만큼 증가
  - [ ] "오늘" 탭/버튼 → 메인(`/`)으로 이동
- **검증**: `bun run test -- mileage-view`, `bun run test -- use-mileage`; Browser MCP — `/mileage` 캘린더 확인, 증거 `artifacts/commute-mileage/evidence/task-5-calendar.png`

---

### Checkpoint: Tasks 1-5 이후 (전체)
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] spec 7개 시나리오 end-to-end 수동 확인 (도시 선택→카드→공유→마일리지 누적→에러/ fallback 경로)
- [ ] (배포 시) Vercel에 `GEMINI_API_KEY` 등록 후 프로덕션에서 `source:"ai"` 확인

## 미결정 항목

- **같은 날 도시 변경 처리** — 현재 가정 (a) 첫 점수 보존: 같은 날 다른 도시 선택 시에도 그날 저장된 카드 유지. execute Task 3에서 실제 UX 확인 후 (b) 도시별 재계산이 더 자연스러우면 재논의. 1차는 (a).
- **마일리지 = 합계 vs 레벨/배지** — 1차 단순 합계. 시간 여유 시 레벨/배지 스트레치 (범위 외).
