import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import Pokedex          from './pages/Pokedex';
import QuizShadow       from './pages/QuizShadow';
import QuizType         from './pages/QuizType';
import MyPokedex        from './pages/MyPokedex';
import Home             from './pages/Home';
import About            from './pages/About';
import PrivacyPolicy    from './pages/PrivacyPolicy';
import TermsOfService   from './pages/TermsOfService';
import Contact          from './pages/Contact';
import Login            from './pages/Login';
import DailyChallenge   from './pages/DailyChallenge';
import QuizName         from './pages/QuizName';
import AchievementToast from './components/AchievementToast';

import { useAuthStore, AVATAR_EMOJIS } from './store/authStore';
import { useGameStore, isDailyAvailable } from './store/gameStore';

// ─── 내비게이션 링크 ────────────────────────────────────────
const NAV_LINKS = [
  { to: '/',            label: '🏠 홈' },
  { to: '/pokedex',     label: '📖 도감' },
  { to: '/quiz-shadow', label: '🔮 실루엣' },
  { to: '/quiz-type',   label: '⚡ 타입' },
  { to: '/quiz-name',   label: '📝 이름맞추기' },
  { to: '/mypokedex',   label: '🌟 나의 도감' },
  { to: '/daily',       label: '📅 오늘의 도전' },
];

// ─── 로그인 가드 ────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { trainer, loading } = useAuthStore();
  const location             = useLocation();

  if (loading) return null; // 인증 초기화 중 → 아무것도 렌더 안 함
  if (!trainer) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

// ─── 트레이너 드롭다운 ───────────────────────────────────────
function TrainerDropdown({ onClose }: { onClose: () => void }) {
  const { trainer, logout }                             = useAuthStore();
  const { score, capturedPokemon, unlockedAchievements, resetGameState } = useGameStore();
  if (!trainer) return null;

  const handleLogout = async () => {
    resetGameState();
    await logout();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="absolute right-0 top-full mt-2 w-64 bg-[#1a1a2e] border border-gray-600 rounded-[1.5rem] shadow-2xl z-50 overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* 프로필 헤더 */}
      <div className="p-4 bg-gradient-to-r from-[#CC0000] to-[#EE1515]">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{AVATAR_EMOJIS[trainer.avatarId]}</span>
          <div>
            <p className="font-black text-white text-lg leading-tight">{trainer.nickname}</p>
            <p className="text-red-200 text-xs">@{trainer.userId} · {trainer.region} 출신</p>
          </div>
        </div>
      </div>
      {/* 스탯 */}
      <div className="p-4 grid grid-cols-3 gap-2 border-b border-gray-700">
        <div className="text-center">
          <p className="text-yellow-400 font-black text-xl">{score}</p>
          <p className="text-gray-400 text-xs">점수</p>
        </div>
        <div className="text-center">
          <p className="text-white font-black text-xl">{capturedPokemon.length}</p>
          <p className="text-gray-400 text-xs">포획</p>
        </div>
        <div className="text-center">
          <p className="text-purple-400 font-black text-xl">{unlockedAchievements.length}</p>
          <p className="text-gray-400 text-xs">업적</p>
        </div>
      </div>
      <div className="p-3">
        <button
          onClick={handleLogout}
          className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-red-400 hover:bg-red-900/30 transition-colors text-left"
        >
          🚪 로그아웃
        </button>
      </div>
    </motion.div>
  );
}

