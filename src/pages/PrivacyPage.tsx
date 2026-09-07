import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-white">
      <header className="flex items-center px-4 py-4 border-b border-[#F0F2F5]">
        <Link to="/" className="text-sm font-medium text-[#7A7F8A] mr-4">← 홈</Link>
        <h1 className="text-[16px] font-bold text-[#101828]">개인정보처리방침</h1>
      </header>

      <main className="px-5 py-6 max-w-2xl mx-auto prose prose-sm text-[#333]">
        <p className="text-[13px] text-[#888] mb-6">시행일: 2025년 4월 1일</p>

        <section className="mb-6">
          <h2 className="text-[15px] font-bold text-[#101828] mb-2">1. 수집하는 개인정보 항목</h2>
          <p className="text-[14px] leading-relaxed text-[#444]">
            말하는 타이머(이하 "서비스")는 다음의 개인정보를 수집합니다.
          </p>
          <ul className="mt-2 text-[14px] leading-relaxed text-[#444] list-disc pl-5 space-y-1">
            <li>서비스 이용 기록 (타이머 설정, 최근 사용 프리셋) — 기기 로컬 저장소에만 저장</li>
            <li>결제 정보 — 유료 기능 이용 시 토스페이먼츠를 통해 처리 (당사는 카드 정보를 직접 저장하지 않음)</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-[15px] font-bold text-[#101828] mb-2">2. 개인정보 수집 및 이용 목적</h2>
          <ul className="text-[14px] leading-relaxed text-[#444] list-disc pl-5 space-y-1">
            <li>서비스 제공 및 운영</li>
            <li>유료 기능(Pro) 결제 처리 및 이용 권한 확인</li>
            <li>서비스 품질 개선</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-[15px] font-bold text-[#101828] mb-2">3. 개인정보 보유 및 이용 기간</h2>
          <ul className="text-[14px] leading-relaxed text-[#444] list-disc pl-5 space-y-1">
            <li>서비스 이용 기록: 사용자가 직접 삭제하거나 앱 데이터 초기화 시까지 기기 내 보관</li>
            <li>결제 관련 기록: 전자상거래법에 따라 5년 보관</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-[15px] font-bold text-[#101828] mb-2">4. 개인정보의 제3자 제공</h2>
          <p className="text-[14px] leading-relaxed text-[#444]">
            서비스는 사용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 결제 처리를 위해 토스페이먼츠(주)에 필요한 정보를 제공할 수 있으며, 법령에 따른 경우는 예외로 합니다.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-[15px] font-bold text-[#101828] mb-2">5. 개인정보 처리 위탁</h2>
          <div className="text-[14px] leading-relaxed text-[#444]">
            <p>서비스는 원활한 결제 처리를 위해 아래와 같이 업무를 위탁합니다.</p>
            <table className="mt-2 w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#F5F6F8]">
                  <th className="text-left px-3 py-2 border border-[#E0E0E0]">수탁업체</th>
                  <th className="text-left px-3 py-2 border border-[#E0E0E0]">위탁 업무</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 border border-[#E0E0E0]">토스페이먼츠(주)</td>
                  <td className="px-3 py-2 border border-[#E0E0E0]">결제 처리 및 본인 확인</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-[15px] font-bold text-[#101828] mb-2">6. 사용자의 권리</h2>
          <p className="text-[14px] leading-relaxed text-[#444]">
            사용자는 언제든지 기기의 앱 데이터 초기화를 통해 로컬에 저장된 정보를 삭제할 수 있습니다. 결제 관련 정보 삭제 요청은 아래 이메일로 문의해 주세요.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-[15px] font-bold text-[#101828] mb-2">7. 개인정보 보호책임자</h2>
          <ul className="text-[14px] leading-relaxed text-[#444] list-none pl-0 space-y-1">
            <li>이름: 최영재</li>
            <li>이메일: <a href="mailto:eunhaebleu@naver.com" className="text-[#2F6BFF] underline">eunhaebleu@naver.com</a></li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-[15px] font-bold text-[#101828] mb-2">8. 개정 이력</h2>
          <ul className="text-[14px] leading-relaxed text-[#444] list-disc pl-5 space-y-1">
            <li>2025년 4월 1일 — 최초 제정</li>
          </ul>
        </section>
      </main>
    </div>
  )
}
