import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { getKoreanName } from '../api/koreanNames';
import { MAX_POKEMON } from '../data/regions';

// ── 상수 ──────────────────────────────────────────────────────
const QUIZ_COUNTS = [30, 50, 100] as const;
type QuizCount = typeof QUIZ_COUNTS[number];
const TIME_LIMIT = 5; // 초

// ── 결과 등급 ──────────────────────────────────────────────────
interface Grade {
  label: string;
  sub: string;
  emoji: string;
  color: string;
  particleEmojis: string[];
}

function getGrade(correct: number, total: number): Grade {
  const pct = correct / total;
  if (pct === 1)      return { label: '포켓몬 마스터!!', sub: '완벽해요! 당신이 바로 전설!', emoji: '🏆', color: 'text-yellow-400', particleEmojis: ['🏆','⭐','✨','🎊','🎉'] };
  if (pct >= 0.9)     return { label: '전설의 트레이너!', sub: '거의 완벽! 최강 트레이너!', emoji: '👑', color: 'text-yellow-300', particleEmojis: ['👑','✨','⭐','🎉','💫'] };
  if (pct >= 0.7)     return { label: '베테랑 트레이너!', sub: '대단해요! 포켓몬 박사급!', emoji: '🌟', color: 'text-blue-400', particleEmojis: ['🌟','✨','⭐','💙','🎊'] };
  if (pct >= 0.5)     return { label: '성장하는 트레이너!', sub: '절반 이상! 조금만 더!', emoji: '🔥', color: 'text-orange-400', particleEmojis: ['🔥','💪','⭐','✨','😤'] };
  if (pct >= 0.3)     return { label: '열심히 연습 중!', sub: '포켓몬을 더 공부해봐요!', emoji: '📚', color: 'text-green-400', particleEmojis: ['📚','💪','🌱','✨','😊'] };
  return               { label: '다시 도전!', sub: '포켓몬 도감을 먼저 읽어봐요!', emoji: '😅', color: 'text-gray-400', particleEmojis: ['💪','🌱','😅','📖','✨'] };
}

// ── 무작위 섞기 ────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getRandomIds(count: number): number[] {
  const all = Array.from({ length: MAX_POKEMON }, (_, i) => i + 1);
  return shuffle(all).slice(0, count);
}

// ── 정답 판정: 한국어 또는 영문 허용, 공백·대소문자 무시 ──────
function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, '');
}

// ── 타입 ──────────────────────────────────────────────────────
interface PokemonInfo {
  id: number;
  engName: string;
  koName: string;
  imageUrl: string;
}

type Phase = 'select' | 'playing' | 'results';
type AnswerStatus = 'loading' | 'answering' | 'correct' | 'wrong' | 'timeout';

interface AnswerRecord {
  id: number;
  koName: string;
  imageUrl: string;
  correct: boolean;
  userInput: string;
  timedOut: boolean;
}

