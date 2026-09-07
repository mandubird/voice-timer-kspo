import { TossAds, loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework'

export const AD_GROUP = {
  banner:       'ait.v2.live.1189523493324805',
  interstitial: 'ait.v2.live.ecaaea0ae4af449f',
} as const

// ─── 배너 광고 ────────────────────────────────────────────────────────────────

/**
 * target 엘리먼트에 배너 광고를 붙입니다.
 * Toss 앱 밖(브라우저 개발 환경)에서는 isSupported() === false 이므로 no-op.
 * @returns destroy 함수 (컴포넌트 unmount 시 호출)
 */
export function attachBannerAd(target: HTMLElement): (() => void) {
  if (!TossAds.attachBanner.isSupported()) return () => {}
  const result = TossAds.attachBanner(AD_GROUP.banner, target, {
    theme: 'auto',
    variant: 'card',
  })
  return () => result.destroy()
}

// ─── 전면 광고 ────────────────────────────────────────────────────────────────

let fullScreenLoaded = false
let fullScreenLoading = false

/** 앱 시작 시 미리 로드 (타이머 완료 시 즉시 표시하기 위해) */
export function preloadInterstitialAd(): void {
  if (!loadFullScreenAd.isSupported()) return
  if (fullScreenLoaded || fullScreenLoading) return
  fullScreenLoading = true
  loadFullScreenAd({
    options: { adGroupId: AD_GROUP.interstitial },
    onEvent: (e) => {
      if (e.type === 'loaded') {
        fullScreenLoaded = true
        fullScreenLoading = false
      }
    },
    onError: () => {
      fullScreenLoading = false
    },
  })
}

/**
 * 전면 광고를 표시합니다. 로드가 안 됐으면 no-op.
 * 광고 종료(dismissed) 후 onDone 콜백 호출.
 */
export function showInterstitialAd(onDone?: () => void): void {
  if (!showFullScreenAd.isSupported() || !fullScreenLoaded) {
    onDone?.()
    return
  }
  fullScreenLoaded = false
  showFullScreenAd({
    options: { adGroupId: AD_GROUP.interstitial },
    onEvent: (e) => {
      if (e.type === 'dismissed') {
        onDone?.()
        // 다음 번을 위해 다시 로드
        preloadInterstitialAd()
      }
    },
    onError: () => {
      onDone?.()
    },
  })
}
