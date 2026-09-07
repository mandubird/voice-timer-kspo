# Voice Coach Timer — Cursor용 API 구조 + React UI 구조 문서

## 1. 목표
이 문서는 Cursor AI에게 바로 전달해서 Voice Coach Timer MVP 1.1을 구현하기 위한 기술 설계 문서입니다.

목표는 다음과 같습니다.
- 토스 미니앱 또는 일반 웹앱으로 바로 개발 가능한 구조 제시
- 프론트엔드 우선 MVP 개발
- 복잡한 백엔드 없이도 작동 가능한 설계
- 이후 유료 기능, 저장 기능, 통계 기능 확장이 가능한 구조

---

## 2. 기술 방향
### 추천 스택
- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS
- State: Zustand 또는 React Context
- Audio: Web Speech API 또는 사전 생성 음성 파일 재생
- Routing: React Router
- Optional Backend: Supabase or simple Node API later

### MVP 원칙
- 회원가입 없음
- 로컬 상태 중심
- 음성 재생 로직 우선 구현
- 빠른 실행 UI

---

## 3. 핵심 도메인 구조
앱은 크게 3개 모드로 나뉩니다.

1. Countdown Mode
2. Countup Mode
3. Interval Mode

추가로 Voice Profile, Prompt Pattern, Preset 개념을 별도로 관리합니다.

---

## 4. 데이터 모델 설계

## 4.1 VoiceProfile
```ts
export type VoiceProfile = {
  id: string;
  name: string;
  gender: 'male' | 'female';
  tone: 'calm' | 'energy';
  language: 'ko';
  isDefault: boolean;
};
```

예시:
```ts
const voiceProfiles: VoiceProfile[] = [
  { id: 'male-calm', name: '남성 차분형', gender: 'male', tone: 'calm', language: 'ko', isDefault: true },
  { id: 'female-energy', name: '여성 에너지형', gender: 'female', tone: 'energy', language: 'ko', isDefault: false },
];
```

## 4.2 CountdownSettings
```ts
export type CountdownSettings = {
  durationSec: number;
  announceMode: 'all' | 'every10' | 'last5';
  voiceProfileId: string;
  vibrationEnabled: boolean;
  soundEnabled: boolean;
};
```

## 4.3 CountupSettings
```ts
export type CountupSettings = {
  maxCount?: number;
  intervalSec: 1 | 2;
  speakStyle: 'number' | 'korean-count';
  voiceProfileId: string;
  vibrationEnabled: boolean;
  soundEnabled: boolean;
};
```

## 4.4 IntervalSettings
```ts
export type IntervalSettings = {
  workSec: number;
  restSec: number;
  rounds: number;
  announceMode: 'every10' | 'last5';
  voiceProfileId: string;
  vibrationEnabled: boolean;
  soundEnabled: boolean;
};
```

## 4.5 Preset
```ts
export type Preset = {
  id: string;
  title: string;
  mode: 'countdown' | 'countup' | 'interval';
  description?: string;
  payload: CountdownSettings | CountupSettings | IntervalSettings;
  category: 'workout' | 'kitchen' | 'custom';
};
```

---

## 5. 추천 프리셋 데이터
```ts
export const presets: Preset[] = [
  {
    id: 'plank-30x5',
    title: '플랭크 30초 x 5',
    mode: 'interval',
    description: '30초 운동 / 15초 휴식 / 5라운드',
    category: 'workout',
    payload: {
      workSec: 30,
      restSec: 15,
      rounds: 5,
      announceMode: 'last5',
      voiceProfileId: 'male-calm',
      vibrationEnabled: true,
      soundEnabled: true,
    },
  },
  {
    id: 'wallsit-40x4',
    title: '벽스쿼트 40초 x 4',
    mode: 'interval',
    description: '40초 운동 / 20초 휴식 / 4라운드',
    category: 'workout',
    payload: {
      workSec: 40,
      restSec: 20,
      rounds: 4,
      announceMode: 'every10',
      voiceProfileId: 'female-energy',
      vibrationEnabled: true,
      soundEnabled: true,
    },
  },
  {
    id: 'kitchen-60',
    title: '주방 60초',
    mode: 'countdown',
    category: 'kitchen',
    payload: {
      durationSec: 60,
      announceMode: 'every10',
      voiceProfileId: 'female-energy',
      vibrationEnabled: false,
      soundEnabled: true,
    },
  },
];
```

---

## 6. 프론트엔드 구조

