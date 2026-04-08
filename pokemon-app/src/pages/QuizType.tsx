import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { getKoreanName } from '../api/koreanNames';
import { MAX_POKEMON } from '../data/regions';

const getRandomId = () => Math.floor(Math.random() * MAX_POKEMON) + 1;

const ALL_TYPES = [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison',
    'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
] as const;

const TYPE_KO: Record<string, string> = {
    normal: '노말', fire: '불꽃', water: '물', electric: '전기', grass: '풀',
    ice: '얼음', fighting: '격투', poison: '독', ground: '땅', flying: '비행',
    psychic: '에스퍼', bug: '벌레', rock: '바위', ghost: '고스트', dragon: '드래곤',
    dark: '악', steel: '강철', fairy: '페어리',
};

const TYPE_EMOJI: Record<string, string> = {
    normal: '⚪', fire: '🔥', water: '💧', electric: '⚡', grass: '🌿',
    ice: '❄️', fighting: '🥊', poison: '☠️', ground: '🌍', flying: '🌪️',
    psychic: '🔮', bug: '🐛', rock: '🪨', ghost: '👻', dragon: '🐉',
    dark: '🌑', steel: '⚙️', fairy: '🌸',
};

const TYPE_BG: Record<string, string> = {
    fire: 'from-orange-700 to-red-900', water: 'from-blue-700 to-blue-900',
    electric: 'from-yellow-600 to-yellow-900', grass: 'from-green-700 to-green-900',
    ice: 'from-cyan-600 to-cyan-900', fighting: 'from-red-700 to-red-900',
    poison: 'from-purple-700 to-purple-900', ground: 'from-yellow-700 to-amber-900',
    flying: 'from-indigo-600 to-indigo-900', psychic: 'from-pink-700 to-pink-900',
    bug: 'from-lime-700 to-lime-900', rock: 'from-stone-600 to-stone-900',
    ghost: 'from-violet-800 to-violet-900', dragon: 'from-violet-700 to-blue-900',
    dark: 'from-gray-800 to-gray-900', steel: 'from-slate-600 to-slate-900',
    fairy: 'from-pink-600 to-rose-900', normal: 'from-gray-600 to-gray-900',
};

interface PokemonData {
    id: number;
    name: string;
    sprites: { other: { 'official-artwork': { front_default: string } }; front_default: string };
    types: { type: { name: string } }[];
}

