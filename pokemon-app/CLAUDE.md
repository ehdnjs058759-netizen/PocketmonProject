# pokemon-app — CLAUDE.md

루트의 [CLAUDE.md](../CLAUDE.md)를 먼저 읽어주세요. 이 파일은 앱 디렉터리 진입 시 빠른 참고용입니다.

## 빠른 시작

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # tsc + vite build (에러 없으면 성공)
npm run lint      # ESLint
```

## 핵심 임포트 경로

```typescript
import { REGIONS, MAX_POKEMON } from '../data/regions';
import { ACHIEVEMENTS }         from '../data/achievements';
import { useGameStore }         from '../store/gameStore';
import { useAuthStore }         from '../store/authStore';
import { getKoreanName, getKoreanNames } from '../api/koreanNames';
```

## 자주 쓰는 스토어 패턴

```typescript
// 게임 액션
const { addCaptured, recordCorrect, recordWrong, score, streak } = useGameStore();
recordCorrect(10);    // 10 × 연속배율 자동 계산
addCaptured(id);      // 중복 방지 + 업적 체크 자동

// 로그인 정보
const { trainer, login, register, logout } = useAuthStore();
if (!trainer) /* 미로그인 */
```

## 타입 퀴즈 핵심 (QuizType)

포켓몬의 **모든 타입**을 선택해야 정답.  
`buildOptions(correctTypes)` → 정답 타입 전부 + 오답으로 6개 버튼 구성.  
`handleCheck()` → `selected` Set과 `correctTypes` 배열 정확히 일치해야 통과.

## 라우팅 / 로그인 가드

`RequireAuth` 컴포넌트가 `trainer === null` 이면 `/login?state.from=경로` 로 리다이렉트.  
로그인 완료 후 `from` 경로로 자동 복귀.  
`/about`, `/privacy`, `/terms`, `/contact` 는 가드 없음.
