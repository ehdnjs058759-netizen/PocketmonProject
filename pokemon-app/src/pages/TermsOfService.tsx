import { motion } from 'framer-motion';

export default function TermsOfService() {
    return (
        <div className="py-8 max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-4xl font-black text-white mb-6">📜 이용약관</h1>
                <div className="bg-[#1a1a2e] rounded-2xl p-8 border border-gray-700 space-y-6 text-gray-300">
                    <section>
                        <h2 className="text-2xl font-black text-yellow-400 mb-3">1. 서비스 이용</h2>
                        <p>본 사이트는 포켓몬 퀴즈와 도감 서비스를 무료로 제공합니다. 사용자는 본 약관에 동의함으로써 서비스를 이용할 수 있습니다.</p>
                    </section>
                    <section>
                        <h2 className="text-2xl font-black text-yellow-400 mb-3">2. 지적 재산권</h2>
                        <p>포켓몬 이미지 및 데이터는 PokeAPI와 닌텐도 등 공식 소유자의 저작권을 따릅니다. 본 사이트는 비상업적 팬 메이드 프로젝트이며, 상업적 이용을 금지합니다.</p>
                    </section>
                    <section>
                        <h2 className="text-2xl font-black text-yellow-400 mb-3">3. 면책 조항</h2>
                        <p>제공되는 데이터와 퀴즈 결과는 참고용이며, 정확성을 보장하지 않습니다. 서비스 이용으로 발생한 손해에 대해 책임을 지지 않습니다.</p>
                    </section>
                    <section>
                        <h2 className="text-2xl font-black text-yellow-400 mb-3">4. 변경 및 종료</h2>
                        <p>운영자는 사전 고지 없이 약관 및 서비스를 변경하거나 종료할 수 있습니다.</p>
                    </section>
                    <section>
                        <h2 className="text-2xl font-black text-yellow-400 mb-3">5. 연락처</h2>
                        <p>이용약관에 관한 문의는 <a href="mailto:terms@pokemon-quiz.com" className="text-blue-400 underline">terms@pokemon-quiz.com</a> 으로 연락해 주세요.</p>
                    </section>
                </div>
            </motion.div>
        </div>
    );
}