## 6.1 페이지 구조
```txt
src/
  app/
    router.tsx
    providers.tsx
  pages/
    HomePage.tsx
    CountdownPage.tsx
    CountupPage.tsx
    IntervalPage.tsx
    RunSessionPage.tsx
    SettingsPage.tsx
  components/
    layout/
      AppShell.tsx
    cards/
      PresetCard.tsx
      ModeCard.tsx
    controls/
      TimePicker.tsx
      VoiceSelector.tsx
      ToggleRow.tsx
      SegmentSelector.tsx
      RoundStepper.tsx
    session/
      SessionHeader.tsx
      TimerDisplay.tsx
      SessionControls.tsx
      VoicePromptPreview.tsx
  store/
    useTimerStore.ts
  hooks/
    useCountdownEngine.ts
    useCountupEngine.ts
    useIntervalEngine.ts
    useSpeechEngine.ts
    useVibration.ts
  utils/
    time.ts
    speechQueue.ts
    format.ts
  data/
    presets.ts
    voices.ts
  types/
    timer.ts
```

---

## 7. 핵심 React 화면 설계

## 7.1 HomePage
### 목적
첫 진입 후 즉시 사용하게 만드는 홈.

### 포함 요소
- 상단 카피: "운동할 때 화면 안 봐도 되는 음성 코치 타이머"
- 모드 카드 3개
  - 운동 타이머
  - 횟수 코치
  - 주방 타이머
- 추천 프리셋 섹션
- 최근 사용 프리셋 섹션(선택)

### 핵심 UX
홈에서 1탭 안에 바로 시작 가능해야 함.

---

## 7.2 CountdownPage
### 목적
카운트다운 설정

### 요소
- 시간 선택
- 음성 안내 방식 선택
  - 전체
  - 10초 단위
  - 마지막 5초
- 음성 선택
- 진동 on/off
- 시작 버튼

---

## 7.3 CountupPage
### 목적
횟수 코치 설정

### 요소
- 간격 선택 (1초 / 2초)
- 숫자 스타일 선택
  - 1, 2, 3
  - 하나, 둘, 셋
- 음성 선택
- 최대 카운트 옵션(선택)
- 시작 버튼

---

## 7.4 IntervalPage
### 목적
운동/휴식 인터벌 설정

### 요소
- 운동 시간
- 휴식 시간
- 라운드 수
- 음성 방식
- 음성 선택
- 시작 버튼

---

## 7.5 RunSessionPage
### 목적
세션 실행 화면

### 필수 UI
- 현재 상태 표시
  - 운동 중
  - 휴식 중
  - 카운트업 중
  - 남은 시간 / 현재 카운트
- 라운드 표시
- 진행 상태 바
- 일시정지
- 다시 시작
- 종료

### UX 원칙
- 큰 숫자
- 시선 분산 최소화
- 다크 배경 가능

---

## 8. 상태 관리 구조
Zustand 기준 예시.

```ts
export type TimerMode = 'countdown' | 'countup' | 'interval';

export type SessionState = {
  mode: TimerMode | null;
  status: 'idle' | 'running' | 'paused' | 'completed';
  currentRound: number;
  totalRounds: number;
  remainingSec: number;
  elapsedCount: number;
  phase: 'work' | 'rest' | 'single';
  selectedVoiceProfileId: string;
  startSession: (payload: any) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: () => void;
  tick: () => void;
};
```

---

## 9. 음성 엔진 설계

## 9.1 방식 선택
MVP에서는 두 가지 중 하나를 선택합니다.

### 방식 A — Web Speech API
장점:
- 구현 빠름
- 텍스트 생성만 하면 됨

단점:
- 브라우저/환경별 차이
- 음성 품질 편차

### 방식 B — 미리 생성한 mp3 음성 파일 재생
장점:
- 품질 안정
- 음성 캐릭터화 가능

단점:
- 파일 수 증가
- 조합 로직 필요

### MVP 추천
1차 MVP는 Web Speech API 우선, 추후 mp3 음성팩 방식 확장.

---

## 9.2 useSpeechEngine 훅
```ts
export type SpeakOptions = {
  voiceProfileId: string;
  priority?: 'high' | 'normal';
  interrupt?: boolean;
};

export type SpeechEngine = {
  speak: (text: string, options?: SpeakOptions) => void;
  stop: () => void;
  isSpeaking: boolean;
};
```

