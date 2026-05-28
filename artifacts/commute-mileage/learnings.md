# commute-mileage — Learnings

---
category: tooling
applied: not-yet
---
## vitest가 Playwright e2e spec을 수집해 실패

**상황**: Step 3 Checkpoint A. `bun run test` 전체 실행 시 `e2e/smoke.spec.ts`가 "Playwright Test did not expect test() to be called here"로 실패. 필터 실행(`bun run test -- score`)에선 안 잡혀 늦게 발견.
**판단**: vitest 기본 include가 `.spec.ts`까지 먹는데 `vitest.config.ts` exclude에 `e2e/**`가 없었다. exclude에 `e2e/**` 추가. CLAUDE.md 규약(Vitest=`*.test.tsx`, Playwright=`e2e/*.spec.ts`)과 일치시킴.
**다시 마주칠 가능성**: 높음 — 이 템플릿으로 시작하는 모든 프로젝트가 동일 문제를 겪는다. 템플릿 자체 결함이라 `/compound`에서 템플릿 PR 또는 rule 승격 후보.

---
category: spec-ambiguity
applied: not-yet
---
## lib/date.ts (todaySeoul, formatKoreanDate) 추가 — plan 파일 목록 밖

**상황**: Step 3 Task 1. route handler가 "오늘"(Asia/Seoul) 날짜 키를 만들어야 하는데 plan 영향 파일 목록에 날짜 헬퍼가 없었다.
**판단**: `lib/date.ts`를 신설(Intl.DateTimeFormat en-CA로 YYYY-MM-DD). use-mileage·카드 포맷(YYYY년 M월 D일)에서도 재사용 예정이라 헬퍼로 분리. plan에 없던 파일이지만 Task 1 범위 내 자연스러운 보조.
**다시 마주칠 가능성**: 낮음 — feature 특유. 다만 "타임존 고정 날짜 키"는 다른 feature에서도 반복될 수 있음.

---
category: code-review
applied: not-yet
---
## gemini.ts에서 "server-only" import 생략

**상황**: Step 3 Task 2. AI 호출 모듈을 서버 전용으로 보호하려 `import "server-only"`를 고려했으나, route.test.ts(jsdom/vitest)가 route→gemini를 import하면 server-only가 throw해 테스트가 깨진다.
**판단**: server-only import를 생략하고 주석으로 "route handler에서만 import, 키는 process.env로만 읽음" 명시. gemini.ts가 클라이언트 컴포넌트에서 import되지 않는 한 키 노출 위험 없음(실제로 route.ts만 import).
**다시 마주칠 가능성**: 중간 — server-only 모듈을 테스트에서 import하는 충돌은 흔하다. vitest alias로 server-only를 빈 모듈로 매핑하는 패턴이 더 안전할 수 있음.

---
category: tooling
applied: not-yet
---
## claude-in-chrome 자동화에서 navigator.clipboard.writeText가 hang

**상황**: Step 3 Task 4. 공유 토스트를 실제 브라우저로 검증하려는데, 진짜 클릭에도 sonner 토스트가 안 떴다. JS로 타임아웃 레이스를 걸어보니 `navigator.clipboard.writeText`가 resolve도 reject도 안 하고 TIMEOUT(권한 프롬프트 대기로 추정).
**판단**: 코드 버그 아님 — 자동화 환경의 clipboard 권한 제약. `await writeText`가 pending이라 그 뒤 toast가 실행 안 됨. 실제 사용자 브라우저(secure context + 진짜 사용자 제스처)에선 정상. 공유 로직은 단위 테스트(clipboard.writeText 호출 인자 + toast.success 호출)로 증명하고, 시각 검증은 생략. handleShare는 try/catch로 실패 시 error 토스트도 띄우게 보강.
**다시 마주칠 가능성**: 높음 — clipboard·권한·user-activation 의존 기능은 이 자동화로 시각 검증이 불가. 단위 테스트(boundary mock)를 1차 증명으로 삼는 패턴 고정.

---
category: code-review
applied: not-yet
---
## radix Select 테스트용 jsdom 스텁 + 텍스트 충돌

