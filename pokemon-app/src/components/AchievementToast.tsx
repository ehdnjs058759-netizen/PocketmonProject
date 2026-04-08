import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { ACHIEVEMENTS } from '../data/achievements';

export default function AchievementToast() {
    const { newAchievement, clearNewAchievement } = useGameStore();

    const ach = newAchievement ? ACHIEVEMENTS.find(a => a.id === newAchievement) : null;

    useEffect(() => {
        if (!newAchievement) return;
        const t = setTimeout(clearNewAchievement, 4000);
        return () => clearTimeout(t);
    }, [newAchievement, clearNewAchievement]);

    return (
        <AnimatePresence>
            {ach && (
                <motion.div
                    key={ach.id}
                    initial={{ opacity: 0, y: -80, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: -80, x: '-50%' }}
                    className="fixed top-24 left-1/2 z-[9999] pointer-events-none"
                >
                    <div className="bg-gradient-to-r from-yellow-500 to-amber-400 text-black rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-4 border-2 border-yellow-300">
                        <span className="text-4xl">{ach.icon}</span>
                        <div>
                            <p className="font-black text-base leading-tight">🏆 업적 달성!</p>
                            <p className="font-black text-lg">{ach.title}</p>
                            <p className="text-sm font-bold opacity-80">{ach.desc}</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
