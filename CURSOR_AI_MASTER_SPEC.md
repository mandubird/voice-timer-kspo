# Voice Coach Timer — 커서AI 통합 개발 명세서

> **프로젝트:** 토스 미니앱용 음성 코치 타이머
> **작성일:** 2026-03-19
> **최종 업데이트:** 2026-03-19 (양치 모드 추가)
> **문서 용도:** 커서AI(Cursor AI)에게 전달하는 완전한 개발 컨텍스트 통합본

---

## 1. 서비스 개요

### 서비스명
**Voice Coach Timer** (음성 코치 타이머)

### 한 줄 소개
> "운동할 때 화면 안 봐도 되는 음성 코치 타이머"

### 핵심 유스케이스 (2가지 축)

| 축 | 대상 | Pain |
|----|------|------|
| **운동 타이머** | 혼자 운동하는 성인 | 플랭크/스쿼트 중 화면 못 봄, 횟수 세기 힘듦 |
| **아이 양치 코치** | 3~10세 자녀를 둔 부모 | 3분 채우기 힘듦, 매번 옆에서 독려해야 함 |

### 핵심 문제
**[운동]**
- 플랭크, 벽 스쿼트는 자세 유지 중 화면 보기 어려움
- 반복 운동 중 횟수를 직접 세면 운동 집중도 저하
- 인터벌 운동 시 시간 확인으로 흐름이 끊김
- 요리 중 손이 젖거나 바빠서 화면 보기 불편

**[양치]**
- 아이 혼자 3분 양치를 끝까지 하지 못함
- 부모가 매번 "아직 1분 남았어!" 반복해야 함
- 단순 타이머는 아이 집중력 유지 불가

### 핵심 가치 제안
- 화면 없이 귀로 타이머 정보 수신
- 운동에만 / 양치에만 집중 가능
- 가입 없이 즉시 사용
- 운동 + 주방 + 아이 양치까지 모두 적용

---

## 2. 기술 스택

| 항목 | 선택 |
|------|------|
| Frontend Framework | React + TypeScript + Vite |
| 스타일링 | Tailwind CSS |
| 상태 관리 | Zustand 또는 React Context |
| 오디오 | Web Speech API + 사전 녹음 MP3 (fallback) |
| 라우팅 | React Router |
| 플랫폼 | 토스 미니앱 (Toss Mini-app) |

---

## 3. 핵심 기능 명세

### 3.1 모드 구성 (4가지 모드)

#### [모드 1] 카운트다운 (Countdown)
- 60 → 59 → 58 ... → 0 방향으로 음성 카운트
- **알림 옵션:**
  - `all`: 매 초 음성 재생
  - `every10`: 10초 단위마다 알림 (60, 50, 40...)
  - `last5`: 마지막 5초만 알림 (5, 4, 3, 2, 1)
- 종료 시 "수고하셨습니다" 등 코칭 문구 재생

#### [모드 2] 카운트업 (Countup)
- 1, 2, 3, 4 ... 방향으로 음성 카운트
- **인터벌:** 1~2초 간격
- **숫자 스타일 옵션:**
  - `numeric`: "1, 2, 3, 4..." (숫자 그대로)
  - `korean`: "하나, 둘, 셋, 넷..." (한국어 고유어 수사)
- 최대 카운트 설정 가능

#### [모드 3] 인터벌 (Interval)
- 운동(Work) / 휴식(Rest) / 라운드(Round) 설정
- 각 구간 전환 시 음성 안내
- **설정값:** 운동 시간, 휴식 시간, 총 라운드 수

#### [모드 4] 양치 코치 (Brushing) ★ 두 번째 핵심 유스케이스
- **고정 3분** 타이머 (충분히 꼼꼼히 닦기)
- 단순 카운트다운이 아닌 **단계별 음성 스크립트** 재생
- 아이가 직접 듣고 따라하는 구조 → 부모 개입 불필요
- **음성 스크립트 (고정):**

