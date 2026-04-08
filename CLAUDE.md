# 포켓몬 퀴즈 & 도감 — CLAUDE.md

## 프로젝트 개요

팬메이드 포켓몬 퀴즈 & 도감 웹 앱.  
사용자가 로그인 후 실루엣 퀴즈, 타입 퀴즈, 오늘의 도전을 즐기고, 맞춘 포켓몬을 나만의 도감에 수집하는 게임.

---

## 디렉터리 구조

```
PocketmonProject/
├── pokemon-app/                  ← 메인 앱 (React + Vite)
│   ├── src/
│   │   ├── data/
│   │   │   ├── regions.ts        ← 9개 지방 공통 데이터 (MAX_POKEMON=1025)
│   │   │   └── achievements.ts   ← 11개 업적 정의
│   │   ├── store/
│   │   │   ├── authStore.ts      ← 계정(ID/PW) + 현재 로그인 트레이너
│   │   │   └── gameStore.ts      ← 점수·포획·업적·연속정답 (Zustand persist)
│   │   ├── api/
│   │   │   ├── koreanNames.ts    ← PokeAPI 한국어 이름 캐시
│   │   │   └── pokeapi.ts        ← PokeAPI axios 헬퍼
│   │   ├── pages/
│   │   │   ├── Login.tsx         ← ID/PW 로그인 + 회원가입 (2단계)
│   │   │   ├── Home.tsx          ← 홈 (트레이너 환영, 메뉴 카드, 데일리 배너)
│   │   │   ├── Pokedex.tsx       ← 전국 도감 (지방별 탭, 검색, 상세 모달)
│   │   │   ├── MyPokedex.tsx     ← 나의 도감 (지방별 탭 + 업적 + 통계)
│   │   │   ├── QuizShadow.tsx    ← 실루엣 퀴즈 (1~1025번, 4지선다)
│   │   │   ├── QuizType.tsx      ← 타입 퀴즈 (모든 타입 선택 + 확인)
│   │   │   └── DailyChallenge.tsx ← 오늘의 도전 (날짜 시드, 5문제)
│   │   ├── components/
│   │   │   └── AchievementToast.tsx ← 업적 달성 토스트
│   │   ├── App.tsx               ← 라우터 + 네비게이션 + 로그인 가드
│   │   └── index.css             ← 타입 색상, 이펙트 애니메이션
│   └── package.json
└── .claude/
    ├── agents/
    │   ├── pokemon-developer.md  ← 개발 전문 에이전트
    │   ├── pokemon-tester.md     ← QA 에이전트 (사용자 관점)
    │   ├── pokemon-ux.md         ← UX/디자인 에이전트
    │   └── pokemon-gamedesigner.md ← 게임 디자인 에이전트
    └── skills/
        ├── pokemon-development.md ← 개발 레시피
        └── pokemon-testing.md     ← 테스트 시나리오
```

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | React 18 + TypeScript |
| 빌드 | Vite 5 |
| 스타일 | Tailwind CSS v4 (`@import "tailwindcss"` 방식) |
| 애니메이션 | Framer Motion |
| 상태 관리 | Zustand + persist 미들웨어 |
| 외부 API | PokeAPI (https://pokeapi.co/api/v2) |
| 라우팅 | React Router v7 |
| 아이콘 | lucide-react |

---

## 개발 명령

```bash
cd pokemon-app
npm install          # 의존성 설치
npm run dev          # 개발 서버 → http://localhost:5173
npm run build        # 프로덕션 빌드 (tsc + vite)
npm run lint         # ESLint 검사
npm run preview      # 빌드 결과 미리보기
```

---

## 핵심 비즈니스 로직

### 인증 (authStore)
- 계정은 `pokemon-auth-store-v2` 키로 localStorage에 persist
- 비밀번호는 `simpleHash(password + userId)` 로 단방향 변환 (로컬 전용)
- 여러 계정 등록 가능, `accounts: Record<userId, Account>` 구조
- `trainer` 필드: 현재 로그인 트레이너 정보 (null = 미로그인)

### 게임 상태 (gameStore)
- `pokemon-game-store` 키로 persist (전체 공유 — 계정 분리 없음)
- **점수 배율**: 5연속 ×2, 10연속 ×3 — `recordCorrect(10)` 호출 시 자동 계산
- `addCaptured(id)`: 중복 자동 방지, 호출 후 업적 체크
- `newAchievement`: 방금 달성한 업적 id → AchievementToast가 소비 후 null로 초기화

### 라우팅 규칙
- `/login` 을 제외한 **모든 경로** → `RequireAuth` 가드 적용
- 미로그인 접근 시 `/login?from=원래경로` 로 리다이렉트
- 로그인 성공 후 `from` 경로로 복귀

### 타입 퀴즈 (QuizType) — 핵심 로직
- 포켓몬의 **모든 타입**(1개 또는 2개)을 정확히 선택해야 정답
- 옵션 구성: 정답 타입 전부 + 오답 타입으로 총 6개 버튼
- 듀얼 타입이면 "듀얼 타입 — 2개 선택!" 안내 표시
- "정답 확인" 버튼 클릭 후 판정

### 나의 도감 (MyPokedex)
- 도감 탭: `regions.ts`의 9개 지방 탭, 지방별 lazy load
- 캡처 안 된 포켓몬: 실루엣 + `???` 표시
- 캡처된 포켓몬: 이미지 + 한국어 이름 + 타입 뱃지

### 데일리 챌린지
- 날짜 문자열로 seededRandom → 매일 동일 5마리 출제
- `dailyChallengeDate === today` 이면 완료 상태
- 3문제 이상 정답 시 +50 보너스점

---

## 공유 데이터

### `src/data/regions.ts`
```typescript
REGIONS: Region[]    // 9개 지방 (id, name, sub, offset, limit, color, glow)
MAX_POKEMON: 1025    // 1세대~9세대 전체
```
Pokedex, MyPokedex, QuizShadow, QuizType 모두 이 파일을 import.

### `src/data/achievements.ts`
```typescript
ACHIEVEMENTS: Achievement[]   // 11개 업적 (id, title, desc, icon, condition)
```
condition 함수가 gameStore 상태를 받아 달성 여부 판단.

---

## 코딩 규칙

1. **스토어 직접 접근 금지** — localStorage 직접 읽기/쓰기 대신 Zustand 스토어 사용
2. **타입 any 금지** — PokemonData 인터페이스 등 명시적 타입 정의
3. **Tailwind 클래스만** — `style` prop은 동적 값(width %) 또는 외부 색상에만 사용
4. **Framer Motion** — 모든 새 컴포넌트에 `initial`/`animate` 적용
5. **PokeAPI 배치 처리** — `chunkSize = 20` 초과 금지 (rate limit)
6. **이미지 lazy loading** — 목록 이미지에 `loading="lazy"` 필수

---

## 에이전트 사용 가이드

| 작업 | 사용 에이전트 |
|------|--------------|
| 새 기능 구현, 버그 수정 | `pokemon-developer` |
| UX 검토, 디자인 개선 | `pokemon-ux` |
| 새 게임 모드, 밸런스 조정 | `pokemon-gamedesigner` |
| 기능 테스트, 버그 재현 | `pokemon-tester` |
| 코드 품질 리뷰 | `code-reviewer` (글로벌) |
| 빌드 에러 해결 | `build-error-resolver` (글로벌) |

---

## 알려진 제한 / TODO

- **계정별 게임 데이터 분리**: 현재 모든 계정이 동일 gameStore 공유. 추후 userId별 persist key 분리 필요
- **PokeAPI rate limit**: 대량 지방 로딩 시 429 에러 가능. 현재 chunkSize=20으로 완화
- **백엔드 없음**: 모든 데이터 localStorage persist — 브라우저 캐시 삭제 시 초기화
- **팔데아 일부 누락**: Gen 9 새 포켓몬(#1008~1025) 공식 아트워크 미지원 → front_default fallback
