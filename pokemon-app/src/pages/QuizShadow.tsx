import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { getKoreanNames } from '../api/koreanNames';
import { MAX_POKEMON } from '../data/regions';

const getRandomId = () => Math.floor(Math.random() * MAX_POKEMON) + 1;

interface PokemonData {
    id: number;
    name: string;
    sprites: { other: { 'official-artwork': { front_default: string } }; front_default: string };
    types: { type: { name: string } }[];
}

export default function QuizShadow() {
    const { addCaptured, recordCorrect, recordWrong, score, streak } = useGameStore();
    const [currentId, setCurrentId] = useState(getRandomId());
    const [pokemon, setPokemon] = useState<PokemonData | null>(null);
    const [options, setOptions] = useState<PokemonData[]>([]);
    const [optionKoNames, setOptionKoNames] = useState<Record<number, string>>({});
    const [currentKoName, setCurrentKoName] = useState<string>('');
    const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');
    const [effectClass, setEffectClass] = useState('');
    const [loading, setLoading] = useState(true);
    const [streakBonus, setStreakBonus] = useState(0);

    useEffect(() => {
        const loadQuiz = async () => {
            setLoading(true);
            setStatus('playing');
            setEffectClass('');
            setCurrentKoName('');
            try {
                const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${currentId}`);
                const data = await res.json();
                setPokemon(data);

                const otherIds = new Set<number>();
                while (otherIds.size < 3) {
                    const rnd = getRandomId();
                    if (rnd !== currentId) otherIds.add(rnd);
                }
                const others = await Promise.all(
                    Array.from(otherIds).map(id => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.json()))
                );
                const all = [data, ...others].sort(() => Math.random() - 0.5);
                setOptions(all);

                const allIds = all.map((p: PokemonData) => p.id);
                const names = await getKoreanNames(allIds);
                setOptionKoNames(names);
                setCurrentKoName(names[currentId] ?? data.name);
            } catch { /* silent */ }
            setLoading(false);
        };
        loadQuiz();
    }, [currentId]);

    const triggerEffect = (cls: string) => {
        setEffectClass('');
        requestAnimationFrame(() => requestAnimationFrame(() => setEffectClass(cls)));
    };

    const handleGuess = (guessedId: number) => {
        if (status !== 'playing' || !pokemon) return;
        if (guessedId === currentId) {
            const pType = pokemon.types[0].type.name;
            triggerEffect(`effect-${pType}`);
            setStatus('correct');
            addCaptured(currentId);
            const nextStreak = streak + 1;
            const bonus = nextStreak >= 10 ? 3 : nextStreak >= 5 ? 2 : 1;
            setStreakBonus(bonus);
            recordCorrect(10);
            setTimeout(() => setCurrentId(getRandomId()), 2500);
        } else {
            triggerEffect('effect-wrong');
            setStatus('wrong');
            recordWrong();
            setTimeout(() => setStatus('playing'), 1200);
        }
    };

    const handleSkip = () => {
        recordWrong();
        setCurrentId(getRandomId());
    };

    const streakLabel = streak >= 10 ? '🔥🔥🔥 3배!' : streak >= 5 ? '🔥🔥 2배!' : streak >= 3 ? '🔥' : '';

    return (
        <div className="flex flex-col items-center py-8">
            <h1 className="text-4xl font-black mb-2 text-white text-center">🔮 저 포켓몬은 누구?!</h1>
            <p className="text-gray-400 mb-8">그림자를 보고 포켓몬 이름을 맞춰보세요!</p>

            {/* 스코어 배너 */}
            <div className="flex gap-4 mb-8 flex-wrap justify-center">
                <div className="bg-[#1a1a2e] rounded-2xl px-6 py-3 text-center border border-yellow-500/30">
                    <p className="text-xs text-gray-400 font-bold">총 점수</p>
                    <p className="text-2xl font-black text-yellow-400">{score}</p>
                </div>
                <div className="bg-[#1a1a2e] rounded-2xl px-6 py-3 text-center border border-orange-500/30">
                    <p className="text-xs text-gray-400 font-bold">연속 정답</p>
                    <p className="text-2xl font-black text-orange-400">{streak} {streakLabel}</p>
                </div>
                {streakBonus > 1 && (
                    <div className="bg-[#1a1a2e] rounded-2xl px-6 py-3 text-center border border-red-500/30">
                        <p className="text-xs text-gray-400 font-bold">점수 배율</p>
                        <p className="text-2xl font-black text-red-400">x{streakBonus}</p>
                    </div>
                )}
            </div>

            <div className="bg-[#1a1a2e] rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-gray-700 overflow-hidden">
                {/* 포켓몬 이미지 영역 */}
                <div
                    className={`relative flex justify-center items-center bg-gradient-to-b from-[#0d0d20] to-[#1a1a2e] py-12 px-8 ${effectClass}`}
                    style={{ minHeight: 280 }}
                >
                    {loading ? (
                        <div className="pokeball-spin" />
                    ) : (
                        <motion.img
                            key={currentId}
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', duration: 0.5 }}
                            src={pokemon?.sprites?.other?.['official-artwork']?.front_default || pokemon?.sprites?.front_default}
                            alt="포켓몬 실루엣"
                            className={`w-56 h-56 object-contain drop-shadow-2xl transition-all duration-700
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
                                    exit={{ opacity: 0 }}
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

                {/* 선택지 영역 */}
                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        {options.map((opt) => {
                            const koName = optionKoNames[opt.id];
                            const isCorrect = opt.id === currentId;
                            let cls = 'py-4 px-5 rounded-2xl font-black text-lg transition-all border-2 w-full text-left ';
                            if (status === 'correct') {
                                cls += isCorrect
                                    ? 'bg-green-600 border-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.6)] scale-105'
                                    : 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed';
                            } else if (status === 'wrong') {
                                cls += 'bg-[#1a1a2e] border-red-500/40 text-red-300';
                            } else {
                                cls += 'bg-[#252540] border-gray-600 text-white hover:border-yellow-500 hover:bg-[#2a2a50] hover:scale-[1.02] cursor-pointer shadow-lg';
                            }
                            return (
                                <motion.button
                                    key={opt.id}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => handleGuess(opt.id)}
                                    disabled={status === 'correct'}
                                    className={cls}
                                >
                                    <span className="block text-lg">
                                        {koName ?? <span className="text-gray-400 text-sm">로딩...</span>}
                                    </span>
                                    <span className="block text-xs text-gray-400 capitalize font-normal">{opt.name}</span>
                                </motion.button>
                            );
                        })}
                    </div>

                    {status === 'correct' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mt-4"
                        >
                            <p className="text-3xl font-black text-yellow-400 drop-shadow-[0_0_8px_rgba(255,255,0,0.5)]">
                                정답! 🎉 {currentKoName}
                            </p>
                            <p className="text-xs text-gray-400 capitalize mt-1">( {pokemon?.name} )</p>
                            <p className="text-sm text-gray-400 mt-1">
                                +{10 * streakBonus}점 획득! {streakBonus > 1 && `(${streakBonus}배 보너스!)`} 도감에 등록!
                            </p>
                        </motion.div>
                    )}

                    {status === 'wrong' && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center text-red-400 font-bold text-lg mt-2"
                        >
                            😢 틀렸어요! 다시 도전해보세요!
                        </motion.p>
                    )}

                    <div className="flex justify-center mt-4">
                        <button
                            onClick={handleSkip}
                            disabled={status === 'correct'}
                            className="text-sm text-gray-500 hover:text-gray-300 underline transition-colors"
                        >
                            {status !== 'playing' ? '다음 문제로 →' : '건너뛰기'}
                        </button>
                    </div>
                </div>
            </div>

            {status === 'correct' && pokemon && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex gap-2"
                >
                    {pokemon.types.map((t) => (
                        <span key={t.type.name} className={`type-${t.type.name} text-sm font-black px-4 py-1.5 rounded-full text-white shadow-lg`}>
                            {t.type.name} 타입
                        </span>
                    ))}
                </motion.div>
            )}
        </div>
    );
}
