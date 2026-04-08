import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
    return (
        <div className="py-8 max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-4xl font-black text-white mb-6">🔐 개인정보처리방침</h1>
                <div className="bg-[#1a1a2e] rounded-2xl p-8 border border-gray-700 space-y-6 text-gray-300">
                    <section>
                        <h2 className="text-2xl font-black text-yellow-400 mb-3">1. 개인정보 수집 및 이용 목적</h2>
                        <p>본 사이트는 방문자에게 맞춤형 퀴즈 경험을 제공하기 위해 최소한의 쿠키와 로컬 스토리지를 사용합니다. 수집된 데이터는 퀴즈 진행 상황(맞힌 포켓몬, 진행률) 저장에만 활용되며, 외부에 전송되지 않습니다.</p>
                    </section>
                    <section>
                        <h2 className="text-2xl font-black text-yellow-400 mb-3">2. 수집하는 개인정보 항목</h2>
                        <ul className="list-disc list-inside space-y-2">
                            <li>브라우저 로컬 스토리지에 저장되는 포켓몬 도감 진행 데이터</li>
                            <li>쿠키에 저장되는 세션 식별자(선택적)</li>
                        </ul>
                    </section>
                    <section>
                        <h2 className="text-2xl font-black text-yellow-400 mb-3">3. 개인정보 보관 기간</h2>
                        <p>사용자가 브라우저 데이터를 삭제하거나 로컬 스토리지를 초기화할 때까지 보관됩니다. 서버에 저장되는 데이터는 없습니다.</p>
                    </section>
                    <section>
                        <h2 className="text-2xl font-black text-yellow-400 mb-3">4. 제3자 제공 및 공유</h2>
                        <p>본 서비스는 어떠한 개인정보도 제3자와 공유하지 않으며, 광고 수익을 위한 트래킹 쿠키도 사용하지 않습니다.</p>
                    </section>
                    <section>
                        <h2 className="text-2xl font-black text-yellow-400 mb-3">5. 이용자 권리</h2>
                        <p>이용자는 언제든지 브라우저 설정을 통해 쿠키를 차단하거나 로컬 스토리지를 삭제할 수 있습니다.</p>
                    </section>
                    <section>
                        <h2 className="text-2xl font-black text-yellow-400 mb-3">6. 연락처</h2>
                        <p>개인정보와 관련된 문의는 <a href="mailto:ehdnjs058759@gmail.com" className="text-blue-400 underline">ehdnjs058759@gmail.com</a> 으로 연락해 주세요.</p>
                    </section>
                </div>
            </motion.div>
        </div>
    );
}