| 경과 시간 | 음성 멘트 |
|-----------|-----------|
| 0초 (시작) | "양치 시작! 잘 해보자!" |
| 45초 | "이제 앞니 닦아볼까?" |
| 90초 | "이번엔 위쪽!" |
| 135초 | "조금만 더! 거의 다 왔어!" |
| 170초 | "마지막 10초!" |
| 180초 (종료) | "끝! 너무 잘했어!" |

- **UI 요소:**
  - 큰 시작 버튼 (아이가 혼자 탭 가능)
  - 캐릭터 또는 이모지 (친근감)
  - 진행 바 (3분)
  - 사운드 ON/OFF

- **음성 옵션:** 남성/여성, 밝은 톤/차분한 톤 (캐릭터 음성은 v2 예정)

---

### 3.2 음성 시스템

#### 음성 프로필
| 속성 | 옵션 |
|------|------|
| 성별 | 남성 / 여성 |
| 톤 | calm (차분) / energy (에너지) |
| 언어 | 한국어 (ko-KR) |

#### 코칭 문구 목록 — 운동 모드
| 상황 | 문구 예시 |
|------|-----------|
| 시작 | "시작합니다", "파이팅!" |
| 휴식 | "잠깐 쉬어요", "휴식 시간입니다" |
| 다음 라운드 | "다음 라운드", "준비하세요" |
| 독려 | "조금만 더", "잘 하고 있어요" |
| 마지막 | "마지막이에요", "끝까지 버텨요" |
| 종료 | "수고하셨습니다", "잘 하셨어요" |

#### 코칭 문구 목록 — 양치 모드 (고정 스크립트)
| 타임스탬프 | 문구 |
|------------|------|
| 0s | "양치 시작! 잘 해보자!" |
| 45s | "이제 앞니 닦아볼까?" |
| 90s | "이번엔 위쪽!" |
| 135s | "조금만 더! 거의 다 왔어!" |
| 170s | "마지막 10초!" |
| 180s | "끝! 너무 잘했어!" |

---

### 3.3 프리셋 (사전 구성 루틴)

| 프리셋명 | 모드 | 설정 | 카테고리 |
|----------|------|------|----------|
| 플랭크 30초 x5 | Interval | 운동30s / 휴식15s / 5라운드 | workout |
| 벽 스쿼트 40초 x4 | Interval | 운동40s / 휴식20s / 4라운드 | workout |
| 주방 타이머 60초 | Countdown | 60s / every10 알림 | kitchen |
| 아이 양치 3분 | Brushing | 고정 3분 / 단계별 스크립트 | brushing |

---

## 4. 데이터 모델

```typescript
// 음성 프로필
interface VoiceProfile {
  id: string;
  name: string;
  gender: 'male' | 'female';
  tone: 'calm' | 'energy';
  language: 'ko-KR';
}

// 카운트다운 설정
interface CountdownSettings {
  duration: number;           // 초 단위
  announceMode: 'all' | 'every10' | 'last5';
  voiceProfile: VoiceProfile;
  vibration: boolean;
  sound: boolean;
}

// 카운트업 설정
interface CountupSettings {
  maxCount: number;
  intervalSeconds: number;    // 1 or 2
  speakStyle: 'numeric' | 'korean';
  voiceProfile: VoiceProfile;
}

// 인터벌 설정
interface IntervalSettings {
  workSeconds: number;
  restSeconds: number;
  rounds: number;
  announceMode: 'all' | 'every10' | 'last5';
  voiceProfile: VoiceProfile;
}

// 양치 설정 (고정 3분, 단계별 스크립트)
interface BrushingSettings {
  voiceProfile: VoiceProfile;
  sound: boolean;
  // scripts는 data/brushingScripts.ts에서 고정 관리
}

// 양치 스크립트 항목
interface BrushingScript {
  triggerSeconds: number;   // 재생 시점 (경과 초)
  text: string;             // 음성 재생 문구
}

// 프리셋
interface Preset {
  id: string;
  title: string;
  mode: 'countdown' | 'countup' | 'interval' | 'brushing';
  settings: CountdownSettings | CountupSettings | IntervalSettings | BrushingSettings;
  description: string;
  category: 'workout' | 'kitchen' | 'brushing' | 'custom';
}

// 세션 상태
interface SessionState {
  mode: 'countdown' | 'countup' | 'interval' | 'brushing';
  status: 'idle' | 'running' | 'paused' | 'finished';
  currentTime: number;
  currentCount: number;
  currentRound: number;
  totalRounds: number;
  voiceProfile: VoiceProfile;
  // 제어 메서드
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}
```

