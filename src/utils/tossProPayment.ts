/**
 * 토스 미니앱 인앱결제 (IAP) — 비소모품 1회 결제
 *
 * 콘솔에서 상품 등록 후 SKU를 PRO_SKU와 일치시켜야 합니다.
 * 앱인토스 콘솔 → 내 앱 → 인앱결제 → 상품 관리
 */
import { IAP } from '@apps-in-toss/web-bridge'

/** 콘솔에 등록한 상품 ID (SKU) */
export const PRO_SKU = 'ait.0000025125.bfe6f190.b6f5470d7b.6594911440'

/**
 * Pro 업그레이드 인앱결제 요청.
 * - 결제 성공 → processProductGrant에서 onSuccess() 호출 후 true 반환
 * - 사용자 취소 → 조용히 무시
 * - 오류 → onError 콜백 (optional)
 * - cleanup 함수 반환 → 컴포넌트 언마운트 시 호출
 */
export function requestProIAP(callbacks: {
  onSuccess: () => void
  onError?: (code: string, message: string) => void
}): () => void {
  const cleanup = IAP.createOneTimePurchaseOrder({
    options: {
      sku: PRO_SKU,
      /**
       * 주문 생성 후 상품 지급 처리.
       * v1: 서버 검증 없이 클라이언트에서 Pro 권한 부여.
       * 향후 서버 영수증 검증 추가 시 여기서 API 호출.
       */
      processProductGrant: async (_params: { orderId: string }) => {
        try {
          callbacks.onSuccess()
          return true
        } catch {
          return false
        }
      },
    },
    onEvent: (_event) => {
      // 결제 완료 이벤트 — processProductGrant에서 이미 처리됨
    },
    onError: (error: unknown) => {
      const err = error as { code?: string; message?: string } | null
      const code = err?.code ?? 'UNKNOWN'
      const message = err?.message ?? '결제 중 오류가 발생했어요.'
      // 사용자 취소는 에러 콜백 생략
      if (code === 'USER_CANCELED') return
      callbacks.onError?.(code, message)
    },
  })

  return cleanup ?? (() => {})
}
