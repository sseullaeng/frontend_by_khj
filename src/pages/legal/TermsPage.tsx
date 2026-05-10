// 이용약관 페이지 — 정적 콘텐츠 (마크업으로 작성)
//
// 추후 백엔드 CMS 또는 다국어가 필요하면 별도 endpoint 로 동적 로드 전환.
import { Link, useSearchParams } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'

type Tab = 'service' | 'privacy'

const TABS: { key: Tab; label: string }[] = [
  { key: 'service', label: '이용약관' },
  { key: 'privacy', label: '개인정보 처리방침' },
]

export default function TermsPage() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'service'

  return (
    <div className="max-w-3xl mx-auto w-full">
      <h1 className="text-xl font-bold text-gray-900 mb-4">약관 및 정책</h1>

      <div className="border-b border-gray-200 flex">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setParams({ tab: t.key })}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.key
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <article className="prose prose-sm max-w-none mt-6 text-gray-700 leading-relaxed">
        {tab === 'service' ? <ServiceTerms /> : <PrivacyPolicy />}
      </article>

      <div className="mt-10 pt-6 border-t border-gray-100 text-center">
        <Link to="/" className="text-sm text-primary-600 hover:underline">
          홈으로
        </Link>
      </div>
    </div>
  )
}

function ServiceTerms() {
  return (
    <>
      <p className="text-xs text-gray-400">최종 갱신: 2026-05-10</p>

      <Section title="제1조 (목적)">
        본 약관은 쓸랭 주식회사(이하 "회사")가 제공하는 중고거래·대여·나눔·배달대행 통합 서비스
        "쓸랭"(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무, 책임 사항 및 기타
        필요한 사항을 규정함을 목적으로 합니다.
      </Section>

      <Section title="제2조 (정의)">
        <ul>
          <li>"회원"이란 본 약관에 동의하고 회사가 정한 절차에 따라 가입한 자를 말합니다.</li>
          <li>"포인트"란 서비스 내에서 거래 결제·정산에 사용되는 가상 자산을 의미합니다.</li>
          <li>"거래대행"이란 라이더가 판매자의 물품을 구매자에게 배송하는 서비스를 의미합니다.</li>
        </ul>
      </Section>

      <Section title="제3조 (약관의 효력 및 변경)">
        본 약관은 회원가입 시 동의함으로써 효력이 발생합니다. 회사는 필요한 경우 약관을
        변경할 수 있으며, 변경된 약관은 서비스 내 공지를 통해 안내합니다.
      </Section>

      <Section title="제4조 (회원 가입 및 이메일 인증)">
        회원 가입은 만 14세 이상의 자에 한하여 가능하며, 가입 시 이메일 인증이 필요합니다.
        타인의 정보를 도용하거나 허위 정보를 기재한 경우 이용이 제한될 수 있습니다.
      </Section>

      <Section title="제5조 (거래 정책)">
        모든 거래는 회원 간 직거래·대여·나눔을 원칙으로 하며, 회사는 거래의 당사자가 아닙니다.
        다만 거래대행 서비스 신청 시 회사는 라이더 매칭, 결제 보관 (escrow hold), 정산을 중개합니다.
      </Section>

      <Section title="제6조 (포인트 및 결제)">
        충전된 포인트는 결제·출금에 사용됩니다. 거래 예약 시 구매자의 포인트는 보관되며 (hold),
        양쪽의 인계·인수 확인이 모두 완료될 때 판매자에게 정산됩니다.
      </Section>

      <Section title="제7조 (이용 제한 및 탈퇴)">
        회원이 본 약관 또는 관계 법령을 위반한 경우 회사는 서비스 이용을 일시 정지하거나
        탈퇴 처리할 수 있습니다. 회원은 언제든지 회원 탈퇴를 신청할 수 있습니다.
      </Section>

      <Section title="제8조 (책임의 제한)">
        회사는 천재지변, 시스템 장애 등 회사가 통제할 수 없는 사유로 인한 서비스 중단에 대해
        책임을 지지 않습니다. 회원 간 거래로 발생한 분쟁에 대해 회사는 직접 당사자가 아니며,
        분쟁 조정에 협조할 수 있습니다.
      </Section>
    </>
  )
}

function PrivacyPolicy() {
  return (
    <>
      <p className="text-xs text-gray-400">최종 갱신: 2026-05-10</p>

      <Section title="1. 수집하는 개인정보 항목">
        <ul>
          <li>필수: 이메일, 닉네임, 비밀번호 (소셜 로그인 시 일부 대체)</li>
          <li>선택: 프로필 이미지, 거래 희망 지역</li>
          <li>거래대행 시: 픽업/배달 주소, 수령인 연락처</li>
          <li>자동 수집: 서비스 이용 기록, 접속 로그, 쿠키 (XSRF-TOKEN, AT, RT)</li>
        </ul>
      </Section>

      <Section title="2. 개인정보의 이용 목적">
        <ul>
          <li>회원 관리, 본인 확인 및 부정 이용 방지</li>
          <li>서비스 제공 (거래 매칭, 결제, 정산, 배송)</li>
          <li>고객 문의 응대, 공지사항 전달</li>
          <li>서비스 개선을 위한 통계 분석</li>
        </ul>
      </Section>

      <Section title="3. 개인정보의 보유 및 이용 기간">
        회원 탈퇴 시 즉시 파기합니다. 단, 관련 법령에 따라 보존이 필요한 경우 (전자상거래법
        등) 해당 기간 동안 보관합니다 — 거래 기록 5년, 부정 이용 기록 1년.
      </Section>

      <Section title="4. 제3자 제공">
        원칙적으로 개인정보를 외부에 제공하지 않습니다. 다만 다음의 경우 예외로 합니다:
        <ul>
          <li>회원이 사전에 동의한 경우</li>
          <li>법령에 의거한 요청이 있는 경우</li>
          <li>거래대행 라이더에게 픽업/배달 주소·수령인 연락처 (배달 진행 목적)</li>
        </ul>
      </Section>

      <Section title="5. 회원의 권리">
        회원은 언제든지 자신의 개인정보를 조회·수정할 수 있으며, 가입 해지를 통해 동의 철회를
        요청할 수 있습니다. 마이페이지 또는 고객센터를 통해 이용 가능합니다.
      </Section>

      <Section title="6. 보안 조치">
        비밀번호는 단방향 암호화하여 저장하며, 인증 토큰은 HttpOnly 쿠키로 관리하여
        XSS 공격으로부터 보호합니다. 모든 통신은 HTTPS 로 암호화됩니다.
      </Section>

      <Section title="7. 문의처">
        개인정보 처리 관련 문의는 고객센터 또는 <a href="mailto:help@sseulang.com" className="text-primary-600">help@sseulang.com</a> 으로 연락 주세요.
      </Section>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-base font-semibold text-gray-900 mb-2 mt-6">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed">{children}</div>
    </section>
  )
}