---

## 5. 폴더 구조

```
src/
├── pages/
│   ├── HomePage.tsx          # 메인 홈 (4개 모드 카드)
│   ├── CountdownPage.tsx     # 카운트다운 설정 화면
│   ├── CountupPage.tsx       # 카운트업 설정 화면
│   ├── IntervalPage.tsx      # 인터벌 설정 화면
│   ├── BrushingPage.tsx      # 양치 모드 설정 화면 ★ NEW
│   ├── RunSessionPage.tsx    # 실제 세션 실행 화면 (brushing 분기 포함)
│   └── PresetsPage.tsx       # 프리셋 목록/관리 화면
│
├── components/
│   ├── ModeCard.tsx          # 홈 모드 선택 카드
│   ├── TimerDisplay.tsx      # 큰 숫자 타이머 표시
│   ├── VoiceSelector.tsx     # 음성 프로필 선택 UI
│   ├── AnnounceToggle.tsx    # 알림 모드 토글
│   ├── PresetCard.tsx        # 프리셋 카드
│   └── PaywallModal.tsx      # 결제 모달 (Pro 전환)
│
├── store/
│   ├── sessionStore.ts       # 세션 상태 (Zustand)
│   ├── settingsStore.ts      # 앱 설정 상태
│   └── presetStore.ts        # 프리셋 상태
│
├── hooks/
│   ├── useTimer.ts           # 타이머 로직 훅
│   ├── useVoice.ts           # Web Speech API 훅
│   └── useVibration.ts       # 진동 훅
│
├── utils/
│   ├── speechUtils.ts        # 음성 합성 유틸리티
│   ├── timerUtils.ts         # 타이머 계산 유틸리티
│   └── koreanNumbers.ts      # 한국어 수사 변환 (1→"하나")
│
├── data/
│   ├── presets.ts            # 기본 프리셋 데이터
│   ├── voiceProfiles.ts      # 기본 음성 프로필 데이터
│   ├── coachingPhrases.ts    # 운동 코칭 문구 데이터
│   └── brushingScripts.ts    # 양치 단계별 스크립트 (고정) ★ NEW
│
└── types/
    └── index.ts              # 공통 타입 정의
```

---

## 6. UI/UX 화면 구성

### 6.1 홈 화면 (HomePage)
- 서비스명 + 태그라인 상단 표시
- **4개 모드 카드** (카운트다운 / 카운트업 / 인터벌 / 🪥 양치 코치)
- 프리셋 바로가기 버튼
- 각 카드 탭 → 해당 설정 화면으로 이동
- 양치 카드는 시각적으로 구분 (색상 다르게 — 아이 친화적 컬러)

### 6.2 설정 화면 (각 모드별)
- 시간/횟수 설정 (슬라이더 또는 스텝퍼)
- 음성 선택 (성별 / 톤)
- 알림 모드 선택
- "시작하기" 버튼 → RunSessionPage

### 6.3 세션 실행 화면 (RunSessionPage)
- **중앙 대형 숫자:** 현재 카운트 또는 남은 시간
- **하단 정보:** 현재 라운드 / 전체 라운드 (인터벌 모드)
- **컨트롤:** 일시정지 / 재시작 / 종료
- **배경 색상:** 운동 중 = 활성 색, 휴식 중 = 차분한 색 (인터벌)

