// 포켓몬 한국어 이름 캐시 (localStorage + 메모리)
const memoryCache: Record<number, string> = {};

const LS_KEY = 'pokemon_ko_names';

function loadFromLocalStorage(): Record<number, string> {
    try {
        const saved = localStorage.getItem(LS_KEY);
        if (saved) return JSON.parse(saved);
    } catch { }
    return {};
}

function saveToLocalStorage(cache: Record<number, string>) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(cache));
    } catch { }
}

// 앱 시작 시 localStorage에서 불러오기
const lsCache = loadFromLocalStorage();
Object.assign(memoryCache, lsCache);

/**
 * 단일 포켓몬의 한국어 이름을 가져옵니다.
 */
export async function getKoreanName(id: number): Promise<string> {
    if (memoryCache[id]) return memoryCache[id];

    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}/`);
        const data = await res.json();
        const koName = data.names.find((n: any) => n.language.name === 'ko');
        const name = koName?.name ?? data.name;
        memoryCache[id] = name;
        saveToLocalStorage(memoryCache);
        return name;
    } catch {
        return `#${id}`;
    }
}

/**
 * 여러 포켓몬의 한국어 이름을 병렬로 가져옵니다.
 */
export async function getKoreanNames(ids: number[]): Promise<Record<number, string>> {
    const result: Record<number, string> = {};
    const toFetch = ids.filter(id => !memoryCache[id]);

    // 이미 캐시된 것 먼저 처리
    ids.forEach(id => {
        if (memoryCache[id]) result[id] = memoryCache[id];
    });

    if (toFetch.length === 0) return result;

    // 병렬 fetch (한 번에 최대 20개씩) 
    const chunkSize = 20;
    for (let i = 0; i < toFetch.length; i += chunkSize) {
        const chunk = toFetch.slice(i, i + chunkSize);
        const fetched = await Promise.all(
            chunk.map(id =>
                fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}/`)
                    .then(r => r.json())
                    .then(data => {
                        const koName = data.names.find((n: any) => n.language.name === 'ko');
                        const name = koName?.name ?? data.name;
                        memoryCache[id] = name;
                        return { id, name };
                    })
                    .catch(() => ({ id, name: `#${id}` }))
            )
        );
        fetched.forEach(({ id, name }) => { result[id] = name; });
        saveToLocalStorage(memoryCache);
    }

    return result;
}

/**
 * 캐시에서만 가져옵니다 (비동기 없이).
 */
export function getCachedKoreanName(id: number): string | null {
    return memoryCache[id] ?? null;
}
