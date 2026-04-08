import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore, AVATAR_EMOJIS } from '../store/authStore';
import { useGameStore, isDailyAvailable } from '../store/gameStore';

const MENU_CARDS = [
    {
        to: '/pokedex',
        emoji: '📖',
        title: '포켓몬 도감',
        sub: '관동 ~ 팔데아 전 지방',
        desc: '전국 도감 완전 수록! 지방별 탭으로 포켓몬을 탐험하세요.',
        bg: 'from-blue-700 to-blue-900',
        border: 'border-blue-500',
    },
    {
        to: '/quiz-shadow',
        emoji: '🔮',
        title: '실루엣 퀴즈',
        sub: '저 포켓몬은 누구?!',
        desc: '그림자만 보고 포켓몬 이름을 맞춰보세요! 정답이면 도감에 등록!',
        bg: 'from-purple-700 to-purple-900',
        border: 'border-purple-500',
    },
    {
        to: '/quiz-type',
        emoji: '⚡',
        title: '타입 퀴즈',
        sub: '속성을 맞춰라!',
        desc: '포켓몬 이미지를 보고 타입(속성)을 맞춰보세요!',
        bg: 'from-yellow-600 to-orange-800',
        border: 'border-yellow-500',
    },
    {
        to: '/quiz-name',
        emoji: '📝',
        title: '이름 맞추기',
        sub: '5초 안에 이름을 입력!',
        desc: '포켓몬 이미지를 보고 5초 안에 이름을 입력하세요! 30·50·100문제 선택 가능!',
        bg: 'from-pink-700 to-rose-900',
        border: 'border-pink-500',
    },
    {
        to: '/mypokedex',
        emoji: '🌟',
        title: '나의 도감',
        sub: '내가 잡은 포켓몬',
        desc: '퀴즈에서 맞춘 포켓몬들이 모여있어요! 전부 모아봐요!',
        bg: 'from-green-700 to-green-900',
        border: 'border-green-500',
    },
];

const HERO_POKEMON = [
    { id: 25, name: '피카츄' },
    { id: 6, name: '리자몽' },
    { id: 9, name: '거북왕' },
    { id: 3, name: '이상해꽃' },
    { id: 150, name: '뮤츠' },
];

function FloatingPokemon({ pokemon, index }: { pokemon: { id: number; name: string }; index: number }) {
    return (
        <motion.div
            className="flex flex-col items-center"
            animate={{ y: [0, -14, 0] }}
            transition={{
                delay: index * 0.3,
                duration: 2 + index * 0.2,
                repeat: Infinity,
                ease: 'easeInOut' as const,
            }}
        >
            <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`}
                alt={pokemon.name}
                className="w-20 h-20 md:w-28 md:h-28 object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
            />
            <span className="text-white text-sm font-black mt-1 bg-black/30 px-3 py-0.5 rounded-full">
                {pokemon.name}
            </span>
        </motion.div>
    );
}

export default function Home() {
    const { trainer } = useAuthStore();
    const gameStore = useGameStore();
    const dailyAvailable = isDailyAvailable(gameStore);

    return (
        <div className="flex flex-col items-center py-8">
            {/* 히어로 섹션 */}
            <div className="w-full relative rounded-[2.5rem] overflow-hidden mb-8 bg-gradient-to-br from-[#CC0000] via-[#EE1515] to-[#ff6b6b] shadow-2xl shadow-red-900/70 py-12 px-6">
                <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full border-[30px] border-white/10 pointer-events-none" />
                <div className="absolute -left-10 -bottom-10 w-60 h-60 rounded-full border-[20px] border-white/5 pointer-events-none" />

                {trainer ? (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-4"
                    >
                        <p className="text-yellow-300 font-black text-lg">
                            {AVATAR_EMOJIS[trainer.avatarId]} {trainer.nickname} 트레이너, 어서오세요!
                        </p>
                        <div className="flex justify-center gap-4 mt-2">
                            <span className="bg-black/20 px-3 py-1 rounded-full text-white text-sm font-bold">⭐ {gameStore.score}점</span>
                            <span className="bg-black/20 px-3 py-1 rounded-full text-white text-sm font-bold">🎯 {gameStore.capturedPokemon.length}마리</span>
                        </div>
                    </motion.div>
                ) : null}

                <motion.h1
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, type: 'spring' }}
                    className="text-4xl md:text-6xl font-black text-white text-center mb-4 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                >
                    포켓몬 퀴즈 &amp; 도감
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-yellow-300 font-bold text-lg text-center mb-8"
                >
                    🙌 퀴즈를 풀고 포켓몬 마스터가 되어봐요!
                </motion.p>

                <div className="flex justify-center gap-4 md:gap-10 flex-wrap">
                    {HERO_POKEMON.map((p, i) => (
                        <FloatingPokemon key={p.id} pokemon={p} index={i} />
                    ))}
                </div>
            </div>

            {/* 오늘의 도전 배너 */}
            {dailyAvailable && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-5xl mb-6"
                >
                    <Link
                        to="/daily"
                        className="block bg-gradient-to-r from-amber-500 to-yellow-500 rounded-[2rem] p-5 border-2 border-yellow-300 shadow-2xl shadow-yellow-900/50 pokemon-card"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <span className="text-5xl animate-bounce">📅</span>
                                <div>
                                    <p className="text-black font-black text-2xl">오늘의 도전!</p>
                                    <p className="text-black/70 font-bold">5문제를 맞추고 보너스 점수를 획득하세요!</p>
                                </div>
                            </div>
                            <div className="bg-black/20 px-4 py-2 rounded-full text-black font-black text-sm whitespace-nowrap">
                                도전하기 →
                            </div>
                        </div>
                    </Link>
                </motion.div>
            )}

            {/* 트레이너 미등록 배너 */}
            {!trainer && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-5xl mb-6"
                >
                    <Link
                        to="/login"
                        className="block bg-gradient-to-r from-[#1a1a2e] to-[#252540] rounded-[2rem] p-5 border-2 border-yellow-500/50 shadow-xl pokemon-card"
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-5xl">🎮</span>
                            <div>
                                <p className="text-yellow-400 font-black text-xl">트레이너 등록하고 시작해요!</p>
                                <p className="text-gray-400">점수 저장, 업적, 오늘의 도전을 이용하려면 트레이너 등록이 필요해요.</p>
                            </div>
                        </div>
                    </Link>
                </motion.div>
            )}

            {/* 메뉴 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
                {MENU_CARDS.map((card, i) => (
                    <motion.div
                        key={card.to}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i, duration: 0.5, type: 'spring' }}
                    >
                        <Link
                            to={card.to}
                            className={`block rounded-[2rem] bg-gradient-to-br ${card.bg} p-7 border-2 ${card.border} shadow-2xl pokemon-card`}
                        >
                            <div className="text-5xl mb-4">{card.emoji}</div>
                            <h2 className="text-2xl font-black text-white mb-1">{card.title}</h2>
                            <p className="text-yellow-300 font-bold text-sm mb-3">{card.sub}</p>
                            <p className="text-white/70 text-sm leading-relaxed">{card.desc}</p>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