### 6.4 양치 세션 화면 (RunSessionPage — brushing 분기)
- **중앙 큰 버튼** — 아이 혼자 탭 가능하도록 최대 크기
- **진행 바** — 3분 중 현재 위치 시각화
- **캐릭터/이모지** — 단계마다 바뀌는 표정 (선택)
- **음성 자동 재생** — 타임스탬프 기반 스크립트 순차 실행
- 일시정지 / 재시작 컨트롤
- 종료 시 칭찬 화면 (별 이모지, 큰 텍스트)

### 6.5 프리셋 화면 (PresetsPage)
- 기본 제공 프리셋 카드 목록
- 카드 탭 → 바로 세션 시작
- Pro 사용자: 커스텀 프리셋 저장 가능

---

## 7. 구현 우선순위 (단계별)

| 단계 | 내용 |
|------|------|
| Step 1 | React + Vite 프로젝트 셋업, 라우팅, 홈 화면 |
| Step 2 | 카운트다운 / 카운트업 / 인터벌 설정 화면 구현 |
| Step 3 | RunSessionPage + 타이머 로직 + 화면 표시 |
| Step 4 | Web Speech API 연동 (음성 합성) |
| Step 5 | **양치 모드 구현** — BrushingPage + 타임스탬프 스크립트 실행 로직 |
| Step 6 | 프리셋 연동 (기본 프리셋 불러오기 + 바로 시작) |
| Step 7 | 진동(Vibration API) + 사운드 효과 |
| Step 8 | PaywallModal + 무료/Pro 기능 분기 |

---

## 8. 가격 정책

### 가격 정책 원칙
- **결제 수익 메인, 광고 수익 보조**
- 광고는 홈/설정 화면에만 — 세션 실행 화면은 광고 없음 (집중 방해 금지)
- 앱인토스 수수료: 앱마켓 15% + 토스 5% (매출 성장 시 앱마켓 30% 전환 가능)
  - ₩2,900 판매 기준 정산 감각: 약 ₩2,320 수준

### Free 플랜 (기본 무료)
- 기본 타이머 (30/45/60초 카운트다운)
- 기본 시스템 음성 1종
- 기본 안내 멘트
- 제한된 톤 1~2개
- 가벼운 광고 (홈/설정 화면)

### Pro 플랜 — ₩2,900 (v1 출시가 / 평생 이용)
> **v1 목표:** "한 번 써볼까?" 첫 결제 전환율 검증
- 광고 제거
- 에너지 톤 + 추임새/리액션 멘트
- 남성/여성 음성 선택
- 카운트업 코치 기능
- **양치 모드 음성 변경**
- 루틴(프리셋) 무제한 저장
- 프리미엄 음성 우선 제공 (mp3 교체 시)

### 가격 로드맵
| 단계 | 가격 | 조건 |
|------|------|------|
| **v1 출시** | ₩2,900 | 첫 결제 전환 데이터 수집 |
| **v1.5** | ₩4,900 테스트 | 체감 차이 확실해졌을 때 |
| **v2** | 보이스팩 단건 + 구독 검토 | 팩 종류 충분히 쌓인 후 |

### Premium 애드온 (v2 예정)
- 추가 보이스팩 단건 구매
- 커스텀 음성 프로필
- AI 코칭

---

## 9. 디자인 시스템

### 9.1 디자인 원칙
토스 미니앱 스타일을 기반으로 한 **심플하고 즉각적인 UI**

| 원칙 | 설명 |
|------|------|
| 여백 우선 | 정보 밀도 낮게, 핵심만 표시 |
| 터치 중심 | 모든 인터랙션은 손가락 기준 |
| 즉시 이해 | 아이콘 + 텍스트 병행, 설명 불필요 |
| 모드별 분위기 | 운동(강렬) / 양치(부드러움) 시각적으로 분리 |

---

### 9.2 컬러 팔레트

#### 전체 공통
```
배경:        #FFFFFF  (흰색)
서브 배경:   #F5F5F5  (연한 회색)
텍스트 메인: #1A1A1A  (거의 검정)
텍스트 서브: #8E8E8E  (중간 회색)
구분선:      #EEEEEE
```

