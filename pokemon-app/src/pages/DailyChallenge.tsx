import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, isDailyAvailable } from '../store/gameStore';
import { getKoreanNames } from '../api/koreanNames';

const MAX_POKEMON = 898;
const DAILY_COUNT = 5;
const DAILY_BONUS = 50;

/** Seeded random using date string */
function seededRandom(seed: string, index: number): number {
    let hash = 0;
    const s = seed + index;
    for (let i = 0; i < s.length; i++) {
        hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) / 2147483647;
}

function getDailyPokemonIds(): number[] {
    const today = new Date().toISOString().slice(0, 10);
    return Array.from({ length: DAILY_COUNT }, (_, i) =>
        Math.floor(seededRandom(today, i) * MAX_POKEMON) + 1
    );
}

function getDailyOptions(correctId: number, index: number): number[] {
    const today = new Date().toISOString().slice(0, 10);
    const others: number[] = [];
    let n = 0;
    while (others.length < 3) {
        const id = Math.floor(seededRandom(today + '_opt' + index, n++) * MAX_POKEMON) + 1;
        if (id !== correctId && !others.includes(id)) others.push(id);
    }
    return [correctId, ...others].sort(() => seededRandom(today + '_sort' + index, 0) - 0.5);
}

export default function DailyChallenge() {
    const navigate = useNavigate();
    const gameStore = useGameStore();

    const dailyIds = getDailyPokemonIds();
    const available = isDailyAvailable(gameStore);

    const [questionIndex, setQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<boolean[]>([]);
    const [currentPokemon, setCurrentPokemon] = useState<any>(null);
    const [_options, setOptions] = useState<number[]>([]);
    const [optionData, setOptionData] = useState<any[]>([]);
    const [koNames, setKoNames] = useState<Record<number, string>>({});
    const [status, setStatus] = useState<'playing' | 'correct' | 'wrong' | 'done'>('playing');
    const [loading, setLoading] = useState(true);

    const finished = questionIndex >= DAILY_COUNT || status === 'done';

    useEffect(() => {
        if (!available || finished) return;
        const id = dailyIds[questionIndex];
        const optIds = getDailyOptions(id, questionIndex);
        setOptions(optIds);
        setStatus('playing');
        setLoading(true);

        (async () => {
            const [main, ...rest] = await Promise.all(
                optIds.map(i => fetch(`https://pokeapi.co/api/v2/pokemon/${i}`).then(r => r.json()))
            );
            setCurrentPokemon(main);
            setOptionData([main, ...rest].sort((a, b) => optIds.indexOf(a.id) - optIds.indexOf(b.id)));
            const names = await getKoreanNames(optIds);
            setKoNames(prev => ({ ...prev, ...names }));
            setLoading(false);
        })();
    }, [questionIndex, available]);

    const handleGuess = (guessedId: number) => {
        if (status !== 'playing') return;
        const correct = guessedId === dailyIds[questionIndex];
        setAnswers(prev => [...prev, correct]);
        setStatus(correct ? 'correct' : 'wrong');
        gameStore.addCaptured(dailyIds[questionIndex]);

        setTimeout(() => {
            if (questionIndex + 1 >= DAILY_COUNT) {
                setStatus('done');
            } else {
                setQuestionIndex(q => q + 1);
            }
        }, 1800);
    };

    if (!available) {
        return (
            <div className="flex flex-col items-center py-20 text-center">
                <div className="text-8xl mb-6">✅</div>
                <h1 className="text-4xl font-black text-white mb-3">오늘의 도전 완료!</h1>
                <p className="text-gray-400 text-lg mb-2">내일 다시 도전해보세요!</p>
                <p className="text-yellow-400 font-bold">다음 도전까지 자정에 초기화돼요 🌙</p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-8 bg-[#EE1515] hover:bg-red-500 text-white font-black px-8 py-4 rounded-2xl transition-colors"
                >
                    홈으로 돌아가기
                </button>
            </div>
        );
    }

    if (status === 'done') {
        const correct = answers.filter(Boolean).length;
        const bonus = correct >= 3 ? DAILY_BONUS : 0;
        if (correct >= 3) {
            gameStore.completeDailyChallenge();
            gameStore.recordCorrect(bonus);
        }

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-16 text-center"
            >
                <div className="text-7xl mb-4">{correct >= 4 ? '🏆' : correct >= 3 ? '🌟' : '😅'}</div>
                <h1 className="text-4xl font-black text-white mb-3">오늘의 도전 결과!</h1>
                <div className="bg-[#1a1a2e] rounded-[2rem] p-8 border border-gray-700 shadow-2xl max-w-md w-full mb-6">
                    <p className="text-6xl font-black text-yellow-400 mb-2">{correct}/{DAILY_COUNT}</p>
                    <p className="text-gray-300 text-lg mb-4">
                        {correct >= 4 ? '완벽해요! 포켓몬 마스터!' :
                            correct >= 3 ? '훌륭해요! 합격!' :
                                '아쉬워요! 내일 다시 도전해봐요!'}
                    </p>
                    {bonus > 0 && (
                        <div className="bg-yellow-400/20 border border-yellow-400/50 rounded-2xl p-4">
                            <p className="text-yellow-400 font-black text-xl">🎁 보너스 +{bonus}점!</p>
                            <p className="text-gray-400 text-sm">3문제 이상 정답 달성!</p>
                        </div>
                    )}
                </div>
                <div className="flex gap-3 flex-wrap justify-center">
                    {answers.map((a, i) => (
                        <div key={i} className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-black border-2
              ${a ? 'bg-green-600 border-green-400' : 'bg-red-900 border-red-700'}`}>
                            {a ? '○' : '✗'}
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="mt-8 bg-[#EE1515] hover:bg-red-500 text-white font-black px-8 py-4 rounded-2xl transition-colors"
                >
                    홈으로 돌아가기
                </button>
            </motion.div>
        );
    }

    return (
        <div className="flex flex-col items-center py-8">
            <h1 className="text-4xl font-black mb-2 text-white text-center">📅 오늘의 도전!</h1>
            <p className="text-yellow-400 font-bold mb-6">
                {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} · {questionIndex + 1}/{DAILY_COUNT}
            </p>

            {/* 진행 바 */}
            <div className="w-full max-w-lg mb-8">
                <div className="flex gap-1.5">
                    {Array.from({ length: DAILY_COUNT }, (_, i) => (
                        <div key={i} className={`flex-1 h-3 rounded-full transition-all duration-500
              ${i < questionIndex ? 'bg-green-500' :
                                i === questionIndex ? 'bg-yellow-400' :
                                    'bg-gray-700'}`} />
                    ))}
                </div>
            </div>

            <div className="bg-[#1a1a2e] rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-gray-700 overflow-hidden">
                <div className="relative flex justify-center items-center bg-gradient-to-b from-[#0d0d20] to-[#1a1a2e] py-12 px-8 min-h-[260px]">
                    {loading ? (
                        <div className="pokeball-spin" />
                    ) : (
                        <motion.img
                            key={questionIndex}
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', duration: 0.5 }}
                            src={currentPokemon?.sprites?.other?.['official-artwork']?.front_default}
                            alt="daily pokemon"
                            className={`w-52 h-52 object-contain drop-shadow-2xl
                ${status !== 'correct' ? 'shadow-silhouette' : 'drop-shadow-[0_0_30px_rgba(255,255,0,0.7)]'}`}
                        />
                    )}

                    {status === 'correct' && (
                        <AnimatePresence>
                            {['✨', '⭐', '🎉', '✨', '💫'].map((e, i) => (
                                <motion.span
                                    key={i}
                                    initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                                    animate={{ opacity: 0, scale: 1.5, x: (i - 2) * 60, y: -80 }}
                                    transition={{ duration: 0.8, delay: i * 0.08 }}
                                    className="absolute text-2xl pointer-events-none"
                                    style={{ left: '50%', top: '50%' }}
                                >
                                    {e}
                                </motion.span>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        {optionData.map((opt) => {
                            const koName = koNames[opt.id];
                            const isCorrect = opt.id === dailyIds[questionIndex];
                            let cls = 'py-4 px-5 rounded-2xl font-black text-lg transition-all border-2 w-full text-left ';
                            if (status === 'correct') {
                                cls += isCorrect
                                    ? 'bg-green-600 border-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.6)] scale-105'
                                    : 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed';
                            } else if (status === 'wrong') {
                                cls += isCorrect
                                    ? 'bg-green-900 border-green-700 text-green-300'
                                    : 'bg-[#1a1a2e] border-red-500/40 text-red-300';
                            } else {
                                cls += 'bg-[#252540] border-gray-600 text-white hover:border-yellow-500 hover:bg-[#2a2a50] hover:scale-[1.02] cursor-pointer shadow-lg';
                            }
                            return (
                                <motion.button
                                    key={opt.id}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => handleGuess(opt.id)}
                                    disabled={status !== 'playing'}
                                    className={cls}
                                >
                                    <span className="block text-lg">{koName ?? '로딩...'}</span>
                                    <span className="block text-xs text-gray-400 capitalize font-normal">{opt.name}</span>
                                </motion.button>
                            );
                        })}
                    </div>

                    {status === 'correct' && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-green-400 font-black text-xl">
                            🎉 정답! {koNames[dailyIds[questionIndex]]}
                        </motion.p>
                    )}
                    {status === 'wrong' && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-red-400 font-bold text-lg">
                            😢 틀렸어요! 정답은 {koNames[dailyIds[questionIndex]]}
                        </motion.p>
                    )}
                </div>
            </div>
        </div>
    );
}
