import { useEffect, useRef } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { requestProIAP } from '../utils/tossProPayment'

interface PaywallModalProps {
  open: boolean
  onClose: () => void
  featureLabel?: string
}

export function PaywallModal({ open, onClose, featureLabel }: PaywallModalProps) {
  const setPro = useSettingsStore((s) => s.setPro)
  const cleanupRef = useRef<(() => void) | null>(null)

  // 모달 닫힐 때 IAP 리스너 정리
  useEffect(() => {
    if (!open) {
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [open])

  if (!open) return null

  const handlePurchase = () => {
    // 중복 호출 방지
    if (cleanupRef.current) return

    cleanupRef.current = requestProIAP({
      onSuccess: () => {
        setPro(true)
        cleanupRef.current = null
        onClose()
      },
      onError: (code, message) => {
        cleanupRef.current = null
        console.error(`[IAP] 결제 오류 ${code}: ${message}`)
        // 토스 앱 내부에서 에러 UI를 자체 처리하므로 별도 alert 불필요
      },
    })
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 px-4 pb-6 pt-10 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
        <h2 className="text-lg font-bold text-toss-text">
          프리미엄 말하는 타이머
        </h2>
        {featureLabel ? (
          <p className="mt-2 text-[15px] font-semibold text-[#101828]">{featureLabel}</p>
        ) : null}

        <ul className="mt-4 space-y-2">
          <li className="flex items-start gap-2 text-sm text-toss-text">
            <span className="mt-px text-[#2F6BFF]">✓</span>
            명상 3분·5분 · 수면 유도 · ASMR · 양치 코치 전체 이용
          </li>
          <li className="flex items-start gap-2 text-sm text-toss-text">
            <span className="mt-px text-[#2F6BFF]">✓</span>
            프리미엄 목소리 — 차분한 여성 음성
          </li>
          <li className="flex items-start gap-2 text-sm text-toss-text">
            <span className="mt-px text-[#2F6BFF]">✓</span>
            한국어 카운트업 코치 · 인터벌 리액션 멘트
          </li>
          <li className="flex items-start gap-2 text-sm text-toss-text">
            <span className="mt-px text-[#2F6BFF]">✓</span>
            광고 없이 깔끔하게
          </li>
        </ul>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            className="flex h-14 w-full items-center justify-center rounded-btn bg-toss-blue text-[15px] font-semibold text-white"
            onClick={handlePurchase}
          >
            2,970원 한 번 결제
          </button>
          <button
            type="button"
            className="flex h-11 w-full items-center justify-center rounded-btn bg-toss-gray text-[14px] font-medium text-toss-text"
            onClick={onClose}
          >
            무료로 계속 사용
          </button>
        </div>

        <p className="mt-3 text-center text-[11px] text-toss-sub">
          토스 간편결제 · 언제나 사용 가능 · 추가 요금 없음
        </p>
      </div>
    </div>
  )
}