// ─── 내비게이션 바 ───────────────────────────────────────────
function NavBar() {
  const location    = useLocation();
  const { trainer } = useAuthStore();
  const gameStore   = useGameStore();
  const [open, setOpen] = useState(false);
  const dailyAvail  = isDailyAvailable(gameStore);

  return (
    <nav className="w-full bg-[#CC0000] shadow-lg shadow-red-900/60 sticky top-0 z-50 border-b-4 border-[#aa0000]">
      {/* 로고 바 */}
      <div className="bg-[#EE1515] py-2 px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-white relative overflow-hidden shadow-lg flex-shrink-0">
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-red-600" />
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white" />
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-black -translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-white border-2 border-black rounded-full -translate-x-1/2 -translate-y-1/2" />
          </div>
          <span className="text-white text-xl font-black tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] hidden sm:block">
            포켓몬 퀴즈 &amp; 도감
          </span>
        </Link>

        {/* 트레이너 / 로그인 버튼 */}
        <div className="relative">
          {trainer ? (
            <button
              onClick={() => setOpen(o => !o)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-full transition-colors"
            >
              <span className="text-2xl">{AVATAR_EMOJIS[trainer.avatarId]}</span>
              <span className="text-white font-black text-sm hidden sm:block">{trainer.nickname}</span>
              <span className="text-white/70 text-xs">▼</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-black px-4 py-2 rounded-full text-sm transition-colors shadow-lg"
            >
              🔑 로그인
            </Link>
          )}

          <AnimatePresence>
            {open && trainer && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <TrainerDropdown onClose={() => setOpen(false)} />
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 링크 탭 */}
      <div className="flex overflow-x-auto">
        {NAV_LINKS.map(({ to, label }) => {
          const isActive = location.pathname === to;
          const isDaily  = to === '/daily';
          return (
            <Link
              key={to}
              to={to}
              className={`px-4 py-3 text-sm font-bold whitespace-nowrap transition-all border-b-4 relative
                ${isActive
                  ? 'bg-yellow-400 text-[#333] border-yellow-300'
                  : 'text-white border-transparent hover:bg-[#bb0000] hover:border-yellow-400'}`}
            >
              {label}
              {isDaily && dailyAvail && trainer && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ─── 앱 초기화 로딩 스피너 ───────────────────────────────────
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 rounded-full border-4 border-white relative overflow-hidden shadow-2xl animate-bounce">
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-red-600" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white" />
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-black -translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white border-2 border-black rounded-full -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="text-gray-400 font-bold animate-pulse">로딩 중...</p>
    </div>
  );
}

// ─── 앱 루트 ────────────────────────────────────────────────
function AppContent() {
  const { initAuth, loading } = useAuthStore();
  const { loadFromFirestore, resetGameState } = useGameStore();

  // Firebase 인증 상태 초기화
  useEffect(() => {
    const unsubscribe = initAuth(
      (uid) => { loadFromFirestore(uid); },
      ()    => { resetGameState(); }
    );
    return unsubscribe;
  }, []);

  if (loading) return <AuthLoadingScreen />;

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white flex flex-col">
      <Routes>
        {/* 로그인 — 전용 레이아웃 */}
        <Route path="/login" element={<Login />} />

        {/* 나머지 모든 페이지 */}
        <Route
          path="/*"
          element={
            <>
              <NavBar />
              <AchievementToast />
              <main className="flex-1 container mx-auto p-4 sm:p-6 w-full max-w-7xl">
                <Routes>
                  <Route path="/"            element={<RequireAuth><Home /></RequireAuth>} />
                  <Route path="/pokedex"     element={<RequireAuth><Pokedex /></RequireAuth>} />
                  <Route path="/quiz-shadow" element={<RequireAuth><QuizShadow /></RequireAuth>} />
                  <Route path="/quiz-type"   element={<RequireAuth><QuizType /></RequireAuth>} />
                  <Route path="/mypokedex"   element={<RequireAuth><MyPokedex /></RequireAuth>} />
                  <Route path="/quiz-name"   element={<RequireAuth><QuizName /></RequireAuth>} />
                  <Route path="/daily"       element={<RequireAuth><DailyChallenge /></RequireAuth>} />
                  <Route path="/about"       element={<About />} />
                  <Route path="/privacy"     element={<PrivacyPolicy />} />
                  <Route path="/terms"       element={<TermsOfService />} />
                  <Route path="/contact"     element={<Contact />} />
                </Routes>
              </main>
              <footer className="text-center py-4 text-sm text-gray-600 flex flex-col items-center space-y-2">
                <div className="space-x-4">
                  <Link to="/about"   className="hover:underline">소개</Link>
                  <Link to="/privacy" className="hover:underline">개인정보처리방침</Link>
                  <Link to="/terms"   className="hover:underline">이용약관</Link>
                  <Link to="/contact" className="hover:underline">문의하기</Link>
                </div>
                © 포켓몬 퀴즈 &amp; 도감 | 팬메이드
              </footer>
            </>
          }
        />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
