import { motion } from 'framer-motion';

export default function About() {
    return (
        <div className="py-8 max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-4xl font-black text-white mb-6">📌 소개 (About)</h1>

                <div className="bg-[#1a1a2e] rounded-2xl p-8 border border-gray-700 space-y-6">
                    <section>
                        <h2 className="text-2xl font-black text-yellow-400 mb-3">🎮 포켓몬 퀴즈 & 도감이란?</h2>
                        <p className="text-gray-300 leading-relaxed text-base">
                            <strong>포켓몬 퀴즈 & 도감</strong>은 포켓몬을 사랑하는 팬들을 위해 만들어진 무료 팬메이드 웹사이트입니다.
                            관동 지방부터 팔데아 지방까지 전국 9개 지방의 포켓몬 정보를 한국어로 제공하며,
                            실루엣 퀴즈와 타입 퀴즈를 통해 재미있게 포켓몬을 학습할 수 있습니다.
                            퀴즈에서 맞춘 포켓몬은 '나의 도감'에 자동으로 등록되어, 나만의 포켓몬 도감을 완성해 나가는 즐거움을 느낄 수 있습니다.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-blue-400 mb-3">🌟 주요 기능</h2>
                        <ul className="text-gray-300 space-y-2 list-disc list-inside">
                            <li><strong>전국 포켓몬 도감:</strong> 관동(1세대)부터 팔데아(9세대)까지 모든 포켓몬 정보를 한국어로 제공합니다. 각 포켓몬의 타입, 스탯, 공식 아트워크를 확인할 수 있습니다.</li>
                            <li><strong>실루엣 퀴즈:</strong> 포켓몬의 그림자만 보고 이름을 맞추는 클래식한 퀴즈입니다. 정답을 맞추면 해당 포켓몬이 나의 도감에 등록됩니다.</li>
                            <li><strong>타입 퀴즈:</strong> 포켓몬 이미지를 보고 첫 번째 타입(속성)을 맞추는 퀴즈입니다. 불꽃, 물, 전기 등 18가지 타입 중 정답을 선택하세요.</li>
                            <li><strong>나의 도감:</strong> 퀴즈에서 맞춘 포켓몬들을 모아볼 수 있는 개인 도감입니다. 진행률을 확인하며 전부 완성하는 것을 목표로 해보세요!</li>
                            <li><strong>타입별 이펙트:</strong> 정답 시 해당 포켓몬 타입에 맞는 화려한 시각 효과(불꽃, 전기, 얼음 등)가 표시됩니다.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-green-400 mb-3">🛠️ 기술 스택</h2>
                        <p className="text-gray-300 leading-relaxed">
                            이 웹사이트는 <strong>React</strong>와 <strong>TypeScript</strong>로 구축되었으며,
                            <strong>Vite</strong>를 빌드 도구로 사용합니다.
                            포켓몬 데이터는 오픈소스 API인 <strong>PokeAPI</strong>에서 가져오며,
                            한국어 이름은 PokeAPI의 pokemon-species 엔드포인트에서 제공됩니다.
                            애니메이션은 <strong>Framer Motion</strong>을 활용했고,
                            스타일링은 <strong>Tailwind CSS</strong>를 사용하였습니다.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-purple-400 mb-3">📜 저작권 안내</h2>
                        <p className="text-gray-300 leading-relaxed">
                            포켓몬(Pokémon)은 <strong>닌텐도(Nintendo), 게임프리크(Game Freak), 크리처스(Creatures Inc.)</strong>의 등록 상표입니다.
                            이 웹사이트는 비상업적 팬메이드 프로젝트로, 공식 포켓몬 웹사이트가 아닙니다.
                            모든 포켓몬 이미지와 데이터는 PokeAPI를 통해 제공되며, 교육 및 엔터테인먼트 목적으로만 사용됩니다.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-orange-400 mb-3">👤 운영자 정보</h2>
                        <p className="text-gray-300 leading-relaxed">
                            이 웹사이트는 포켓몬을 사랑하는 한국 개발자가 운영하고 있습니다.
                            포켓몬 팬들에게 재미있고 유익한 콘텐츠를 제공하는 것이 목표입니다.
                            문의사항이 있으시면 <a href="/contact" className="text-yellow-400 underline hover:text-yellow-300">문의하기 페이지</a>를 이용해 주세요.
                        </p>
                    </section>
                </div>
            </motion.div>
        </div>
    );
}
