import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, AVATAR_EMOJIS, AVATAR_NAMES, REGIONS_KO } from '../store/authStore';

type Mode    = 'login' | 'register';
type RegStep = 'account' | 'trainer';

export default function Login() {
    const navigate = useNavigate();
    const { login, register, checkUserId } = useAuthStore();

    const [mode, setMode]       = useState<Mode>('login');
    const [regStep, setRegStep] = useState<RegStep>('account');
    const [busy, setBusy]       = useState(false);

    const [userId, setUserId]     = useState('');
    const [password, setPassword] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [nickname, setNickname] = useState('');
    const [avatarId, setAvatarId] = useState(0);
    const [region, setRegion]     = useState('관동');
    const [error, setError]       = useState('');

    // 아이디 중복확인 상태
    const [idChecked, setIdChecked]   = useState(false);   // 확인 완료 여부
    const [idChecking, setIdChecking] = useState(false);   // 확인 중
    const [idCheckMsg, setIdCheckMsg] = useState('');      // 결과 메시지
    const [idAvailable, setIdAvailable] = useState(false); // 사용 가능 여부

    const reset = () => {
        setUserId(''); setPassword(''); setConfirmPw('');
        setNickname(''); setAvatarId(0); setRegion('관동');
        setError(''); setRegStep('account'); setBusy(false);
        setIdChecked(false); setIdChecking(false);
        setIdCheckMsg(''); setIdAvailable(false);
    };
    const switchMode = (m: Mode) => { reset(); setMode(m); };

    // ── 로그인 ──────────────────────────────────────────────
    const handleLogin = async () => {
        setError('');
        if (!userId.trim()) { setError('ID를 입력해주세요!'); return; }
        if (!password)      { setError('비밀번호를 입력해주세요!'); return; }
        setBusy(true);
        const res = await login(userId, password);
        setBusy(false);
        if (!res.success) { setError(res.error ?? '로그인 실패'); return; }
        navigate('/', { replace: true });
    };

    // ── 아이디 중복확인 ──────────────────────────────────────
    const handleCheckId = async () => {
        setIdCheckMsg(''); setIdChecked(false); setIdAvailable(false);
        if (!/^[a-zA-Z0-9_]{4,20}$/.test(userId.trim()))
            { setIdCheckMsg('ID: 영문·숫자·_ 4~20자'); return; }
        setIdChecking(true);
        const res = await checkUserId(userId);
        setIdChecking(false);
        setIdChecked(true);
        setIdAvailable(res.available);
        setIdCheckMsg(res.available ? '사용 가능한 ID예요!' : (res.error ?? '사용 불가'));
    };

    // ── 회원가입 1단계 검증 ──────────────────────────────────
    const handleNextStep = () => {
        setError('');
        if (!idChecked || !idAvailable)
            { setError('아이디 중복확인을 해주세요!'); return; }
        if (password.length < 6)
            { setError('비밀번호는 6자 이상!'); return; }
        if (password !== confirmPw)
            { setError('비밀번호가 일치하지 않아요!'); return; }
        if (nickname.trim().length < 2)
            { setError('닉네임은 2자 이상!'); return; }
        if (userId.trim().toLowerCase() === nickname.trim().toLowerCase())
            { setError('ID와 닉네임을 다르게 설정해주세요!'); return; }
        setRegStep('trainer');
    };

    // ── 회원가입 최종 ────────────────────────────────────────
    const handleRegister = async () => {
        setError('');
        setBusy(true);
        const res = await register(userId, password, nickname, avatarId, region);
        setBusy(false);
        if (!res.success) { setError(res.error ?? '가입 실패'); return; }
        navigate('/', { replace: true });
    };

    return (
        <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
            {/* 상단 내비게이션 바 */}
            <nav className="w-full bg-[#CC0000] border-b-4 border-[#aa0000] py-3 px-6 flex items-center justify-between shadow-lg shadow-red-900/60">
                <a href="/" className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full border-4 border-white relative overflow-hidden shadow-lg flex-shrink-0">
                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-red-600" />
                        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white" />
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-black -translate-y-1/2" />
                        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-white border-2 border-black rounded-full -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <span className="text-white font-black text-lg hidden sm:block drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                        포켓몬 퀴즈 &amp; 도감
                    </span>
                </a>
                <a
                    href="/"
                    className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-black px-4 py-2 rounded-full text-sm transition-colors shadow-lg"
                >
                    🏠 홈으로
                </a>
            </nav>

            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* 포켓볼 로고 */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-20 h-20 rounded-full border-4 border-white relative overflow-hidden shadow-2xl mb-4">
                            <div className="absolute top-0 left-0 right-0 h-1/2 bg-red-600" />
                            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white" />
                            <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-black -translate-y-1/2" />
                            <div className="absolute top-1/2 left-1/2 w-5 h-5 bg-white border-2 border-black rounded-full -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <h1 className="text-3xl font-black text-white">포켓몬 퀴즈 &amp; 도감</h1>
                        <p className="text-gray-400 mt-1 text-sm">
                            {mode === 'login' ? '트레이너 로그인' : '새 트레이너 등록'}
                        </p>
                    </div>

                    {/* 모드 탭 */}
                    <div className="flex bg-[#1a1a2e] rounded-full p-1 mb-6 border border-gray-700">
                        {(['login', 'register'] as Mode[]).map(m => (
                            <button
                                key={m}
                                onClick={() => switchMode(m)}
                                disabled={busy}
                                className={`flex-1 py-2.5 rounded-full font-black text-sm transition-all
                                    ${mode === m
                                        ? 'bg-[#EE1515] text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white'}`}
                            >
                                {m === 'login' ? '🔑 로그인' : '✨ 회원가입'}
                            </button>
                        ))}
                    </div>

                    {/* 에러 메시지 */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="bg-red-900/50 border border-red-600 text-red-300 font-bold text-sm px-4 py-3 rounded-2xl mb-4 text-center"
                            >
                                ⚠️ {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div
                        key={mode + regStep}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-[#1a1a2e] rounded-[2rem] p-8 border border-gray-700 shadow-2xl"
                    >
                        {/* ── 로그인 ── */}
                        {mode === 'login' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-400 text-xs font-bold mb-1.5 uppercase tracking-wider">ID</label>
                                    <input
                                        type="text"
                                        value={userId}
                                        onChange={e => { setUserId(e.target.value); setError(''); }}
                                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                        placeholder="영문·숫자·_"
                                        autoFocus
                                        autoComplete="username"
                                        disabled={busy}
                                        className="w-full bg-[#252540] border-2 border-gray-600 focus:border-yellow-400 text-white px-4 py-3 rounded-2xl outline-none transition-colors text-lg disabled:opacity-60"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-xs font-bold mb-1.5 uppercase tracking-wider">비밀번호</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => { setPassword(e.target.value); setError(''); }}
                                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                        placeholder="6자 이상"
                                        autoComplete="current-password"
                                        disabled={busy}
                                        className="w-full bg-[#252540] border-2 border-gray-600 focus:border-yellow-400 text-white px-4 py-3 rounded-2xl outline-none transition-colors text-lg disabled:opacity-60"
                                    />
                                </div>
                                <button
                                    onClick={handleLogin}
                                    disabled={busy}
                                    className="w-full bg-[#EE1515] hover:bg-red-500 text-white font-black text-lg py-4 rounded-2xl transition-colors mt-2 shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {busy
                                        ? <><span className="animate-spin">⚙️</span> 로그인 중...</>
                                        : '🎮 로그인'}
                                </button>
                            </div>
                        )}

                        {/* ── 회원가입 1단계: 계정 정보 ── */}
                        {mode === 'register' && regStep === 'account' && (
                            <div className="space-y-4">
                                <p className="text-yellow-400 font-black text-sm text-center mb-2">1/2 — 계정 정보</p>
                                <div>
                                    <label className="block text-gray-400 text-xs font-bold mb-1.5 uppercase tracking-wider">ID</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={userId}
                                            onChange={e => {
                                                setUserId(e.target.value);
                                                setError('');
                                                setIdChecked(false);
                                                setIdAvailable(false);
                                                setIdCheckMsg('');
                                            }}
                                            placeholder="영문·숫자·_ 4~20자"
                                            autoFocus
                                            autoComplete="username"
                                            className="flex-1 bg-[#252540] border-2 border-gray-600 focus:border-yellow-400 text-white px-4 py-3 rounded-2xl outline-none transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleCheckId}
                                            disabled={idChecking || !userId.trim()}
                                            className="px-4 py-3 rounded-2xl font-black text-sm whitespace-nowrap transition-colors disabled:opacity-50
                                                bg-blue-600 hover:bg-blue-500 text-white"
                                        >
                                            {idChecking ? '확인 중...' : '중복확인'}
                                        </button>
                                    </div>
                                    {idCheckMsg && (
                                        <p className={`text-xs font-bold mt-1.5 ${idAvailable ? 'text-green-400' : 'text-red-400'}`}>
                                            {idAvailable ? '✅' : '❌'} {idCheckMsg}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-xs font-bold mb-1.5 uppercase tracking-wider">비밀번호</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => { setPassword(e.target.value); setError(''); }}
                                        placeholder="6자 이상"
                                        autoComplete="new-password"
                                        className="w-full bg-[#252540] border-2 border-gray-600 focus:border-yellow-400 text-white px-4 py-3 rounded-2xl outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-xs font-bold mb-1.5 uppercase tracking-wider">비밀번호 확인</label>
                                    <input
                                        type="password"
                                        value={confirmPw}
                                        onChange={e => { setConfirmPw(e.target.value); setError(''); }}
                                        placeholder="비밀번호 재입력"
                                        autoComplete="new-password"
                                        className="w-full bg-[#252540] border-2 border-gray-600 focus:border-yellow-400 text-white px-4 py-3 rounded-2xl outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-xs font-bold mb-1.5 uppercase tracking-wider">닉네임</label>
                                    <input
                                        type="text"
                                        value={nickname}
                                        onChange={e => { setNickname(e.target.value); setError(''); }}
                                        placeholder="2~12자 (게임 내 표시 이름)"
                                        maxLength={12}
                                        className="w-full bg-[#252540] border-2 border-gray-600 focus:border-yellow-400 text-white px-4 py-3 rounded-2xl outline-none transition-colors"
                                    />
                                    {nickname.trim() && userId.trim() &&
                                     nickname.trim().toLowerCase() === userId.trim().toLowerCase() && (
                                        <p className="text-xs font-bold mt-1.5 text-red-400">
                                            ❌ ID와 닉네임을 다르게 설정해주세요!
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={handleNextStep}
                                    className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black text-lg py-4 rounded-2xl transition-colors mt-2"
                                >
                                    다음 → 트레이너 설정
                                </button>
                            </div>
                        )}

                        {/* ── 회원가입 2단계: 트레이너 설정 ── */}
                        {mode === 'register' && regStep === 'trainer' && (
                            <div>
                                <p className="text-yellow-400 font-black text-sm text-center mb-4">2/2 — 트레이너 설정</p>

                                {/* 아바타 */}
                                <p className="text-gray-400 text-xs font-bold mb-2 uppercase tracking-wider">아바타</p>
                                <div className="grid grid-cols-4 gap-2 mb-5">
                                    {AVATAR_EMOJIS.map((emoji, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setAvatarId(i)}
                                            disabled={busy}
                                            className={`flex flex-col items-center py-2 px-1 rounded-xl border-2 transition-all
                                                ${avatarId === i
                                                    ? 'border-yellow-400 bg-yellow-400/20 scale-110'
                                                    : 'border-gray-600 bg-[#252540] hover:border-gray-400'}`}
                                        >
                                            <span className="text-3xl">{emoji}</span>
                                            <span className="text-[10px] text-gray-400 mt-0.5">{AVATAR_NAMES[i]}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* 지방 */}
                                <p className="text-gray-400 text-xs font-bold mb-2 uppercase tracking-wider">출신 지방</p>
                                <div className="grid grid-cols-3 gap-1.5 mb-5">
                                    {REGIONS_KO.map(r => (
                                        <button
                                            key={r}
                                            onClick={() => setRegion(r)}
                                            disabled={busy}
                                            className={`py-2 rounded-xl font-bold text-sm border-2 transition-all
                                                ${region === r
                                                    ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300'
                                                    : 'border-gray-600 bg-[#252540] text-gray-300 hover:border-gray-400'}`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>

                                {/* 미리보기 */}
                                <div className="bg-[#252540] rounded-2xl p-3 mb-5 flex items-center gap-3 border border-gray-600">
                                    <span className="text-4xl">{AVATAR_EMOJIS[avatarId]}</span>
                                    <div>
                                        <p className="font-black text-white">{nickname}</p>
                                        <p className="text-gray-400 text-xs">{userId} · {region} 출신</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setRegStep('account')}
                                        disabled={busy}
                                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-black py-3 rounded-2xl disabled:opacity-60"
                                    >
                                        ← 뒤로
                                    </button>
                                    <button
                                        onClick={handleRegister}
                                        disabled={busy}
                                        className="flex-1 bg-[#EE1515] hover:bg-red-500 text-white font-black py-3 rounded-2xl shadow-lg disabled:opacity-60 flex items-center justify-center gap-1"
                                    >
                                        {busy
                                            ? <><span className="animate-spin">⚙️</span> 처리 중...</>
                                            : '🎮 가입 완료!'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
