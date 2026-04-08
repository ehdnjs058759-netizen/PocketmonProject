export interface Region {
  id: number;
  name: string;
  sub: string;
  offset: number;
  limit: number;
  color: string;
  glow: string;
}

export const REGIONS: Region[] = [
  { id: 1, name: '관동', sub: '1세대 · #001~151',   offset: 0,   limit: 151, color: 'bg-blue-600',   glow: '#6390F0' },
  { id: 2, name: '성도', sub: '2세대 · #152~251',   offset: 151, limit: 100, color: 'bg-yellow-600', glow: '#F7D02C' },
  { id: 3, name: '호연', sub: '3세대 · #252~386',   offset: 251, limit: 135, color: 'bg-green-600',  glow: '#7AC74C' },
  { id: 4, name: '신오', sub: '4세대 · #387~493',   offset: 386, limit: 107, color: 'bg-slate-600',  glow: '#96D9D6' },
  { id: 5, name: '하나', sub: '5세대 · #494~649',   offset: 493, limit: 156, color: 'bg-gray-700',   glow: '#A8A77A' },
  { id: 6, name: '칼로스', sub: '6세대 · #650~721', offset: 649, limit: 72,  color: 'bg-pink-700',   glow: '#F95587' },
  { id: 7, name: '알로라', sub: '7세대 · #722~809', offset: 721, limit: 88,  color: 'bg-orange-600', glow: '#EE8130' },
  { id: 8, name: '가라르', sub: '8세대 · #810~905', offset: 809, limit: 96,  color: 'bg-purple-700', glow: '#6F35FC' },
  { id: 9, name: '팔데아', sub: '9세대 · #906~1025',offset: 905, limit: 120, color: 'bg-rose-700',   glow: '#F95587' },
];

/** 전세대 포켓몬 수 */
export const MAX_POKEMON = 1025;