// ── 컴포넌트 ──────────────────────────────────────────────────
export default function QuizName() {
  const navigate = useNavigate();
  const { addCaptured, recordCorrect, recordWrong } = useGameStore();

  // ── 페이즈 ──
  const [phase, setPhase] = useState<Phase>('select');
  const [quizCount, setQuizCount] = useState<QuizCount>(30);

  // ── 문제 데이터 ──
  const [questionIds, setQuestionIds] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentInfo, setCurrentInfo] = useState<PokemonInfo | null>(null);

  // ── 답변 상태 ──
  const [status, setStatus] = useState<AnswerStatus>('loading');
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [userInput, setUserInput] = useState('');
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);

  // ── 결과 ──
  const [showResultDetail, setShowResultDetail] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── 타이머 정리 ──
  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // ── 다음 문제로 이동 ──
  const advance = useCallback((nextIndex: number) => {
    clearTimer();
    setCurrentInfo(null);
    setStatus('loading');
    setUserInput('');
    setTimeLeft(TIME_LIMIT);
    setCurrentIndex(nextIndex);
  }, []);

  // ── 정답 처리 ──
  const markCorrect = useCallback((info: PokemonInfo, input: string) => {
    clearTimer();
    setStatus('correct');
    addCaptured(info.id);
    recordCorrect(10);
    setAnswers(prev => [...prev, { id: info.id, koName: info.koName, imageUrl: info.imageUrl, correct: true, userInput: input, timedOut: false }]);
    setTimeout(() => advance(currentIndex + 1), 1200);
  }, [currentIndex, advance, addCaptured, recordCorrect]);

  // ── 오답/시간초과 처리 ──
  const markWrong = useCallback((info: PokemonInfo, input: string, timedOut: boolean) => {
    clearTimer();
    setStatus(timedOut ? 'timeout' : 'wrong');
    recordWrong();
    setAnswers(prev => [...prev, { id: info.id, koName: info.koName, imageUrl: info.imageUrl, correct: false, userInput: input, timedOut }]);
    setTimeout(() => advance(currentIndex + 1), timedOut ? 1500 : 1200);
  }, [currentIndex, advance, recordWrong]);

  // ── 현재 문제 로딩 ──
  useEffect(() => {
    if (phase !== 'playing') return;
    if (currentIndex >= questionIds.length) {
      // 모든 문제 완료
      setPhase('results');
      return;
    }

    const id = questionIds[currentIndex];
    setStatus('loading');

    (async () => {
      try {
        const [pokemonRes, koName] = await Promise.all([
          fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.json()),
          getKoreanName(id),
        ]);
        const info: PokemonInfo = {
          id,
          engName: pokemonRes.name,
          koName,
          imageUrl:
            pokemonRes.sprites?.other?.['official-artwork']?.front_default ||
            pokemonRes.sprites?.front_default ||
            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
        };
        setCurrentInfo(info);
        setTimeLeft(TIME_LIMIT);
        setStatus('answering');
        setTimeout(() => inputRef.current?.focus(), 50);
      } catch {
        // 로딩 실패 시 스킵
        advance(currentIndex + 1);
      }
    })();
  }, [currentIndex, questionIds, phase, advance]);

  // ── 타이머 ──
  useEffect(() => {
    if (status !== 'answering' || !currentInfo) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          markWrong(currentInfo, userInput, true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return clearTimer;
  }, [status, currentInfo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 입력 제출 ──
  const handleSubmit = () => {
    if (status !== 'answering' || !currentInfo) return;
    const input = userInput.trim();
    if (!input) return;

    const ko  = normalize(currentInfo.koName);
    const eng = normalize(currentInfo.engName);
    const ans = normalize(input);

    if (ans === ko || ans === eng) {
      markCorrect(currentInfo, input);
    } else {
      markWrong(currentInfo, input, false);
    }
  };

  // ── 퀴즈 시작 ──
  const startQuiz = (count: QuizCount) => {
    setQuizCount(count);
    const ids = getRandomIds(count);
    setQuestionIds(ids);
    setCurrentIndex(0);
    setAnswers([]);
    setPhase('playing');
  };

  // ── 결과 계산 ──
  const correctCount = answers.filter(a => a.correct).length;
  const grade = getGrade(correctCount, quizCount);
  const pct = Math.round((correctCount / quizCount) * 100);

  // ─────────────────────────────────────────────────────────────
  // ── 렌더: 선택 화면 ──────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div className="flex flex-col items-center py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-black text-white mb-3">📝 이름 맞추기!</h1>
          <p className="text-gray-400 text-lg">포켓몬 이미지를 보고 <span className="text-yellow-400 font-bold">5초 안에</span> 이름을 입력하세요!</p>
          <p className="text-gray-500 text-sm mt-1">한국어 이름 또는 영문명 모두 정답!</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl">
          {QUIZ_COUNTS.map((count, i) => {
            const meta: Record<QuizCount, { label: string; sub: string; color: string; border: string; emoji: string }> = {
              30:  { label: '30문제',  sub: '입문편 · 약 2~3분',   color: 'from-green-700 to-green-900',   border: 'border-green-500',  emoji: '🌱' },
              50:  { label: '50문제',  sub: '도전편 · 약 4~5분',   color: 'from-blue-700 to-blue-900',     border: 'border-blue-500',   emoji: '⚡' },
              100: { label: '100문제', sub: '마스터편 · 약 8~9분',  color: 'from-purple-700 to-purple-900', border: 'border-purple-500', emoji: '🏆' },
            };
            const m = meta[count];
            return (
              <motion.button
                key={count}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, type: 'spring' }}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => startQuiz(count)}
                className={`bg-gradient-to-br ${m.color} rounded-[2rem] p-8 border-2 ${m.border} shadow-2xl text-left`}
              >
                <div className="text-5xl mb-4">{m.emoji}</div>
                <p className="text-3xl font-black text-white">{m.label}</p>
                <p className="text-white/70 text-sm mt-2">{m.sub}</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-white text-xs font-bold">⏱ 문제당 5초</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={() => navigate('/')}
          className="mt-10 text-gray-500 hover:text-gray-300 underline text-sm"
        >
          ← 홈으로
        </motion.button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // ── 렌더: 플레이 화면 ─────────────────────────────────────────
  if (phase === 'playing') {
    const progress = currentIndex / quizCount;
    const timerPct = timeLeft / TIME_LIMIT;
    const timerColor = timeLeft <= 1 ? 'bg-red-500' : timeLeft <= 2 ? 'bg-orange-500' : timeLeft <= 3 ? 'bg-yellow-400' : 'bg-green-400';

    return (
      <div className="flex flex-col items-center py-6 w-full max-w-lg mx-auto">
        {/* 상단 진행 정보 */}
        <div className="w-full flex items-center justify-between mb-3 px-1">
          <span className="text-gray-400 font-bold text-sm">
            {currentIndex + 1} <span className="text-gray-600">/ {quizCount}</span>
          </span>
          <span className="text-yellow-400 font-black text-sm">
            ✓ {correctCount}
          </span>
        </div>

        {/* 전체 진행 바 */}
        <div className="w-full bg-gray-800 rounded-full h-2 mb-6 overflow-hidden">
          <motion.div
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full"
          />
        </div>

        {/* 카드 */}
        <div className="w-full bg-[#1a1a2e] rounded-[2.5rem] border border-gray-700 shadow-2xl overflow-hidden">
          {/* 타이머 바 */}
          <div className="h-3 bg-gray-800">
            <motion.div
              key={`timer-${currentIndex}`}
              initial={{ width: '100%' }}
              animate={{ width: status === 'answering' ? `${timerPct * 100}%` : status === 'loading' ? '100%' : '0%' }}
              transition={{ duration: status === 'answering' ? 0.9 : 0.1, ease: 'linear' }}
              className={`h-full ${timerColor} transition-colors duration-300 rounded-r-full`}
            />
          </div>

          {/* 타이머 숫자 */}
          <div className="flex justify-end px-5 pt-2">
            <AnimatePresence mode="wait">
              <motion.span
                key={timeLeft}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`text-2xl font-black ${
                  timeLeft <= 1 ? 'text-red-500' :
                  timeLeft <= 2 ? 'text-orange-400' :
                  timeLeft <= 3 ? 'text-yellow-400' :
                  'text-green-400'
                }`}
              >
                {status === 'answering' ? timeLeft : status === 'loading' ? '…' : '-'}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* 포켓몬 이미지 */}
          <div
            className={`relative flex justify-center items-center py-8 px-6 transition-all duration-300
              ${status === 'correct' ? 'bg-gradient-to-b from-green-900/40 to-transparent' :
                status === 'wrong' || status === 'timeout' ? 'bg-gradient-to-b from-red-900/40 to-transparent' :
                'bg-gradient-to-b from-[#0d0d20]/50 to-transparent'}`}
            style={{ minHeight: 240 }}
          >
            {status === 'loading' || !currentInfo ? (
              <div className="pokeball-spin" />
            ) : (
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentInfo.id}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring', duration: 0.4 }}
                  src={currentInfo.imageUrl}
                  alt="포켓몬"
                  className="w-44 h-44 object-contain drop-shadow-2xl"
                />
              </AnimatePresence>
            )}

            {/* 정답/오답 오버레이 */}
            <AnimatePresence>
              {(status === 'correct' || status === 'wrong' || status === 'timeout') && currentInfo && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center"
                >
                  <span className="text-6xl">
                    {status === 'correct' ? '⭕' : status === 'timeout' ? '⏰' : '❌'}
                  </span>
                  <p className={`font-black text-2xl mt-2 ${status === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                    {status === 'correct' ? `정답! ${currentInfo.koName}` :
                     status === 'timeout' ? `시간 초과! ${currentInfo.koName}` :
                     `오답! 정답: ${currentInfo.koName}`}
                  </p>
                  {status !== 'correct' && (
                    <p className="text-gray-400 text-sm capitalize mt-1">( {currentInfo.engName} )</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 입력 영역 */}
          <div className="p-6 pt-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="포켓몬 이름을 입력하세요..."
                disabled={status !== 'answering'}
                autoComplete="off"
                className={`flex-1 bg-[#252540] border-2 text-white px-4 py-3 rounded-2xl outline-none transition-colors text-lg font-bold
                  ${status === 'correct' ? 'border-green-500' :
                    status === 'wrong' || status === 'timeout' ? 'border-red-600' :
                    'border-gray-600 focus:border-yellow-400'}`}
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={status !== 'answering' || !userInput.trim()}
                className={`px-5 py-3 rounded-2xl font-black text-lg transition-all
                  ${status === 'answering' && userInput.trim()
                    ? 'bg-yellow-400 hover:bg-yellow-300 text-black'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
              >
                확인
              </motion.button>
            </div>

            {/* 힌트: 번호 */}
            {status === 'answering' && currentInfo && (
              <p className="text-center text-gray-600 text-xs mt-2">
                #{String(currentInfo.id).padStart(3, '0')}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // ── 렌더: 결과 화면 ──────────────────────────────────────────
  const wrongAnswers = answers.filter(a => !a.correct);
  const correctAnswers = answers.filter(a => a.correct);

  return (
    <div className="flex flex-col items-center py-8 w-full max-w-2xl mx-auto">
      {/* 파티클 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
        {Array.from({ length: 20 }, (_, i) => (
          <motion.div
            key={i}
            initial={{
              opacity: 1,
              x: `${Math.random() * 100}vw`,
              y: '-5vh',
              rotate: 0,
              scale: Math.random() * 0.8 + 0.5,
            }}
            animate={{
              y: '110vh',
              rotate: Math.random() * 720 - 360,
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: Math.random() * 2 + 2,
              delay: Math.random() * 1.5,
              ease: 'linear',
            }}
            className="absolute text-2xl"
          >
            {grade.particleEmojis[i % grade.particleEmojis.length]}
          </motion.div>
        ))}
      </div>

      {/* 메인 결과 카드 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="w-full bg-[#1a1a2e] rounded-[2.5rem] border border-gray-700 shadow-2xl p-8 text-center relative z-20 mb-6"
      >
        {/* 등급 이모지 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
          className="text-8xl mb-4"
        >
          {grade.emoji}
        </motion.div>

        {/* 등급 제목 */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`text-4xl font-black mb-2 ${grade.color}`}
        >
          {grade.label}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 text-lg mb-8"
        >
          {grade.sub}
        </motion.p>

        {/* 점수 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-end justify-center gap-2 mb-2"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-7xl font-black text-white leading-none"
          >
            {correctCount}
          </motion.span>
          <span className="text-3xl font-black text-gray-500 mb-2">/ {quizCount}</span>
        </motion.div>

        {/* 퍼센트 바 */}
        <div className="bg-gray-800 rounded-full h-5 overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: 0.7, duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              pct === 100 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
              pct >= 70  ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
              pct >= 50  ? 'bg-gradient-to-r from-green-400 to-green-600' :
              'bg-gradient-to-r from-red-500 to-red-700'
            }`}
          />
        </div>
        <p className={`text-2xl font-black ${grade.color}`}>{pct}%</p>

        {/* 세부 통계 */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-[#252540] rounded-2xl p-3">
            <p className="text-green-400 font-black text-2xl">{correctCount}</p>
            <p className="text-gray-500 text-xs">정답</p>
          </div>
          <div className="bg-[#252540] rounded-2xl p-3">
            <p className="text-red-400 font-black text-2xl">{quizCount - correctCount}</p>
            <p className="text-gray-500 text-xs">오답</p>
          </div>
          <div className="bg-[#252540] rounded-2xl p-3">
            <p className="text-orange-400 font-black text-2xl">
              {answers.filter(a => a.timedOut).length}
            </p>
            <p className="text-gray-500 text-xs">시간초과</p>
          </div>
        </div>
      </motion.div>

      {/* 버튼 */}
      <div className="flex gap-3 w-full mb-6 z-20">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { setPhase('select'); setAnswers([]); setCurrentIndex(0); }}
          className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-2xl text-lg transition-colors"
        >
          🔄 다시 도전!
        </motion.button>
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/')}
          className="flex-1 bg-[#1a1a2e] hover:bg-[#252540] text-white font-black py-4 rounded-2xl text-lg border border-gray-700 transition-colors"
        >
          🏠 홈으로
        </motion.button>
      </div>

      {/* 오답 목록 토글 */}
      {wrongAnswers.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="w-full z-20"
        >
          <button
            onClick={() => setShowResultDetail(v => !v)}
            className="w-full bg-[#1a1a2e] border border-gray-700 rounded-2xl py-3 px-5 text-gray-400 font-bold text-sm hover:text-white transition-colors flex items-center justify-between"
          >
            <span>❌ 틀린 포켓몬 {wrongAnswers.length}마리 보기</span>
            <span>{showResultDetail ? '▲' : '▼'}</span>
          </button>

          <AnimatePresence>
            {showResultDetail && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-3">
                  {wrongAnswers.map((a, i) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="bg-[#1a1a2e] border border-red-900/50 rounded-2xl p-2 flex flex-col items-center text-center"
                    >
                      <img
                        src={a.imageUrl}
                        alt={a.koName}
                        className="w-12 h-12 object-contain"
                        loading="lazy"
                      />
                      <p className="text-white font-bold text-xs mt-1">{a.koName}</p>
                      {a.userInput && (
                        <p className="text-red-400 text-[10px]">"{a.userInput}"</p>
                      )}
                      {a.timedOut && (
                        <p className="text-orange-400 text-[10px]">⏰시간초과</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* 정답 목록 토글 */}
      {correctAnswers.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="w-full z-20 mt-3"
        >
          <details className="group">
            <summary className="w-full bg-[#1a1a2e] border border-gray-700 rounded-2xl py-3 px-5 text-gray-400 font-bold text-sm hover:text-white transition-colors flex items-center justify-between cursor-pointer list-none">
              <span>✅ 맞춘 포켓몬 {correctAnswers.length}마리 보기</span>
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mt-3">
              {correctAnswers.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="bg-[#1a1a2e] border border-green-900/50 rounded-xl p-1.5 flex flex-col items-center text-center"
                >
                  <img src={a.imageUrl} alt={a.koName} className="w-10 h-10 object-contain" loading="lazy" />
                  <p className="text-green-400 font-bold text-[10px] mt-0.5">{a.koName}</p>
                </motion.div>
              ))}
            </div>
          </details>
        </motion.div>
      )}
    </div>
  );
}