#### 운동 모드 (활성/강렬)
```
Primary:      #3182F6  (토스 블루 — 기본 버튼, 강조)
Active:       #FF5E57  (운동 진행 중 — 붉은 에너지)
Rest:         #4CAF50  (휴식 구간 — 그린 차분)
Finish:       #3182F6  (완료 — 토스 블루)
```

#### 양치 모드 (아이 친화 — 파스텔)
```
Primary:      #5CC8FF  (하늘색 — 메인 버튼)
Background:   #EEF8FF  (연한 하늘 배경)
Accent:       #FFD166  (노란 포인트 — 칭찬 화면)
Complete:     #06D6A0  (민트 — 종료 칭찬)
```

#### 결제/Pro
```
Pro Badge:    #FF9500  (오렌지 — Pro 뱃지)
CTA Button:   #3182F6  (토스 블루 — 결제 버튼)
```

---

### 9.3 타이포그래피

```
폰트: Pretendard (없으면 Apple SD Gothic Neo → system-ui 순서 fallback)

font-family: 'Pretendard', 'Apple SD Gothic Neo', system-ui, sans-serif;
```

| 용도 | 크기 | 굵기 |
|------|------|------|
| 타이머 숫자 (메인) | 80px ~ 96px | 700 (Bold) |
| 페이지 제목 | 24px | 700 |
| 섹션 제목 | 18px | 600 |
| 본문 | 16px | 400 |
| 서브 텍스트 | 14px | 400 |
| 캡션 | 12px | 400 |

---

### 9.4 컴포넌트 스펙

#### 버튼
```
기본 버튼 (Primary):
  height: 56px
  border-radius: 14px
  font-size: 17px
  font-weight: 600
  background: #3182F6
  color: #FFFFFF

보조 버튼 (Secondary):
  height: 56px
  border-radius: 14px
  background: #F5F5F5
  color: #1A1A1A

양치 시작 버튼 (특대):
  height: 120px
  border-radius: 24px
  font-size: 24px
  background: #5CC8FF
  color: #FFFFFF
  → 아이 혼자 탭 가능하도록 크게
```

#### 모드 카드 (홈 화면)
```
border-radius: 20px
padding: 24px
background: #F5F5F5
height: 100px (운동 모드)
height: 110px (양치 모드 — 약간 크게)
shadow: 0 2px 8px rgba(0,0,0,0.06)
```

#### 타이머 디스플레이
```
숫자: 80~96px / Bold / #1A1A1A
단위 레이블 (초/회): 18px / #8E8E8E
배경: 모드별 색상 적용
```

#### 진행 바 (Progress Bar)
```
height: 8px
border-radius: 4px
background (트랙): #EEEEEE
background (진행): 모드별 Primary 색상
transition: width 1s linear
```

---

### 9.5 화면별 레이아웃

#### 홈 화면
```
상단 패딩: 24px
제목: 좌측 정렬
모드 카드: 세로 스택 (간격 12px)
하단 프리셋 버튼: 고정 하단 탭바 or 버튼
```

#### 세션 실행 화면 (RunSessionPage)
```
화면 전체를 타이머가 차지 (풀스크린 feel)
상단: 모드명 + 라운드 정보 (작게)
중앙: 타이머 숫자 (초대형, 화면 중앙)
하단: 일시정지 / 종료 버튼 (56px)
배경: 모드별 색상 (연하게 tint)
```

#### 양치 화면
```
상단: "양치 시간이에요 🪥" (20px / 중앙 정렬)
중앙 상단: 진행 바 (3분 기준)
중앙: 큰 시작 버튼 or 현재 안내 문구
하단: 남은 시간 (보조 표시)
배경: #EEF8FF (연한 하늘)
완료 화면: 별/이모지 + 큰 칭찬 텍스트 + 노란 배경
```

---

### 9.6 아이콘 & 이모지 가이드

| 모드 | 아이콘/이모지 |
|------|--------------|
| 카운트다운 | ⏱ |
| 카운트업 | 🔢 |
| 인터벌 | 💪 |
| 양치 코치 | 🪥 |
| Pro | ⭐ |
| 완료 (운동) | 🎉 |
| 완료 (양치) | ✨ |

