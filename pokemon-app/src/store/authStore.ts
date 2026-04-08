import { create } from 'zustand';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// ─── 상수 ─────────────────────────────────────────────────
export const AVATAR_EMOJIS = ['🧢', '👓', '🌸', '⭐', '🌙', '💎', '🖊️', '♦️'];
export const AVATAR_NAMES  = ['빨강', '파랑', '리프', '골드', '실버', '다이아', '블랙', '루비'];
export const REGIONS_KO    = [
  '관동', '성도', '호연', '신오', '하나', '칼로스', '알로라', '가라르', '팔데아',
];

// ─── 타입 ──────────────────────────────────────────────────
export interface TrainerProfile {
  uid: string;        // Firebase Auth UID
  userId: string;     // 사용자가 설정한 로그인 ID
  nickname: string;
  avatarId: number;
  region: string;
  createdAt: number;
}

// userId → Firebase Auth 이메일 변환
const toEmail = (userId: string) => `${userId.toLowerCase()}@pokemon-quiz.app`;

// 세션 유효 기간: 30일
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_KEY = 'pokemon-login-time';

function saveLoginTime()   { localStorage.setItem(SESSION_KEY, Date.now().toString()); }
function clearLoginTime()  { localStorage.removeItem(SESSION_KEY); }
function isSessionExpired(): boolean {
  const t = localStorage.getItem(SESSION_KEY);
  if (!t) return true;
  return Date.now() - Number(t) > SESSION_MS;
}

// Firebase 에러코드 → 한국어 메시지
function parseFirebaseError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':   return '이미 사용 중인 ID예요!';
    case 'auth/user-not-found':         return '존재하지 않는 ID예요!';
    case 'auth/wrong-password':         return '비밀번호가 틀렸어요!';
    case 'auth/invalid-credential':     return 'ID 또는 비밀번호가 틀렸어요!';
    case 'auth/invalid-email':          return '유효하지 않은 ID 형식이에요!';
    case 'auth/too-many-requests':      return '잠시 후 다시 시도해주세요!';
    case 'auth/network-request-failed': return '네트워크 오류가 발생했어요!';
    default:                            return '오류가 발생했어요. 다시 시도해주세요.';
  }
}

// ─── 스토어 타입 ────────────────────────────────────────────
interface AuthState {
  trainer: TrainerProfile | null;
  /** Firebase auth 초기화 대기 중이면 true */
  loading: boolean;

  /** ID 사용 가능 여부 확인 (Firestore usernames 컬렉션 조회) */
  checkUserId(userId: string): Promise<{ available: boolean; error?: string }>;

  register(
    userId: string, password: string,
    nickname: string, avatarId: number, region: string
  ): Promise<{ success: boolean; error?: string }>;

  login(
    userId: string, password: string
  ): Promise<{ success: boolean; error?: string }>;

  logout(): Promise<void>;

  initAuth(
    onLogin: (uid: string) => void,
    onLogout: () => void
  ): () => void;
}

// ─── 스토어 ────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()((set) => ({
  trainer: null,
  loading: true, // onAuthStateChanged 첫 응답 전까지 true

  // ── ID 중복 확인 ─────────────────────────────────────────
  checkUserId: async (userId) => {
    const id = userId.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]{4,20}$/.test(id))
      return { available: false, error: 'ID: 영문·숫자·_ 4~20자' };
    try {
      const snap = await getDoc(doc(db, 'usernames', id));
      if (snap.exists()) return { available: false, error: '이미 사용 중인 ID예요!' };
      return { available: true };
    } catch {
      return { available: false, error: '확인 중 오류가 발생했어요.' };
    }
  },

  // ── 회원가입 ─────────────────────────────────────────────
  register: async (userId, password, nickname, avatarId, region) => {
    const id   = userId.trim().toLowerCase();
    const nick = nickname.trim();

    if (!/^[a-zA-Z0-9_]{4,20}$/.test(id))
      return { success: false, error: 'ID: 영문·숫자·_ 4~20자' };
    if (password.length < 6)
      return { success: false, error: '비밀번호는 6자 이상이어야 해요!' };
    if (nick.length < 2 || nick.length > 12)
      return { success: false, error: '닉네임은 2~12자로 해주세요!' };
    if (id === nick.toLowerCase())
      return { success: false, error: 'ID와 닉네임을 다르게 설정해주세요!' };

    // Firestore에서 ID 중복 재확인 (경쟁 조건 방지)
    try {
      const existing = await getDoc(doc(db, 'usernames', id));
      if (existing.exists()) return { success: false, error: '이미 사용 중인 ID예요!' };
    } catch {
      return { success: false, error: '네트워크 오류가 발생했어요!' };
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, toEmail(id), password);
      const profile: TrainerProfile = {
        uid: cred.user.uid,
        userId: id,
        nickname: nick,
        avatarId,
        region,
        createdAt: Date.now(),
      };
      // 프로필 + 아이디 예약 동시 저장
      await Promise.all([
        setDoc(doc(db, 'users', cred.user.uid), profile),
        setDoc(doc(db, 'usernames', id), { uid: cred.user.uid }),
      ]);
      set({ trainer: profile });
      saveLoginTime();
      return { success: true };
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? '';
      const msg  = (e as { message?: string }).message ?? '';
      console.error('[register error]', code, msg);
      return { success: false, error: parseFirebaseError(code) || msg };
    }
  },

  // ── 로그인 ───────────────────────────────────────────────
  login: async (userId, password) => {
    const id = userId.trim().toLowerCase();
    try {
      const cred = await signInWithEmailAndPassword(auth, toEmail(id), password);
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (!snap.exists()) return { success: false, error: '프로필을 찾을 수 없어요!' };
      set({ trainer: snap.data() as TrainerProfile });
      saveLoginTime();
      return { success: true };
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? '';
      return { success: false, error: parseFirebaseError(code) };
    }
  },

  // ── 로그아웃 ─────────────────────────────────────────────
  logout: async () => {
    await signOut(auth);
    clearLoginTime();
    set({ trainer: null });
  },

  // ── 앱 시작 시 인증 상태 복원 ────────────────────────────
  initAuth: (onLogin, onLogout) => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 세션 만료 확인 (30일)
        if (isSessionExpired()) {
          await signOut(auth);
          clearLoginTime();
          set({ trainer: null, loading: false });
          onLogout();
          return;
        }
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            set({ trainer: snap.data() as TrainerProfile, loading: false });
            onLogin(user.uid);
          } else {
            await signOut(auth);
            clearLoginTime();
            set({ trainer: null, loading: false });
            onLogout();
          }
        } catch {
          set({ trainer: null, loading: false });
          onLogout();
        }
      } else {
        set({ trainer: null, loading: false });
        onLogout();
      }
    });
  },
}));
