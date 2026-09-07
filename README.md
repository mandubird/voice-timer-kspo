# Voice Coach Timer

토스 미니앱용 **음성 코치 타이머** (React + TypeScript + Vite).

상세 명세: [`CURSOR_AI_MASTER_SPEC.md`](./CURSOR_AI_MASTER_SPEC.md)

## 개발 서버

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
npm run preview
```

## Step 1 완료 항목

- Vite React-TS 프로젝트 (워크스페이스 루트)
- Tailwind CSS v4 (`@tailwindcss/vite`) + 명세 §9 컬러/폰트 토큰
- Pretendard CDN (`index.html`)
- React Router — 7개 라우트 (`/`, `/countdown`, `/countup`, `/interval`, `/brushing`, `/session`, `/presets`)
- Zustand 스토어 스텁: `sessionStore`, `settingsStore`, `presetStore`
- 홈 화면: `ModeCard` + `lucide-react` 아이콘, 양치 카드 파스텔 스타일, 하단 프리셋 버튼

- **Step 2**: 카운트다운 / 카운트업 / 인터벌 설정 화면  
- **Step 3**: `RunSessionPage` + `useTimer` + Zustand 세션 틱(카운트다운·업·인터벌)  
- **Step 4**: `useVoice` + `speechUtils` (Web Speech — iOS Safari에서는 버튼 탭(사용자 제스처) 이후에만 음성 재생 가능)  
- **Step 5**: 양치 모드 — `BrushingPage`, `brushingScripts`, `useBrushingScript`, 세션 연동  
- **Step 6**: `data/presets.ts` 기본 4종 + `PresetCard` + `PresetsPage`에서 탭 시 바로 `/session`

- **Step 7**: `useVibration`, `soundEffects`(Web Audio 비프/완료음), `useSessionFeedback`로 세션 중 진동·효과음 연동  
- **Step 8**: `PaywallModal`, `settingsStore.isPro` 플래그, 카운트업 한국어·양치 음성·에너지 톤에 무료/Pro 분기 적용

이후: 실제 결제 연동 및 Pro 상태 영속화는 v2에서 추가