**상황**: Step 3 Task 3. today-view 테스트에서 radix Select가 jsdom 미구현 API(hasPointerCapture·scrollIntoView·ResizeObserver)로 동작 안 함. 또 Empty 타이틀("도시를 선택하세요")이 Select placeholder와 텍스트가 겹쳐 findByText가 multiple match.
**판단**: vitest.setup.ts에 pointer/observer 스텁 추가. 단언은 겹치지 않는 고유 텍스트(EmptyDescription)로 변경. 공유 테스트는 userEvent.setup()이 자체 clipboard stub을 깔아 내 mock을 덮어써서, selectSeoul 이후 defineProperty + fireEvent.click으로 우회.
**다시 마주칠 가능성**: 높음 — radix 컴포넌트 + jsdom 조합은 모든 폼 테스트에서 재발. setup 스텁은 1회성이지만 "고유 텍스트로 단언", "userEvent clipboard 충돌"은 반복 함정.

---
category: code-review
applied: not-yet
---
## code-reviewer Important 2건 수용 (외부 데이터 결측·저장 실패)

**상황**: Step 4. code-reviewer가 Critical 0, Important 2건 보고: (1) Open-Meteo가 미래/미수집 시간대에 null을 줄 수 있는데 avgAtCommuteHours가 무방비라 NaN 점수 가능, (2) writeStore에 try/catch 없어 프라이빗 모드·용량 초과 시 영속화 실패.
**판단**: 둘 다 수용·즉시 수정. (1) 집계에서 number+finite만 picked, 결측은 0으로 처리 + 회귀 테스트 추가. (2) writeStore try/catch. Suggestion 중 외부 fetch 타임아웃·미사용 export 제거도 저비용이라 반영. 점수 상한(0~100 normalize)은 spec 미결정이라 보류.
**다시 마주칠 가능성**: 높음 — "외부 API 응답을 as 캐스팅만 하고 신뢰"하는 패턴은 모든 fetch 통합에서 재발. 경계에서 결측·타임아웃 방어를 기본값으로 삼을 것.

---
category: tooling
applied: not-yet
---
## 이미지 생성: Gemini 무료 일일 quota 소진 → Pollinations(무료·키 없음)로 전환

**상황**: 후속 기능(칭호별 캐릭터 일러스트). Gemini 이미지 모델(gemini-2.5-flash-image)을 키로 호출하니 429 `GenerateRequestsPerDayPerProjectPerModel-FreeTier` — 무료 티어 일일 이미지 quota가 작고 소진됨. 데모에서 대부분 막힘.
**판단**: Gemini 이미지 대신 Pollinations.ai(`image.pollinations.ai/prompt/<text>?seed=...`, 무료·키 없음) 채택. 서버 python 검증은 200/image/jpeg/1.3s로 통과. 칭호 해시를 seed로 써서 "같은 칭호=같은 그림, 다른 칭호=다른 그림". Claude는 이미지 생성 불가(텍스트 전용)라 후보 아님.
**다시 마주칠 가능성**: 높음 — 무료 LLM/이미지 키는 일일·분당 quota가 빡빡. 이미지가 필요하면 키 없는 무료 소스(Pollinations)나 결정적 생성(SVG)을 먼저 고려.

---
category: code-review
applied: not-yet
---
## 외부 이미지 hotlink 차단 — <img>는 되는데 특정 호스트만 실패 → referrerPolicy

**상황**: Pollinations 이미지가 서버 fetch(python)는 되는데 브라우저 <img>에선 즉시 onerror. picsum·placehold는 정상 → 호스트 특정 문제. referrerPolicy='no-referrer'로 즉시 해결됨(Referer 기반 hotlink 차단이었음).
**판단**: 외부 생성형 이미지를 <img>로 직접 띄울 때 hotlink 차단이 흔함. `referrerPolicy="no-referrer"`를 기본으로 붙인다. 안 되면 same-origin route handler 프록시가 다음 수단.
**다시 마주칠 가능성**: 높음 — 무료 이미지/CDN 호스트의 hotlink 보호는 흔하다. "서버는 되는데 브라우저 img만 실패"의 1순위 원인.

---
category: escalation
applied: not-yet
---
## AI 칭호 다양성(Must #2) 점검을 키 수령 시점으로 연기

**상황**: Checkpoint A. plan은 "키 설정 후 10회 호출 칭호 중복률 30% 이하"를 요구하나 GEMINI_API_KEY 미발급 상태.
**판단**: 사용자 자율 진행 지시에 따라 빌드를 막지 않고 진행. fallback 경로로 데이터→점수→칭호 파이프라인 end-to-end는 실제 dev 서버로 검증 완료(서울 score 12). AI 다양성은 키 수령 후 별도 수행하고 evidence 저장 예정.
**다시 마주칠 가능성**: 중간 — 외부 키 의존 검증은 graceful degrade로 설계하면 빌드 차단 없이 연기 가능하다는 패턴.
