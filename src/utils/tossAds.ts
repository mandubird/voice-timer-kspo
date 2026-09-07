import { TossAds, loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework'

export const AD_GROUP = {
  banner:       'ait.v2.live.1189523493324805',
  interstitial: 'ait.v2.live.ecaaea0ae4af449f',
} as const

/**
 * Toss 앱 SDK의 isSupported()는 Toss WebView 브릿지가 아예 없는 환경(일반 브라우저)에서는
 * false를 반환하지 않고 예외를 던진다. 그래서 모든 호출을 try/catch로 감싸 안전하게 no-op 처리한다.
 */
function safeIsSupported(check: () => boolean): boolean {
  try {
    return check()
  } catch {
    return false
  }
}

// ─── 배너 광고 ────────────────────────────────────────────────────────────────

/**
 * target 엘리먼트에 배너 광고를 붙입니다.
 * Toss 앱 밖(브라우저 개발 환경, 일반 웹 배포)에서는 isSupported 체크가 실패하거나
 * 예외를 던질 수 있으므로 no-op.
 * @returns destroy 함수 (컴포넌트 unmount 시 호출)
 */
export function attachBannerAd(target: HTMLElement): (() => void) {
  if (!safeIsSupported(() => TossAds.attachBanner.isSupported())) return () => {}
  try {
    const result = TossAds.attachBanner(AD_GROUP.banner, target, {
      theme: 'auto',
      variant: 'card',
    })
    return () => {
      try {
        result.destroy()
      } catch {
        // no-op
      }
    }
  } catch {
    return () => {}
  }
}

// ─── 전면 광고 ────────────────────────────────────────────────────────────────

let fullScreenLoaded = false
let fullScreenLoading = false

/** 앱 시작 시 미리 로드 (타이머 완료 시 즉시 표시하기 위해) */
export function preloadInterstitialAd(): void {
  if (!safeIsSupported(() => loadFullScreenAd.isSupported())) return
  if (fullScreenLoaded || fullScreenLoading) return
  fullScreenLoading = true
  try {
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
  } catch {
    fullScreenLoading = false
  }
}

/**
 * 전면 광고를 표시합니다. 로드가 안 됐으면 no-op.
 * 광고 종료(dismissed) 후 onDone 콜백 호출.
 */
export function showInterstitialAd(onDone?: () => void): void {
  if (!safeIsSupported(() => showFullScreenAd.isSupported()) || !fullScreenLoaded) {
    onDone?.()
    return
  }
  fullScreenLoaded = false
  try {
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
  } catch {
    onDone?.()
  }
}