아이콘 라이브러리: **lucide-react** (설치: `npm install lucide-react`)

---

### 9.7 Tailwind 커스텀 설정 예시

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        toss: {
          blue: '#3182F6',
          gray: '#F5F5F5',
          text: '#1A1A1A',
          sub: '#8E8E8E',
        },
        workout: {
          active: '#FF5E57',
          rest: '#4CAF50',
        },
        brushing: {
          bg: '#EEF8FF',
          primary: '#5CC8FF',
          accent: '#FFD166',
          complete: '#06D6A0',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'Apple SD Gothic Neo', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        btn: '14px',
      },
    },
  },
}
```

---

## 10. 결제 전환 UX 전략

### 핵심 원칙
> "불편을 느끼는 순간 결제는 자연스럽다"

### 결제 유도 시점 (4가지)
1. **첫 운동 완료 후** — 세션 종료 화면에서 자연스럽게 Pro 제안
2. **카운트업 기능 탭 시** — "카운트업은 Pro 기능입니다" 안내
3. **음성 변경 시도 시** — "다양한 음성은 Pro에서" 안내
4. **양치 완료 후** — "아이가 좋아하는 목소리로 바꿔보세요" → 음성 팩 제안

### 결제 금지 패턴 (Anti-patterns)
- 첫 화면에서 결제 팝업 금지
- 반복 팝업 스팸 금지
- 기능을 처음부터 완전 차단 금지

### 결제 화면 카피

**메인 헤드라인:**
> "운동할 때 화면 안 봐도 됩니다"

**서브:**
> "이제 시간은 귀로 들으세요
> 플랭크, 스쿼트, 요리까지 모두 커버"

**Free vs Pro 비교:**
| Free | Pro (₩2,900 평생) |
|------|-------------------|
| 기본 타이머 (30/45/60초) | 남성/여성 음성 선택 |
| 음성 1종 | 카운트업 코치 |
| 인터벌 1가지 | 루틴 무제한 저장 |
| 광고 있음 | 광고 없음 |
| — | 고급 음성 알림 |

**CTA 버튼:**
- 주 버튼: "지금 2,900원으로 평생 사용하기"
- 보조 버튼: "무료로 계속 사용"

**신뢰 문구:**
- 토스 간편결제
- 언제나 사용 가능
- 추가 요금 없음

---

## 10. 토스 미니앱 심사 포지셔닝

### 핵심 어필 포인트
- **즉시 사용** — 가입 없이 바로 실행
- **명확한 목적** — 음성 코치 타이머 단 하나
- **높은 재사용성** — 매 운동 + 하루 2~3회 양치마다 반복 사용
- **유틸리티 앱** — 복잡한 소셜/커뮤니티 없음
- **양치 모드** — 부모 타겟 바이럴 채널 확보 (엄마 커뮤니티)

### MVP 범위 (포함)
- 카운트다운 / 카운트업 / 인터벌
- 음성 선택
- 프리셋

### MVP 범위 (제외 — v2 이후)
- 로그인 / 회원가입
- 운동 통계
- 커뮤니티 / 소셜
- AI 코칭
- 랭킹 / SNS 공유

---

## 11. 마케팅 전략 — 양치 모드 초기 100명 확보

### 타겟
- 3~10세 자녀를 둔 부모
- 아이 양치 습관으로 고민하는 부모

### 주요 채널
| 채널 | 접근 방식 |
|------|-----------|
| 맘카페 (네이버) | 공감형 게시글 |
| 인스타 육아 계정 | Before/After 짧은 릴스 |
| 당근마켓 지역 커뮤니티 | 지역 부모 타겟 |
| 블로그 | 검색 유입용 후기 글 |

### 콘텐츠 구조
1. **문제 제기** — "아이 양치 3분 채우기 진짜 힘들지 않나요?"
2. **공감** — 매번 옆에서 독려하는 부모 감정 공유
3. **해결 방법** — "그래서 음성으로 알려주는 타이머 만들어봤어요"
4. **결과** — "이거 틀어주니까 혼자 끝까지 하네요"
5. **링크** — 토스 미니앱 바로가기

### 핵심 메시지
> "아이 양치 스트레스 줄여주는 도구"

### 금지 사항
- 광고처럼 쓰지 않기
- 기능 설명 위주 금지
- 부모 감정 중심으로 작성

### KPI
- 100명 사용
- 재사용률 30% (하루 2~3회 특성상 달성 가능)
- 자발적 공유 발생 여부

---

## 12. 향후 API 설계 (확장 대비)

```
GET  /api/presets         # 프리셋 목록 조회
POST /api/presets         # 프리셋 저장 (Pro)
GET  /api/voices          # 음성 프로필 목록
POST /api/session-log     # 세션 기록 저장 (통계용)
```

---

## 13. 커서AI 구현 요청 사항

### 즉시 구현 요청
1. **프로젝트 초기화** — `npm create vite@latest voice-coach-timer -- --template react-ts`
2. **Tailwind CSS 설정** — PostCSS + tailwind.config 포함
3. **React Router 설정** — 7개 페이지 라우팅 구성 (BrushingPage 포함)
4. **Zustand 상태 관리** — sessionStore, settingsStore, presetStore
5. **useTimer 훅** — setInterval 기반 카운트다운/업 로직
6. **useVoice 훅** — `window.speechSynthesis` 기반 Web Speech API 래핑
7. **useBrushingScript 훅** — 경과 시간 기반 스크립트 자동 트리거 로직 ★ NEW
8. **brushingScripts 데이터** — `{ triggerSeconds: number, text: string }[]` 배열
9. **koreanNumbers 유틸** — 1→"하나", 2→"둘" ... 변환 함수

### 양치 모드 구현 핵심 로직

```typescript
// data/brushingScripts.ts
export const BRUSHING_SCRIPTS: BrushingScript[] = [
  { triggerSeconds: 0,   text: "양치 시작! 잘 해보자!" },
  { triggerSeconds: 45,  text: "이제 앞니 닦아볼까?" },
  { triggerSeconds: 90,  text: "이번엔 위쪽!" },
  { triggerSeconds: 135, text: "조금만 더! 거의 다 왔어!" },
  { triggerSeconds: 170, text: "마지막 10초!" },
  { triggerSeconds: 180, text: "끝! 너무 잘했어!" },
];