### 역할
- 숫자 읽기
- 코칭 멘트 재생
- 음성 중복 큐 관리
- 세션 전환 시 이전 음성 중단

---

## 10. 타이머 엔진 설계

## 10.1 useCountdownEngine
기능:
- 남은 시간 감소
- announceMode에 따라 음성 출력 시점 결정
- 종료 이벤트 발생

예시 규칙:
- all: 매초 읽기
- every10: 60, 50, 40, ... 읽기
- last5: 5, 4, 3, 2, 1 읽기

## 10.2 useCountupEngine
기능:
- intervalSec에 따라 카운트 증가
- number / korean-count 방식으로 음성 출력

예시:
- 1초 간격이면 1, 2, 3...
- 2초 간격이면 2초마다 하나씩 음성 출력

## 10.3 useIntervalEngine
기능:
- work / rest phase 전환
- currentRound 관리
- 각 phase별 음성 호출
- 세션 종료 처리

---

## 11. API 구조
MVP 1차는 프론트엔드 단독으로 충분합니다.
하지만 이후 확장을 위해 아래 API 구조를 가정합니다.

## 11.1 Preset API
### GET /api/presets
프리셋 목록 조회

응답 예시:
```json
[
  {
    "id": "plank-30x5",
    "title": "플랭크 30초 x 5",
    "mode": "interval",
    "category": "workout"
  }
]
```

### POST /api/presets
사용자 커스텀 프리셋 저장

요청 예시:
```json
{
  "title": "내 플랭크 루틴",
  "mode": "interval",
  "payload": {
    "workSec": 30,
    "restSec": 15,
    "rounds": 5,
    "announceMode": "last5",
    "voiceProfileId": "male-calm"
  }
}
```

## 11.2 Voice Pack API
### GET /api/voices
음성 옵션 조회

응답 예시:
```json
[
  {
    "id": "male-calm",
    "name": "남성 차분형",
    "gender": "male",
    "tone": "calm"
  }
]
```

## 11.3 Session Log API (선택)
### POST /api/session-log
세션 완료 로그 저장

요청 예시:
```json
{
  "mode": "interval",
  "workSec": 30,
  "restSec": 15,
  "rounds": 5,
  "completed": true,
  "startedAt": "2026-03-19T10:00:00Z",
  "endedAt": "2026-03-19T10:05:00Z"
}
```

---

## 12. Cursor에 줄 구현 우선순위

### Step 1
- React + TypeScript + Tailwind 초기 세팅
- 라우팅 세팅
- 홈 화면 구현

### Step 2
- 카운트다운 화면 구현
- 카운트업 화면 구현
- 인터벌 화면 구현

### Step 3
- RunSessionPage 구현
- 남은 시간 / 카운트 표시
- 상태 전환 구현

### Step 4
- Web Speech API 연결
- 숫자 및 코칭 멘트 재생

### Step 5
- 프리셋 데이터 연결
- 홈 화면에서 프리셋 즉시 시작

### Step 6
- 진동 / 효과음 추가
- UX 정리

---

## 13. Cursor용 구현 지시문
아래 기준으로 구현한다.

1. React + TypeScript + Tailwind로 개발한다.
2. 첫 화면에서 바로 실행 가능한 구조를 우선한다.
3. 홈, 카운트다운, 카운트업, 인터벌, 실행 화면 5개를 만든다.
4. Web Speech API를 사용해 한국어 음성 카운트를 구현한다.
5. 카운트다운은 all / every10 / last5 3가지 모드를 지원한다.
6. 카운트업은 숫자형과 하나, 둘, 셋 형태를 모두 지원한다.
7. 인터벌은 운동/휴식/라운드 구조를 지원한다.
8. 상태 관리는 Zustand를 사용한다.
9. MVP 단계에서는 로그인과 백엔드는 제외한다.
10. 코드 구조는 이후 토스 미니앱 또는 일반 웹앱에 쉽게 이식 가능하도록 모듈화한다.

---

## 14. 최종 요약
이 서비스는 단순 타이머가 아니라, 사용자가 운동이나 요리 중 화면을 보지 않고도 행동을 이어갈 수 있게 돕는 음성 코치형 타이머입니다.

개발 우선순위는 다음과 같습니다.
- 음성 카운트다운
- 음성 카운트업
- 인터벌
- 프리셋 실행
- 실행 화면 UX 최적화

핵심 문장:
"운동할 때 화면 안 봐도 되는 음성 코치 타이머"
