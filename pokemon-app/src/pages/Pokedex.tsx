import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getKoreanNames } from '../api/koreanNames';
import { REGIONS } from '../data/regions';
import { useAuthStore } from '../store/authStore';

const TYPE_KO: Record<string, string> = {
    normal: '노말', fire: '불꽃', water: '물', electric: '전기', grass: '풀',
    ice: '얼음', fighting: '격투', poison: '독', ground: '땅', flying: '비행',
    psychic: '에스퍼', bug: '벌레', rock: '바위', ghost: '고스트', dragon: '드래곤',
    dark: '악', steel: '강철', fairy: '페어리',
};

export default function Pokedex() {
    const { trainer } = useAuthStore();
    const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);
    const [pokemonList, setPokemonList] = useState<any[]>([]);
    const [koNames, setKoNames] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selected, setSelected] = useState<any>(null);

    const fetchRegion = useCallback(async () => {
        setLoading(true);
        setPokemonList([]);
        try {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${selectedRegion.limit}&offset=${selectedRegion.offset}`);
            const data = await res.json();

            const detailed = await Promise.all(
                data.results.map((p: any) => fetch(p.url).then(r => r.json()))
            );
            setPokemonList(detailed);

            // 한국어 이름 가져오기
            const ids = detailed.map((p: any) => p.id);
            const names = await getKoreanNames(ids);
            setKoNames(prev => ({ ...prev, ...names }));
        } catch { }
        setLoading(false);
    }, [selectedRegion]);

    useEffect(() => { fetchRegion(); }, [fetchRegion]);

    // 선택된 포켓몬의 한국어 이름도 미리 로드
    useEffect(() => {
        if (selected && !koNames[selected.id]) {
            getKoreanNames([selected.id]).then(names => setKoNames(prev => ({ ...prev, ...names })));
        }
    }, [selected]);

    const filteredPokemon = pokemonList.filter(p => {
        const koName = koNames[p.id] ?? '';
        return (
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            koName.includes(searchTerm) ||
            String(p.id).includes(searchTerm)
        );
    });

    return (
        <div className="py-8">
            <h1 className="text-4xl font-black mb-4 text-center text-white">
                📖 포켓몬 도감
            </h1>
            {!trainer && (
                <div className="max-w-lg mx-auto mb-6 bg-yellow-500/10 border border-yellow-500/40 rounded-2xl px-5 py-3 text-sm text-center">
                    <span className="text-yellow-400 font-bold">🔑 로그인하면 퀴즈에서 맞춘 포켓몬을 나의 도감에 저장할 수 있어요!</span>
                    <a href="/PocketmonProject/login" className="ml-2 underline text-yellow-300 hover:text-yellow-200">로그인하기</a>
                </div>
            )}

            {/* 지방 탭 */}
            <div className="flex flex-wrap gap-2 justify-center mb-8">
                {REGIONS.map((r) => (
                    <button
                        key={r.id}
                        onClick={() => { setSelectedRegion(r); setSearchTerm(''); }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-all duration-200
              ${selectedRegion.id === r.id
                                ? `${r.color} text-white ring-2 ring-white scale-110 shadow-xl`
                                : 'bg-[#1a1a2e] text-gray-400 hover:bg-[#252540] hover:text-white border border-gray-700'
                            }`}
                        style={selectedRegion.id === r.id ? { boxShadow: `0 0 20px ${r.glow}88` } : {}}
                    >
                        <span className="font-black text-base">{r.name}</span>
                        <span className="block text-xs opacity-80">{r.sub}</span>
                    </button>
                ))}
            </div>

            {/* 검색 */}
            <div className="relative max-w-lg mx-auto mb-8">
                <input
                    type="text"
                    placeholder="한국어 이름, 영문명, 번호로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#1a1a2e] border-2 border-gray-700 focus:border-yellow-400 text-white p-3 pl-12 rounded-full shadow-inner focus:outline-none transition-colors text-lg"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
            </div>

            {!loading && (
                <p className="text-center text-gray-400 text-sm mb-6 font-bold">
                    {selectedRegion.name} 지방 — {filteredPokemon.length}마리
                </p>
            )}

            {loading && (
                <div className="flex flex-col items-center my-20 gap-4">
                    <div className="pokeball-spin"></div>
                    <p className="text-gray-400 font-bold animate-pulse">{selectedRegion.name} 지방 로딩 중...</p>
                </div>
            )}

            <AnimatePresence mode="wait">
                {!loading && (
                    <motion.div
                        key={selectedRegion.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                    >
                        {filteredPokemon.map((p) => {
                            const koName = koNames[p.id];
                            return (
                                <motion.div
                                    key={p.id}
                                    initial={{ scale: 0.85, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.25 }}
                                    onClick={() => setSelected(p)}
                                    className="bg-[#1a1a2e] border border-gray-700/50 rounded-[1.5rem] p-4 flex flex-col items-center cursor-pointer pokemon-card relative overflow-hidden"
                                >
                                    <span className="absolute top-2 right-2 text-xs font-black text-gray-600">
                                        #{String(p.id).padStart(3, '0')}
                                    </span>
                                    <img
                                        src={p.sprites?.other?.['official-artwork']?.front_default || p.sprites?.front_default}
                                        alt={koName ?? p.name}
                                        loading="lazy"
                                        className="w-24 h-24 object-contain drop-shadow-lg"
                                    />
                                    {/* 한국어 이름 크게, 영문명 작게 */}
                                    <p className="text-base font-black mt-3 text-white tracking-wide text-center">
                                        {koName ?? (
                                            <span className="text-gray-400 text-sm animate-pulse">로딩...</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">{p.name}</p>
                                    <div className="flex gap-1 mt-2 flex-wrap justify-center">
                                        {p.types.map((t: any) => (
                                            <span
                                                key={t.type.name}
                                                className={`type-${t.type.name} text-xs font-bold px-2 py-0.5 rounded-full text-white`}
                                            >
                                                {TYPE_KO[t.type.name] ?? t.type.name}
                                            </span>
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 상세 모달 */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelected(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 40 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 40 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#1a1a2e] rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-gray-700 text-center"
                        >
                            <img
                                src={selected.sprites?.other?.['official-artwork']?.front_default}
                                alt={koNames[selected.id] ?? selected.name}
                                className="w-48 h-48 mx-auto object-contain drop-shadow-2xl"
                            />
                            <h2 className="text-3xl font-black text-white mt-4">
                                {koNames[selected.id] ?? selected.name}
                            </h2>
                            <p className="text-gray-400 font-bold text-sm capitalize">
                                {selected.name} · #{String(selected.id).padStart(3, '0')}
                            </p>

                            <div className="flex gap-2 justify-center mt-4 flex-wrap">
                                {selected.types.map((t: any) => (
                                    <span key={t.type.name} className={`type-${t.type.name} text-sm font-black px-4 py-1 rounded-full text-white`}>
                                        {TYPE_KO[t.type.name] ?? t.type.name}
                                    </span>
                                ))}
                            </div>

                            <div className="mt-6 space-y-2">
                                {selected.stats.map((s: any) => {
                                    const ko: Record<string, string> = {
                                        hp: 'HP', attack: '공격', defense: '방어',
                                        'special-attack': '특수공격', 'special-defense': '특수방어', speed: '스피드'
                                    };
                                    const pct = Math.min((s.base_stat / 200) * 100, 100);
                                    return (
                                        <div key={s.stat.name} className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400 w-20 text-right">{ko[s.stat.name] ?? s.stat.name}</span>
                                            <div className="flex-1 bg-gray-800 rounded-full h-2">
                                                <div
                                                    className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-black text-white w-8">{s.base_stat}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setSelected(null)}
                                className="mt-6 bg-red-600 hover:bg-red-500 text-white font-black px-8 py-3 rounded-full transition-colors"
                            >
                                닫기
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
