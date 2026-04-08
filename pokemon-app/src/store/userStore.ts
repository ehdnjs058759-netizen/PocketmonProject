import { useState, useEffect } from 'react';

// Use a simple local store logic so the app is immediately usable for kids.
export function useUserStore() {
    const [capturedPokemon, setCapturedPokemon] = useState<number[]>([]);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const saved = localStorage.getItem('capturedPokemon');
        if (saved) {
            setCapturedPokemon(JSON.parse(saved));
        }
        const savedScore = localStorage.getItem('pokemonScore');
        if (savedScore) {
            setScore(parseInt(savedScore, 10));
        }
    }, []);

    const addCaptured = (id: number) => {
        if (!capturedPokemon.includes(id)) {
            const updatedList = [...capturedPokemon, id];
            setCapturedPokemon(updatedList);
            localStorage.setItem('capturedPokemon', JSON.stringify(updatedList));
            const newScore = score + 10;
            setScore(newScore);
            localStorage.setItem('pokemonScore', newScore.toString());
        }
    };

    return { capturedPokemon, score, addCaptured };
}
