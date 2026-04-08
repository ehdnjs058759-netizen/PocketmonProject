---
name: pokemon-development
description: Pokemon Quiz & Pokedex 개발 패턴과 레시피. 새 기능 추가, 컴포넌트 작성, 스토어 연동 시 참조하세요.
---

# Pokemon Development Skill

## 빠른 시작

### 새 퀴즈 페이지 추가하기
```tsx
// 1. src/pages/QuizXXX.tsx 생성
import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { motion } from 'framer-motion';

export default function QuizXXX() {
  const { recordCorrect, recordWrong, addCaptured, score, streak } = useGameStore();
  // ...
}

// 2. App.tsx에 라우트 추가
<Route path="/quiz-xxx" element={<RequireTrainer><QuizXXX /></RequireTrainer>} />

// 3. NAV_LINKS에 추가
{ to: '/quiz-xxx', label: '🆕 새 퀴즈' }
```

### 새 업적 추가하기
```typescript
// src/data/achievements.ts에 추가
{
  id: 'new_achievement',
  title: '업적 이름',
  desc: '달성 조건 설명',
  icon: '🏅',
  condition: ({ capturedPokemon, score, streak, totalCorrect, dailyDone }) => {
    return /* 조건 */;
  },
}
```

### PokeAPI 데이터 가져오기
```typescript
// 단일 포켓몬
const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
const data = await res.json();

// 한국어 이름 (캐시 활용)
import { getKoreanName, getKoreanNames } from '../api/koreanNames';
const name = await getKoreanName(id);            // 단일
const names = await getKoreanNames([1,2,3,4]);   // 복수 (배치 처리)

// 진화 체인
const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}/`);
const speciesData = await speciesRes.json();
const evolutionChainUrl = speciesData.evolution_chain.url;
```

### Zustand 스토어 사용 패턴
```typescript
// 점수 기록 (연속 보너스 자동 적용)
const { recordCorrect, recordWrong } = useGameStore();
recordCorrect(10);  // 10점 × 연속 배율
recordWrong();      // 연속 초기화

// 포획 등록 (중복 자동 방지)
addCaptured(pokemonId);

// 읽기 전용 데이터
const { score, streak, maxStreak, capturedPokemon, unlockedAchievements } = useGameStore();
```

### 타입 이펙트 트리거
```typescript
const triggerEffect = (cls: string) => {
  setEffectClass('');
  requestAnimationFrame(() => requestAnimationFrame(() => setEffectClass(cls)));
};

// 정답 시
triggerEffect(`effect-${pokemon.types[0].type.name}`);
// 오답 시
triggerEffect('effect-wrong');
```

## 컴포넌트 레시피

### 포켓몬 카드 (기본)
```tsx
<div className="bg-[#1a1a2e] border border-gray-700/50 rounded-[1.5rem] p-4 flex flex-col items-center cursor-pointer pokemon-card">
  <img src={imageUrl} alt={name} className="w-24 h-24 object-contain drop-shadow-lg" loading="lazy" />
  <p className="text-base font-black mt-3 text-white">{koreanName}</p>
  <div className="flex gap-1 mt-2">
    {types.map(t => (
      <span key={t} className={`type-${t} text-xs font-bold px-2 py-0.5 rounded-full text-white`}>
        {TYPE_KO[t]}
      </span>
    ))}
  </div>
</div>
```

### 점수 배너
```tsx
<div className="flex gap-4 mb-8 flex-wrap justify-center">
  <div className="bg-[#1a1a2e] rounded-2xl px-6 py-3 text-center border border-yellow-500/30">
    <p className="text-xs text-gray-400 font-bold">총 점수</p>
    <p className="text-2xl font-black text-yellow-400">{score}</p>
  </div>
</div>
```

### 로딩 스피너
```tsx
{loading && <div className="pokeball-spin" />}
```

## 주의 사항
- PokeAPI max concurrent requests: 20개 (`chunkSize = 20`)
- 이미지 lazy loading 필수 (`loading="lazy"`)
- 퀴즈 중복 클릭 방지: `disabled={status !== 'playing'}`
- Tailwind v4 사용 중: `@import "tailwindcss"` 방식
