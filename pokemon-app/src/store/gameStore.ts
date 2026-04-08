import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ACHIEVEMENTS } from '../data/achievements';

// ─── 타입 ──────────────────────────────────────────────────
interface GameData {
  capturedPokemon: number[];
  score: number;
  totalCorrect: number;
  totalWrong: number;
  streak: number;
  maxStreak: number;
  unlockedAchievements: string[];
  dailyChallengeDate: string;
  dailyChallengeCompleted: boolean;
}

interface GameState extends GameData {
  newAchievement: string | null;
  /** 현재 로그인된 uid (Firestore 동기화용) */
  syncUid: string | null;

  addCaptured: (id: number) => void;
  recordCorrect: (points?: number) => void;
  recordWrong: () => void;
  resetStreak: () => void;
  completeDailyChallenge: () => void;
  clearNewAchievement: () => void;

  /** 로그인 후 Firestore에서 게임 데이터 로드 */
  loadFromFirestore: (uid: string) => Promise<void>;
  /** 로그아웃 시 로컬 상태 초기화 */
  resetGameState: () => void;
}

// ─── 기본값 ────────────────────────────────────────────────
const DEFAULT_GAME_DATA: GameData = {
  capturedPokemon: [],
  score: 0,
  totalCorrect: 0,
  totalWrong: 0,
  streak: 0,
  maxStreak: 0,
  unlockedAchievements: [],
  dailyChallengeDate: '',
  dailyChallengeCompleted: false,
};

// ─── Firestore 저장 ────────────────────────────────────────
async function saveToFirestore(uid: string, data: GameData) {
  try {
    await setDoc(doc(db, 'users', uid, 'game', 'data'), data, { merge: true });
  } catch {
    // 네트워크 오류 시 무시 — 로컬 persist가 백업 역할
  }
}

// ─── 업적 체크 ────────────────────────────────────────────
function checkAchievements(state: GameState): string | null {
  const ctx = {
    capturedPokemon: state.capturedPokemon,
    score: state.score,
    streak: state.streak,
    totalCorrect: state.totalCorrect,
    dailyDone: state.dailyChallengeCompleted,
  };
  for (const ach of ACHIEVEMENTS) {
    if (!state.unlockedAchievements.includes(ach.id) && ach.condition(ctx)) {
      return ach.id;
    }
  }
  return null;
}

// ─── 스토어 ────────────────────────────────────────────────
export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_GAME_DATA,
      newAchievement: null,
      syncUid: null,

      // ── 포켓몬 포획 ──────────────────────────────────────
      addCaptured: (id) => {
        const state = get();
        if (state.capturedPokemon.includes(id)) return;
        const capturedPokemon = [...state.capturedPokemon, id];
        set({ capturedPokemon });

        const next = { ...get(), capturedPokemon };
        const newAch = checkAchievements(next as GameState);
        if (newAch) {
          const unlockedAchievements = [...next.unlockedAchievements, newAch];
          set({ unlockedAchievements, newAchievement: newAch });
          if (state.syncUid) saveToFirestore(state.syncUid, { ...next, unlockedAchievements });
        } else {
          if (state.syncUid) saveToFirestore(state.syncUid, next as GameData);
        }
      },

      // ── 정답 처리 ────────────────────────────────────────
      recordCorrect: (points = 10) => {
        const state = get();
        const streak = state.streak + 1;
        const bonus = streak >= 10 ? 3 : streak >= 5 ? 2 : 1;
        const score = state.score + points * bonus;
        const maxStreak = Math.max(state.maxStreak, streak);
        const totalCorrect = state.totalCorrect + 1;
        set({ score, streak, maxStreak, totalCorrect });

        const next = { ...get(), score, streak, maxStreak, totalCorrect };
        const newAch = checkAchievements(next as GameState);
        if (newAch) {
          const unlockedAchievements = [...next.unlockedAchievements, newAch];
          set({ unlockedAchievements, newAchievement: newAch });
          if (state.syncUid) saveToFirestore(state.syncUid, { ...next, unlockedAchievements });
        } else {
          if (state.syncUid) saveToFirestore(state.syncUid, next as GameData);
        }
      },

      // ── 오답 처리 ────────────────────────────────────────
      recordWrong: () => {
        set((s) => ({ totalWrong: s.totalWrong + 1, streak: 0 }));
        const state = get();
        if (state.syncUid) saveToFirestore(state.syncUid, state as GameData);
      },

      resetStreak: () => set({ streak: 0 }),

      // ── 데일리 챌린지 완료 ───────────────────────────────
      completeDailyChallenge: () => {
        const today = new Date().toISOString().slice(0, 10);
        set({ dailyChallengeDate: today, dailyChallengeCompleted: true });

        const state = get();
        const next = { ...state, dailyChallengeCompleted: true };
        const newAch = checkAchievements(next as GameState);
        if (newAch) {
          const unlockedAchievements = [...next.unlockedAchievements, newAch];
          set({ unlockedAchievements, newAchievement: newAch });
          if (state.syncUid) saveToFirestore(state.syncUid, { ...next, unlockedAchievements });
        } else {
          if (state.syncUid) saveToFirestore(state.syncUid, next as GameData);
        }
      },

      clearNewAchievement: () => set({ newAchievement: null }),

      // ── Firestore에서 로드 (로그인 후 호출) ─────────────
      loadFromFirestore: async (uid) => {
        set({ syncUid: uid });
        try {
          const snap = await getDoc(doc(db, 'users', uid, 'game', 'data'));
          if (snap.exists()) {
            const data = snap.data() as Partial<GameData>;
            set({
              capturedPokemon:        data.capturedPokemon        ?? [],
              score:                  data.score                  ?? 0,
              totalCorrect:           data.totalCorrect            ?? 0,
              totalWrong:             data.totalWrong              ?? 0,
              streak:                 data.streak                  ?? 0,
              maxStreak:              data.maxStreak               ?? 0,
              unlockedAchievements:   data.unlockedAchievements    ?? [],
              dailyChallengeDate:     data.dailyChallengeDate      ?? '',
              dailyChallengeCompleted: data.dailyChallengeCompleted ?? false,
            });
          }
        } catch {
          // 네트워크 오류 시 localStorage 캐시로 유지
        }
      },

      // ── 로그아웃 시 리셋 ─────────────────────────────────
      resetGameState: () => {
        set({ ...DEFAULT_GAME_DATA, newAchievement: null, syncUid: null });
      },
    }),
    { name: 'pokemon-game-store' }
  )
);

/** 오늘의 데일리 챌린지가 가능한지 확인 */
export function isDailyAvailable(store: GameState): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return store.dailyChallengeDate !== today;
}