// hooks/useBrushingScript.ts
// elapsed(경과 초) 를 watch하면서 triggerSeconds 도달 시 speak() 호출
// 이미 재생한 스크립트는 Set으로 중복 방지
```

### 특별 주의사항
- 토스 미니앱 환경: 모바일 웹 기준, 터치 우선 UI
- 최소 터치 영역: 44×44px 이상 (양치 화면은 더 크게 — 아이가 탭)
- 음성 API 실패 시 조용히 fallback (에러 표시 금지)
- **iOS Safari 제약:** Web Speech API는 *사용자 제스처(버튼 탭 등) 이후*에만 동작하므로, **첫 `speak()`** 는 반드시 `시작하기` / `양치 시작하기` / 프리셋 카드 탭 등 **버튼 핸들러 안에서 동기 호출** (`sessionSpeechPrime.primeSpeechFromUserGesture`) — 이후 틱 기반 음성은 같은 세션에서 이어서 동작
- 세션 중 화면 꺼짐 방지: `navigator.wakeLock` API 사용 권장
- 한국어 수사 배열: `['하나','둘','셋','넷','다섯','여섯','일곱','여덟','아홉','열']` 패턴 반복
- 양치 모드 배경: 파스텔/아이 친화 컬러 (운동 모드와 시각적으로 명확히 구분)

---

*이 문서는 `/Users/gimmingyu/Desktop/2025/voice_timer_toss` 폴더 내 8개 파일을 통합하여 작성된 커서AI 전달용 단일 명세서입니다. (양치 모드 관련 2개 파일 추가 반영)*
