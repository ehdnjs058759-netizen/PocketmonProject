export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  condition: (state: { capturedPokemon: number[]; score: number; streak: number; totalCorrect: number; dailyDone: boolean }) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_catch',
    title: '첫 포켓몬 포획!',
    desc: '처음으로 포켓몬을 잡았어요!',
    icon: '🎉',
    condition: ({ capturedPokemon }) => capturedPokemon.length >= 1,
  },
  {
    id: 'catch_10',
    title: '포켓몬 탐험가',
    desc: '포켓몬 10마리를 잡았어요!',
    icon: '🌿',
    condition: ({ capturedPokemon }) => capturedPokemon.length >= 10,
  },
  {
    id: 'catch_50',
    title: '포켓몬 헌터',
    desc: '포켓몬 50마리를 잡았어요!',
    icon: '🏹',
    condition: ({ capturedPokemon }) => capturedPokemon.length >= 50,
  },
  {
    id: 'catch_151',
    title: '관동 마스터',
    desc: '관동 151마리를 모두 잡았어요!',
    icon: '👑',
    condition: ({ capturedPokemon }) => capturedPokemon.filter(id => id <= 151).length >= 151,
  },
  {
    id: 'streak_5',
    title: '연속 5연타!',
    desc: '퀴즈에서 5연속 정답을 맞췄어요!',
    icon: '🔥',
    condition: ({ streak }) => streak >= 5,
  },
  {
    id: 'streak_10',
    title: '10연속 정답!',
    desc: '퀴즈에서 10연속 정답을 맞췄어요!',
    icon: '⚡',
    condition: ({ streak }) => streak >= 10,
  },
  {
    id: 'score_100',
    title: '포인트 100!',
    desc: '총 100점을 획득했어요!',
    icon: '💯',
    condition: ({ score }) => score >= 100,
  },
  {
    id: 'score_500',
    title: '포인트 500!',
    desc: '총 500점을 획득했어요!',
    icon: '💎',
    condition: ({ score }) => score >= 500,
  },
  {
    id: 'score_1000',
    title: '포인트 1000!',
    desc: '총 1000점을 획득했어요! 전설적이에요!',
    icon: '🌟',
    condition: ({ score }) => score >= 1000,
  },
  {
    id: 'daily_done',
    title: '데일리 챌린저',
    desc: '오늘의 도전을 완료했어요!',
    icon: '📅',
    condition: ({ dailyDone }) => dailyDone,
  },
  {
    id: 'correct_100',
    title: '퀴즈 고수',
    desc: '퀴즈를 100번 맞췄어요!',
    icon: '🧠',
    condition: ({ totalCorrect }) => totalCorrect >= 100,
  },
];
