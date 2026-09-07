import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CountdownPage from './pages/CountdownPage'
import CountupPage from './pages/CountupPage'
import IntervalPage from './pages/IntervalPage'
import BrushingPage from './pages/BrushingPage'
import RunSessionPage from './pages/RunSessionPage'
import FitnessGoalPage from './pages/FitnessGoalPage'
import FacilityFinderPage from './pages/FacilityFinderPage'
import PresetsPage from './pages/PresetsPage'
import PrivacyPage from './pages/PrivacyPage'
import { PaywallModal } from './components/PaywallModal'
import { useSettingsStore } from './store/settingsStore'
import { preloadInterstitialAd } from './utils/tossAds'

export default function App() {
  const isPro = useSettingsStore((s) => s.isPro)

  // 무료 사용자: 앱 시작 시 전면광고 미리 로드
  useEffect(() => {
    if (!isPro) preloadInterstitialAd()
  }, [isPro])
  const paywallOpen = useSettingsStore((s) => s.paywallOpen)
  const paywallFeature = useSettingsStore((s) => s.paywallFeature)
  const closePaywall = useSettingsStore((s) => s.closePaywall)
  const openPaywall = useSettingsStore((s) => s.openPaywall)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/countdown" element={<CountdownPage />} />
        <Route
          path="/countup"
          element={<CountupPage onRequirePro={() => openPaywall('카운트업 코치')} />}
        />
        <Route path="/interval" element={<IntervalPage />} />
        <Route path="/brushing" element={<BrushingPage />} />
        <Route path="/session" element={<RunSessionPage />} />
        <Route path="/fitness-goal" element={<FitnessGoalPage />} />
        <Route path="/facilities" element={<FacilityFinderPage />} />
        <Route path="/presets" element={<PresetsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Routes>
      <PaywallModal
        open={paywallOpen && !isPro}
        onClose={() => closePaywall()}
        featureLabel={paywallFeature}
      />
    </BrowserRouter>
  )
}