/** 옵션 생성: 정답 타입 모두 포함 + 나머지는 오답으로 채워 총 6개 */
function buildOptions(correctTypes: string[]): string[] {
    const pool = new Set<string>(correctTypes);
    const wrong = ALL_TYPES.filter(t => !correctTypes.includes(t));
    // shuffle wrong types
    for (let i = wrong.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [wrong[i], wrong[j]] = [wrong[j], wrong[i]];
    }
    const needed = Math.max(6 - correctTypes.length, 3); // 최소 오답 3개 보장
    wrong.slice(0, needed).forEach(t => pool.add(t));

    const arr = Array.from(pool);
    // shuffle final list
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export default function QuizType() {
    const { addCaptured, recordCorrect, recordWrong, score, streak } = useGameStore();

    const [currentId, setCurrentId] = useState(getRandomId());
    const [pokemon, setPokemon] = useState<PokemonData | null>(null);
    const [koName, setKoName] = useState('');
    const [options, setOptions] = useState<string[]>([]);
    const [correctTypes, setCorrectTypes] = useState<string[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [status, setStatus] = useState<'playing' | 'correct' | 'wrong' | 'checking'>('playing');
    const [effectClass, setEffectClass] = useState('');
    const [loading, setLoading] = useState(true);
    const [streakBonus, setStreakBonus] = useState(1);
    const [wrongHint, setWrongHint] = useState(false);

    useEffect(() => {
        const loadQuiz = async () => {
            setLoading(true);
            setStatus('playing');
            setSelected(new Set());
            setEffectClass('');
            setKoName('');
            setWrongHint(false);
            try {
                const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${currentId}`);
                const data: PokemonData = await res.json();
                setPokemon(data);

                const types = data.types.map(t => t.type.name);
                setCorrectTypes(types);
                setOptions(buildOptions(types));

                const name = await getKoreanName(currentId);
                setKoName(name);
            } catch { /* silent */ }
            setLoading(false);
        };
        loadQuiz();
    }, [currentId]);

    const triggerEffect = (cls: string) => {
        setEffectClass('');
        requestAnimationFrame(() => requestAnimationFrame(() => setEffectClass(cls)));
    };

    // 버튼 토글 (playing 중에만)
    const toggleType = (type: string) => {
        if (status !== 'playing') return;
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(type)) next.delete(type); else next.add(type);
            return next;
        });
        setWrongHint(false);
    };

    // 정답 확인
    const handleCheck = () => {
        if (status !== 'playing' || selected.size === 0) return;

        const correct =
            selected.size === correctTypes.length &&
            correctTypes.every(t => selected.has(t));

        if (correct) {
            const mainType = correctTypes[0];
            triggerEffect(`effect-${mainType}`);
            setStatus('correct');
            addCaptured(currentId);
            const nextStreak = streak + 1;
            const bonus = nextStreak >= 10 ? 3 : nextStreak >= 5 ? 2 : 1;
            setStreakBonus(bonus);
            recordCorrect(10);
            setTimeout(() => setCurrentId(getRandomId()), 3000);
        } else {
            triggerEffect('effect-wrong');
            setStatus('wrong');
            setWrongHint(true);
            recordWrong();
            // 오답 후 1.5초 뒤 다시 선택 가능 (정답 표시 유지)
            setTimeout(() => {
                setStatus('playing');
                setSelected(new Set());
                setWrongHint(false);
            }, 1800);
        }
    };

    const mainType = correctTypes[0] ?? 'normal';
    const bgGradient = status === 'correct'
        ? (TYPE_BG[mainType] ?? 'from-gray-900 to-black')
        : 'from-[#0d0d20] to-[#1a1a2e]';

    const streakLabel = streak >= 10 ? '🔥🔥🔥 3배!' : streak >= 5 ? '🔥🔥 2배!' : streak >= 3 ? '🔥' : '';
    const isDual = correctTypes.length === 2;

    return (
        <div className="flex flex-col items-center py-8">
            <h1 className="text-4xl font-black mb-2 text-white text-center">⚡ 타입 맞추기 퀴즈!</h1>
            <p className="text-gray-400 mb-2 text-center">
                포켓몬의 <span className="text-yellow-400 font-bold">모든 타입</span>을 정확히 선택하세요!
            </p>
            <p className="text-gray-500 text-sm mb-6 text-center">
                듀얼 타입이면 2개 모두 선택 후 확인 버튼을 눌러주세요
            </p>

            {/* 점수 배너 */}
            <div className="flex gap-4 mb-8 flex-wrap justify-center">
                <div className="bg-[#1a1a2e] rounded-2xl px-6 py-3 text-center border border-yellow-500/30">
                    <p className="text-xs text-gray-400 font-bold">총 점수</p>
                    <p className="text-2xl font-black text-yellow-400">{score}</p>
                </div>
                <div className="bg-[#1a1a2e] rounded-2xl px-6 py-3 text-center border border-orange-500/30">
                    <p className="text-xs text-gray-400 font-bold">연속 정답</p>
                    <p className="text-2xl font-black text-orange-400">{streak} {streakLabel}</p>
                </div>
                {streakBonus > 1 && status === 'correct' && (
                    <div className="bg-[#1a1a2e] rounded-2xl px-6 py-3 text-center border border-red-500/30">
                        <p className="text-xs text-gray-400 font-bold">배율</p>
                        <p className="text-2xl font-black text-red-400">x{streakBonus}</p>
                    </div>
                )}
            </div>

            <div className={`bg-gradient-to-b ${bgGradient} rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-gray-700 overflow-hidden transition-all duration-700 ${effectClass}`}>

                {/* 포켓몬 영역 */}
                <div className="flex flex-col items-center py-8 px-6 relative" style={{ minHeight: 260 }}>
                    {loading ? (
                        <div className="pokeball-spin" />
                    ) : (
                        <>
                            <motion.img
                                key={currentId}
                                initial={{ scale: 0.7, opacity: 0, rotate: -5 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                transition={{ type: 'spring', duration: 0.5 }}
                                src={pokemon?.sprites?.other?.['official-artwork']?.front_default || pokemon?.sprites?.front_default}
                                alt={koName || pokemon?.name}
                                className="w-48 h-48 object-contain drop-shadow-2xl"
                            />
                            <h2 className="text-3xl font-black text-white mt-3 drop-shadow-md">
                                {koName || <span className="animate-pulse text-gray-400">로딩...</span>}
                            </h2>
                            <p className="text-gray-400 text-sm mt-1 capitalize">
                                {pokemon?.name} · #{String(pokemon?.id ?? 0).padStart(3, '0')}
                            </p>
                            {isDual && status === 'playing' && (
                                <p className="mt-2 bg-purple-900/60 text-purple-300 text-xs font-bold px-3 py-1 rounded-full border border-purple-700">
                                    듀얼 타입 — 2개 선택!
                                </p>
                            )}

                            {/* 정답 파티클 */}
                            {status === 'correct' && (
                                <AnimatePresence>
                                    {[TYPE_EMOJI[mainType], '✨', TYPE_EMOJI[mainType], '⭐', '🎉'].map((e, i) => (
                                        <motion.span
                                            key={i}
                                            initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                                            animate={{ opacity: 0, scale: 2, x: (i - 2) * 70, y: -100 }}
                                            transition={{ duration: 0.9, delay: i * 0.1 }}
                                            className="absolute text-3xl pointer-events-none"
                                            style={{ left: '50%', top: '40%' }}
                                        >
                                            {e}
                                        </motion.span>
                                    ))}
                                </AnimatePresence>
                            )}
                        </>
                    )}
                </div>

                {/* 선택지 + 확인 */}
                <div className="p-6 bg-black/30 backdrop-blur-sm">

                    {/* 선택 안내 */}
                    {status === 'playing' && (
                        <p className="text-center text-gray-400 text-xs font-bold mb-3">
                            {selected.size === 0
                                ? '타입을 선택하세요'
                                : `선택 중: ${Array.from(selected).map(t => TYPE_KO[t]).join(' + ')}`}
                        </p>
                    )}

                    {/* 타입 버튼 그리드 */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {options.map(opt => {
                            const isCorrectType = correctTypes.includes(opt);
                            const isSelected = selected.has(opt);

                            let cls = 'py-3 px-2 rounded-2xl text-sm font-black text-white transition-all border-2 flex flex-col items-center gap-0.5 ';

                            if (status === 'correct') {
                                cls += isCorrectType
                                    ? `type-${opt} border-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.4)]`
                                    : 'opacity-20 bg-gray-900 border-gray-800 grayscale cursor-not-allowed';
                            } else if (status === 'wrong') {
                                // 오답일 때: 정답은 초록 테두리, 잘못 선택한 건 빨간 테두리
                                if (isCorrectType) {
                                    cls += `type-${opt} border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.5)]`;
                                } else if (isSelected && !isCorrectType) {
                                    cls += 'bg-red-900/60 border-red-500 opacity-70';
                                } else {
                                    cls += 'opacity-30 bg-gray-900 border-gray-800 grayscale cursor-not-allowed';
                                }
                            } else {
                                // playing
                                if (isSelected) {
                                    cls += `type-${opt} border-white scale-105 shadow-[0_0_15px_rgba(255,255,255,0.4)] ring-2 ring-white`;
                                } else {
                                    cls += `type-${opt} border-transparent hover:scale-105 hover:border-white/60 cursor-pointer shadow-lg opacity-75 hover:opacity-100`;
                                }
                            }

                            return (
                                <motion.button
                                    key={opt}
                                    whileTap={{ scale: 0.93 }}
                                    onClick={() => toggleType(opt)}
                                    disabled={status !== 'playing'}
                                    className={cls}
                                >
                                    <span className="text-xl">{TYPE_EMOJI[opt]}</span>
                                    <span className="text-xs">{TYPE_KO[opt]}</span>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* 확인 버튼 */}
                    {status === 'playing' && (
                        <motion.button
                            onClick={handleCheck}
                            disabled={selected.size === 0}
                            whileTap={{ scale: 0.97 }}
                            className={`w-full py-4 rounded-2xl font-black text-lg transition-all mt-1
                ${selected.size > 0
                                    ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg cursor-pointer'
                                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                        >
                            {selected.size === 0 ? '타입을 선택해주세요' : '✓ 정답 확인!'}
                        </motion.button>
                    )}

                    {/* 정답 */}
                    {status === 'correct' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                            <p className="text-2xl font-black text-yellow-400">
                                {correctTypes.map(t => `${TYPE_EMOJI[t]} ${TYPE_KO[t]}`).join(' + ')} 타입!
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                +{10 * streakBonus}점! {streakBonus > 1 && `(${streakBonus}배 보너스!)`} 도감에 등록!
                            </p>
                        </motion.div>
                    )}

                    {/* 오답 */}
                    {(status === 'wrong' || wrongHint) && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                            <p className="text-red-400 font-black text-lg">😢 틀렸어요!</p>
                            <p className="text-gray-400 text-sm mt-1">
                                정답: {correctTypes.map(t => `${TYPE_EMOJI[t]} ${TYPE_KO[t]}`).join(' + ')}
                            </p>
                        </motion.div>
                    )}

                    {/* 건너뛰기 */}
                    {status === 'playing' && (
                        <div className="flex justify-center mt-3">
                            <button
                                onClick={() => { recordWrong(); setCurrentId(getRandomId()); }}
                                className="text-xs text-gray-600 hover:text-gray-400 underline transition-colors"
                            >
                                건너뛰기
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
