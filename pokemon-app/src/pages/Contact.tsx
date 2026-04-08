import { motion } from 'framer-motion';

export default function Contact() {
    return (
        <div className="py-8 max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-4xl font-black text-white mb-6">📧 문의하기</h1>
                <div className="bg-[#1a1a2e] rounded-2xl p-8 border border-gray-700 space-y-6 text-gray-300">
                    <p>포켓몬 퀴즈 & 도감에 대한 궁금한 점, 버그 리포트, 기능 제안 등은 아래 이메일로 연락 주세요.</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li><strong>일반 문의:</strong> <a href="mailto:support@pokemon-quiz.com" className="text-blue-400 underline">ehdnjs058759@gmail.com</a></li>
                        <li><strong>광고/제휴 문의:</strong> <a href="mailto:ads@pokemon-quiz.com" className="text-blue-400 underline">ehdnjs058759@gmail.com</a></li>
                    </ul>
                    <p>가능한 한 빠르게 답변드리겠습니다.</p>
                </div>
            </motion.div>
        </div>
    );
}
