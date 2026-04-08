import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuthStore, AVATAR_EMOJIS } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { getKoreanNames } from '../api/koreanNames';
import { ACHIEVEMENTS } from '../data/achievements';
import { REGIONS } from '../data/regions';

const TYPE_KO: Record<string, string> = {
    normal: '노말', fire: '불꽃', water: '물', electric: '전기', grass: '풀',
    ice: '얼음', fighting: '격투', poison: '독', ground: '땅', flying: '비행',
    psychic: '에스퍼', bug: '벌레', rock: '바위', ghost: '고스트', dragon: '드래곤',
    dark: '악', steel: '강철', fairy: '페어리',
};

interface PokeCell {
    id: number;
    name: string; // 영문 (API에서)
    imageUrl: string;
    types: string[];
}

export default function MyPokedex() {
    const { capturedPokemon, score, maxStreak, totalCorrect, totalWrong, unlockedAchievements } = useGameStore();
    const { trainer } = useAuthStore();

    const [tab, setTab] = useState<'pokedex' | 'achievements' | 'stats'>('pokedex');
    const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);
    const [cells, setCells] = useState<PokeCell[]>([]);
    const [koNames, setKoNames] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(false);
    const [hoveredId, setHoveredId] = useState<number | null>(null);

    // 지방 변경 시 해당 지방 포켓몬 로드
    const loadRegion = useCallback(async (regionOffset: number, regionLimit: number) => {
        setLoading(true);
        setCells([]);
        try {
            const res = await fetch(
                `https://pokeapi.co/api/v2/pokemon?limit=${regionLimit}&offset=${regionOffset}`
            );
            const data = await res.json();

            const detailed: PokeCell[] = await Promise.all(
                data.results.map(async (p: { url: string }) => {
                    const d = await fetch(p.url).then(r => r.json());
                    return {
                        id: d.id,
                        name: d.name,
                        imageUrl:
                            d.sprites?.other?.['official-artwork']?.front_default ||
                            d.sprites?.front_default ||
                            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${d.id}.png`,
                        types: (d.types as { type: { name: string } }[]).map(t => t.type.name),
                    };
                })
            );
            setCells(detailed);

            const ids = detailed.map(p => p.id);
            const names = await getKoreanNames(ids);
            setKoNames(prev => ({ ...prev, ...names }));
        } catch { /* silent */ }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (tab === 'pokedex') {
            loadRegion(selectedRegion.offset, selectedRegion.limit);
        }
    }, [selectedRegion, tab, loadRegion]);

    // 통계 계산
    const capturedInRegion = cells.filter(c => capturedPokemon.includes(c.id)).length;
    const totalCaptured = capturedPokemon.length;
    const accuracy = totalCorrect + totalWrong > 0
        ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100)
        : 0;

    return (
        <div className="py-8">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-green-900 to-emerald-900 rounded-[2rem] p-6 mb-6 border border-green-700 shadow-2xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {trainer && <span className="text-5xl">{AVATAR_EMOJIS[trainer.avatarId]}</span>}
                        <div>
                            <h1 className="text-3xl font-black text-white">
                                {trainer ? `${trainer.nickname}의 도감` : '🌟 나의 포켓몬 도감'}
                            </h1>
                            <p className="text-green-300 mt-1 font-bold">퀴즈에서 맞춘 포켓몬이 여기 모여요!</p>
                        </div>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <div className="bg-black/30 rounded-2xl px-5 py-3 text-center">
                            <p className="text-xs text-green-300 font-bold">총 점수</p>
                            <p className="text-3xl font-black text-yellow-400">{score}</p>
                        </div>
                        <div className="bg-black/30 rounded-2xl px-5 py-3 text-center">
                            <p className="text-xs text-green-300 font-bold">총 획득</p>
                            <p className="text-3xl font-black text-white">{totalCaptured}</p>
                        </div>
                        <div className="bg-black/30 rounded-2xl px-5 py-3 text-center">
                            <p className="text-xs text-green-300 font-bold">업적</p>
                            <p className="text-3xl font-black text-purple-400">
                                {unlockedAchievements.length}
                                <span className="text-base text-green-300"> / {ACHIEVEMENTS.length}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 메인 탭 */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {(['pokedex', 'achievements', 'stats'] as const).map(t => {
                    const labels = { pokedex: '📖 나의 도감', achievements: '🏆 업적', stats: '📊 통계' };
                    return (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-5 py-2.5 rounded-full font-black text-sm transition-all border-2
                ${tab === t
                                    ? 'bg-yellow-400 text-black border-yellow-300'
                                    : 'bg-[#1a1a2e] text-gray-400 border-gray-700 hover:border-gray-500'}`}
                        >
                            {labels[t]}
                        </button>
                    );
                })}
            </div>

            {/* ── 도감 탭 ── */}
            {tab === 'pokedex' && (
                <>
                    {/* 지방 탭 */}
                    <div className="flex flex-wrap gap-2 justify-center mb-6">
                        {REGIONS.map(r => (
                            <button
                                key={r.id}
                                onClick={() => setSelectedRegion(r)}
                                className={`px-3 py-2 rounded-xl text-sm font-bold shadow transition-all duration-200
                  ${selectedRegion.id === r.id
                                        ? `${r.color} text-white ring-2 ring-white scale-110 shadow-xl`
                                        : 'bg-[#1a1a2e] text-gray-400 hover:bg-[#252540] hover:text-white border border-gray-700'}`}
                                style={selectedRegion.id === r.id ? { boxShadow: `0 0 18px ${r.glow}88` } : {}}
                            >
                                <span className="font-black">{r.name}</span>
                                <span className="block text-xs opacity-70">{r.sub}</span>
                            </button>
                        ))}
                    </div>

                    {/* 지방 진행률 */}
                    {!loading && cells.length > 0 && (
                        <div className="mb-6 bg-[#1a1a2e] rounded-2xl p-4 border border-gray-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-300 font-bold text-sm">
                                    {selectedRegion.name} 지방 — {capturedInRegion} / {cells.length}마리
                                </span>
                                <span className="text-yellow-400 font-black text-sm">
                                    {Math.floor((capturedInRegion / cells.length) * 100)}%
                                </span>
                            </div>
                            <div className="bg-gray-800 rounded-full h-3 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(capturedInRegion / cells.length) * 100}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                    className="h-full bg-gradient-to-r from-green-400 to-emerald-300 rounded-full"
                                />
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center my-16 gap-4">
                            <div className="pokeball-spin" />
                            <p className="text-gray-400 font-bold animate-pulse">{selectedRegion.name} 로딩 중...</p>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {!loading && (
                            <motion.div
                                key={selectedRegion.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3"
                            >
                                {cells.map(p => {
                                    const isCaptured = capturedPokemon.includes(p.id);
                                    const koName = koNames[p.id];
                                    return (
                                        <motion.div
                                            key={p.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.2 }}
                                            onMouseEnter={() => setHoveredId(p.id)}
                                            onMouseLeave={() => setHoveredId(null)}
                                            className={`flex flex-col items-center p-2 rounded-2xl border-2 relative transition-all duration-300
                        ${isCaptured
                                                    ? 'bg-[#1a1a2e] border-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.3)] hover:scale-110 hover:shadow-[0_0_20px_rgba(52,211,153,0.5)]'
                                                    : 'bg-[#0d0d1a] border-gray-800 opacity-60 hover:opacity-80'}`}
                                        >
                                            <span className="absolute top-1 right-1 text-[9px] font-black text-gray-600">
                                                #{p.id}
                                            </span>
                                            <img
                                                src={p.imageUrl}
                                                alt={isCaptured ? (koName ?? p.name) : '???'}
                                                loading="lazy"
                                                className={`w-14 h-14 object-contain ${!isCaptured ? 'shadow-silhouette' : 'drop-shadow-sm'}`}
                                            />
                                            <span className={`text-[10px] mt-1 font-bold text-center truncate w-full
                          ${isCaptured ? 'text-white' : 'text-gray-700'}`}>
                                                {isCaptured ? (koName ?? '...') : '???'}
                                            </span>
                                            {isCaptured && (
                                                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                                                    {p.types.map(t => (
                                                        <span key={t} className={`type-${t} text-[8px] px-1 py-0.5 rounded font-bold`}>
                                                            {TYPE_KO[t] ?? t}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {isCaptured && hoveredId === p.id && (
                                                <motion.span
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute -top-2 -right-2 text-base"
                                                >⭐</motion.span>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!loading && cells.length > 0 && capturedInRegion === 0 && (
                        <div className="text-center mt-16">
                            <p className="text-5xl mb-4">😴</p>
                            <p className="text-xl font-black text-gray-500">
                                {selectedRegion.name} 지방 포켓몬이 아직 없어요!
                            </p>
                            <p className="text-gray-600 mt-2">실루엣 퀴즈나 타입 퀴즈에서 잡아보세요!</p>
                        </div>
                    )}
                </>
            )}

            {/* ── 업적 탭 ── */}
            {tab === 'achievements' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ACHIEVEMENTS.map(ach => {
                        const unlocked = unlockedAchievements.includes(ach.id);
                        return (
                            <motion.div
                                key={ach.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`rounded-[1.5rem] p-5 border-2 flex items-center gap-4 transition-all
                  ${unlocked
                                        ? 'bg-yellow-400/10 border-yellow-500/50 shadow-[0_0_15px_rgba(250,204,21,0.2)]'
                                        : 'bg-[#1a1a2e] border-gray-700 opacity-50'}`}
                            >
                                <span className={`text-4xl ${unlocked ? '' : 'grayscale'}`}>{ach.icon}</span>
                                <div>
                                    <p className={`font-black text-base ${unlocked ? 'text-yellow-400' : 'text-gray-500'}`}>
                                        {ach.title}
                                    </p>
                                    <p className="text-gray-400 text-sm">{ach.desc}</p>
                                    {unlocked && <p className="text-green-400 text-xs font-bold mt-1">✓ 달성!</p>}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* ── 통계 탭 ── */}
            {tab === 'stats' && (
                <div className="max-w-lg mx-auto space-y-4">
                    {[
                        { label: '총 점수',    value: score,          icon: '⭐', color: 'text-yellow-400' },
                        { label: '정답 횟수',  value: totalCorrect,   icon: '✓',  color: 'text-green-400' },
                        { label: '오답 횟수',  value: totalWrong,     icon: '✗',  color: 'text-red-400' },
                        { label: '정답률',     value: `${accuracy}%`, icon: '📊', color: 'text-blue-400' },
                        { label: '최고 연속',  value: maxStreak,      icon: '🔥', color: 'text-orange-400' },
                        { label: '획득 포켓몬',value: totalCaptured,  icon: '🎯', color: 'text-purple-400' },
                    ].map(({ label, value, icon, color }) => (
                        <div key={label} className="bg-[#1a1a2e] rounded-2xl p-5 border border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{icon}</span>
                                <span className="text-gray-300 font-bold">{label}</span>
                            </div>
                            <span className={`font-black text-2xl ${color}`}>{value}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
