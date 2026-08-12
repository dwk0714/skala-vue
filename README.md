# Weather Walk — 오늘, 걷기 좋은 날인가요?

Vue 3 핵심 개념(`v-for` / `v-if` / 양방향 바인딩 / 이벤트 수식어 / 반응성 추적 / 컴포넌트 분리)을 학습하기 위한 날씨 대시보드입니다.
단순히 기온을 나열하는 대신, **날씨 데이터를 일상 언어로 번역하는 생활 지수 5종**과 **산책 가능 시간 · 외출 준비물 추천**을 제공합니다.

현재는 국내 8개 도시의 **Mock 데이터**로 동작하며, OpenWeather API 연동 코드는 이미 작성되어 환경변수 한 줄로 전환할 수 있습니다. (아래 [데이터 소스 전환](#데이터-소스-전환) 참고)

---

## 주요 기능

- **지역별 날씨 카드** — 국내 8개 도시(서울·수원·부산·울산·강릉·제주·광주·세종)를 카드 그리드로 렌더링
- **기온 조건부 라벨** — 25℃ 기준 `☀ 더움` / `❄ 선선함` 뱃지 분기
- **한글 도시 검색** — `:value` + `@input` 수동 바인딩으로 한글 IME 조합 중 입력 유실 방지
- **검색 결과 패널** — 카탈로그 별칭 매칭(`제주도`, `ULSAN` 등) 후 결과 카드에서 도시 추가
- **최근 검색어 태그** — 최대 5개 유지, 중복 제거, 개별 삭제
- **생활 지수 5종** — 손세차 · 야외활동 · 얼죽아 · 붕어빵 · 모기 출현 (점수 0~100 + 등급 + 문구)
- **손세차 다음 비 예보** — 향후 예보에서 첫 강수일을 찾아 안내, 없으면 `비는 문제 없음!`
- **산책 추천 시간** — 시간대별 예보에서 걷기 좋은 구간만 추출, 없으면 대체 문구 표시
- **외출 준비물 추천** — 기온·강수·미세먼지·풍속·습도 조건별 준비물 목록 생성
- **즐겨찾기 토글** — 카드의 ★ 버튼, 버블링 차단으로 카드 선택과 분리
- **상대 시간 표기** — `20분 전 업데이트`, 1분 간격 자동 갱신
- **반응형 상태 추적 로그** — `watch` 5종 + `watchEffect`가 상태 변화를 콘솔과 화면 패널에 동시 기록
- **요약 지표** — 도시 수 · 평균 기온 · 최고 기온 도시 · 즐겨찾기 수 · 산책 추천 1위
- **로딩 / 에러 / 빈 결과 상태 처리** 및 반응형 그리드 레이아웃

---

## 기능 구현 상세

### 지역별 날씨 카드

`WeatherParent`가 `filteredCities`를 `v-for`로 순회하고 `:key="city.id"`를 바인딩합니다. 카드들은 `BaseDashboardCard`의 슬롯 안에 놓이지만, 슬롯 콘텐츠는 부모 스코프에서 컴파일되므로 `WeatherCard`는 `WeatherParent`와 직접 props/emit을 주고받습니다.

카드 클릭 시 카드 헤더 우측의 상태 메시지가 `"{도시}이(가) 선택되었습니다."`로 바뀌며, 선택된 카드에는 `selected` 클래스가 붙습니다. 검색 결과가 0건이면 카드 그리드 대신 안내 블록(`v-else`)이 노출됩니다.

### 한글 도시 검색

`SearchBar`는 `v-model`을 직접 쓰지 않고 `:value` / `@input`으로 나눠 처리합니다.

```vue
<input
  :value="modelValue"
  type="search"
  @input="emit('update-query', $event.target.value)"
/>
```

부모(`WeatherParent`)는 `@update-query="searchQuery = $event"`로 받고, `watch(searchQuery, ...)`가 스토어의 검색을 트리거합니다. 검색은 **300ms 디바운스** 후 실행되며, 이전 요청은 `AbortController`로 취소합니다.

로컬 카탈로그 매칭은 `aliases` 배열 기반이라 `서울시`, `제주도`, `ulsan` 같은 표기도 잡습니다.

```js
export const searchCityCatalog = (query) => {
  const normalized = normalizeCityQuery(query)
  if (!normalized) return []
  return KOREAN_CITY_CATALOG.filter((city) =>
    city.aliases.some((alias) => normalizeCityQuery(alias).includes(normalized)),
  )
}
```

### 최근 검색어 태그

검색 제출 또는 결과 선택 시 `addRecentSearch`가 호출됩니다. 동일 검색어는 제거 후 맨 앞에 다시 넣어 **최신순 최대 5개**를 유지합니다.

```js
recentSearches.value = [value, ...recentSearches.value.filter((item) => item !== value)].slice(0, 5)
```

태그 본문 클릭은 재검색, `×` 클릭은 개별 삭제입니다.

> 현재 최근 검색어는 메모리 상태입니다. localStorage 영속화는 미구현.

### 이벤트 수식어

카드 전체가 클릭 가능한 상태에서 내부 버튼이 부모 핸들러를 함께 트리거하지 않도록 `.stop`을 사용합니다.

```vue
<button @click.stop="$emit('toggle-favorite', city)" @keydown.stop>★</button>
<button @click.stop="$emit('click-detail', city)" @keydown.stop>상세보기 →</button>
```

- 검색 폼: `@submit.prevent`로 기본 제출 차단
- 카드 키보드 접근: `@keydown.enter` / `@keydown.space.prevent`
- 상세보기: `window.alert`로 도시명 · 날씨 · 기온 · 야외활동 지수 점수 출력

### 산책 추천 시간

시간대별 예보에서 **강수확률 0 · 15~26℃ · 강수 키워드 미포함** 구간만 남깁니다.

```js
const RAIN_KEYWORDS = ['비', '소나기', '이슬비', '뇌우']

export const getWalkableHours = (hourly = []) =>
  hourly.filter(
    (hour) =>
      hour.pop === 0 &&
      hour.temp >= 15 &&
      hour.temp <= 26 &&
      !RAIN_KEYWORDS.some((keyword) => hour.status.includes(keyword)),
  )
```

해당 시간이 하나도 없으면 패널이 `danger` 상태로 바뀌며 `밖은 위험해.. 이불 속에 숨기` 문구를 표시합니다. (수원 Mock이 종일 비 시나리오)

### 외출 준비물 추천

기온 5단계로 옷차림을 정하고, 조건을 만족할 때만 항목을 추가합니다.

| 항목 | 추가 조건 |
| --- | --- |
| 옷차림 | 항상 (≤5 두꺼운 외투 / ≤14 가벼운 코트 / ≤22 얇은 겉옷 / ≤27 가벼운 옷차림 / 그 외 통풍 잘되는 옷) |
| ☂️ 우산 | 강수확률 ≥ 30% |
| 😷 마스크 | 미세먼지 ≥ 50㎍/㎥ |
| 💧 물 | 기온 ≥ 25℃ 또는 습도 ≥ 70% |
| 🧥 바람막이 | 풍속 > 8m/s |

---

## 계산 및 지수 로직

모든 지수는 `src/utils/indices/`의 순수 함수이며 동일한 계약을 따릅니다.

```js
compute(weather) => { score: 0~100, level: 'high' | 'mid' | 'low' | 'none', message: string }
```

`carWash`는 `nextRain`, `outdoorActivity`는 `activities`를 추가로 반환합니다. UI는 이 선택 필드를 `v-if`로 분기합니다.

### 🚗 손세차 지수

기온 **10~25℃**를 적정 구간으로 두고, 다섯 가지 감점 요인을 합산합니다.

| 요소 | 배점 | 규칙 |
| --- | --- | --- |
| 기온 | 30 | 10~25℃ 만점, 구간 밖은 1℃당 3점 감점 |
| 강수확률 | 25 | `25 × (1 - pop)` |
| 미세먼지 | 20 | ≤30: 20 / ≤50: 14 / ≤80: 7 / 그 외 0 |
| 풍속 | 15 | ≤3: 15 / ≤6: 9 / ≤10: 4 / 그 외 0 |
| 습도 | 10 | ≤60: 10 / ≤75: 6 / ≤85: 3 / 그 외 0 |

여기에 **다음 비까지 남은 날짜**로 최종 보정합니다. 세차의 실제 판단 기준은 오늘 날씨가 아니라 "세차하고 며칠 버티느냐"이기 때문입니다.

| 다음 비 | 보정 |
| --- | --- |
| 오늘 | 점수 0 (`세차하면 오늘 비 옴`) |
| 내일 | 최대 20점으로 제한 |
| 2일 뒤 | −20 |
| 3일 뒤 | −10 |

등급: 75↑ `오늘 손세차 각` / 50↑ `해볼 만함` / 25↑ `자동세차 추천` / 그 외 `오늘은 참기`

#### 다음 비 예보

예보 배열에서 강수확률이 **임계치(기본 0.6) 이상인 가장 이른 날 하나**를 찾습니다. 배열 길이를 하드코딩하지 않으므로 예보 기간이 5일이든 8일이든 그대로 동작합니다.

```js
export const findNextRain = (weather, threshold = 0.6) => {
  const hit = weather.forecast?.find((item) => item.pop >= threshold)
  if (!hit) return null
  // ... 도시 timezone 기준 일수 차 계산
  return { ...hit, daysFromNow }
}
```

카드 하단 출력:

- 비 예보 있음 → `오늘 / 내일 / N일 뒤 비 예보 80%`
- 예보 기간 내 강수 없음 → **`비는 문제 없음!`**

### 🌳 야외활동 지수

100점에서 시작해 조건별로 차감합니다.

| 요소 | 감점 |
| --- | --- |
| 기온 | 15℃ 미만 또는 26℃ 초과 시 1℃당 4점 (최대 35) |
| 강수확률 | `pop × 40` |
| 미세먼지 | >80: 30 / >50: 20 / >30: 10 |
| 풍속 | >10: 20 / >6: 10 |
| 습도 | >85: 10 / >70: 5 |

등급별로 추천 활동 배열(`산책`, `러닝`, `피크닉` …)을 함께 반환하며, 카드 안에서 `v-for`로 칩 렌더링됩니다. 이 지수의 점수는 선택 도시 배너와 상세보기 alert에도 함께 노출됩니다.

### 🧊 얼죽아 지수

체감온도 중심에 습도 가산.

```js
score = clamp(round((feelsLike + 5) × 2.5 + max(0, humidity - 50) × 0.3), 0, 100)
```

75↑ `얼어 죽어도 아이스` / 45↑ `아이스도 괜찮음` / 20↑ `따뜻한 것도 고민` / 그 외 `오늘은 뜨아`

### 🐟 붕어빵 지수

기온이 낮을수록 상승하는 **역방향 지수**. 15℃ 이상이면 0점으로 반전됩니다.

```js
score = temp >= 15 ? 0
      : temp <= 0  ? 100
      : round(((15 - temp) / 15) × 100)
```

75↑ `붕어빵 필수` / 45↑ `붕어빵 생각남` / 0 초과 `있으면 먹기` / 0 `오늘은 붕어빵 없음`

### 🦟 모기 출현 지수

기온 25℃에서 정점을 이루는 삼각 분포에 습도를 더하고 풍속을 뺍니다.

```js
tempScore     = (temp <= 15 || temp >= 35) ? 0
              : temp <= 25 ? ((temp - 15) / 10) × 60
                           : ((35 - temp) / 10) × 60
humidityScore = clamp((humidity - 40) / 40, 0, 1) × 40
windPenalty   = min(windSpeed × 4, 25)
score         = temp <= 15 ? 0 : clamp(round(tempScore + humidityScore - windPenalty), 0, 100)
```

75↑ `모기 파티 주의` / 50↑ `기피제 챙기기` / 25↑ `한두 마리 조심` / 그 외 `모기 걱정 없음`

### 상대 시간

```js
< 60초 → 방금 전 · < 60분 → N분 전 · < 24시간 → N시간 전 · 그 이상 → N일 전
```

`WeatherParent`가 `setInterval`로 1분마다 `now`를 갱신하고 이를 prop으로 내려주기 때문에, 카드가 각자 타이머를 갖지 않아도 표기가 함께 갱신됩니다.

Mock의 `updatedAt`은 **모듈 로드 시점 기준 20분 전**으로 계산됩니다. 고정 날짜를 쓰면 시간이 지날수록 `N일 전`이 계속 늘어나 상대 시간 표기와 1분 갱신이 동작하는지 확인할 수 없기 때문입니다. 예보 날짜도 같은 기준으로 함께 이동하므로 `findNextRain`의 `daysFromNow`는 변하지 않습니다.

---

## 데이터 모델

Mock과 API가 **동일한 내부 스키마**를 반환합니다. 지수 로직은 어느 쪽에서 왔는지 알지 못합니다.

```js
{
  id: 'kr-seoul',
  name: '서울',
  apiName: 'Seoul',
  country: 'KR',
  state: '서울특별시',
  coords: { lat: 37.5665, lon: 126.978 },
  timezone: 32400,          // UTC offset (초)
  temp: 22,
  feelsLike: 24,
  status: '맑음',
  humidity: 55,
  windSpeed: 2.4,
  pop: 0,                   // 강수확률 0~1
  pm10: 25,                 // ㎍/㎥
  forecast: [{ dt, pop }],  // 일별
  hourly:   [{ dt, temp, feelsLike, status, pop }],
  updatedAt: '…',           // ISO 문자열. Mock은 로드 시점 기준 20분 전
  isFavorite: false,
}
```

Mock 데이터는 **8개 도시의 지수 등급이 서로 갈리도록** 설계했습니다. (서울=쾌청 / 수원=종일 비 / 제주=고온다습 등) 이 분포는 테스트로 강제됩니다 — 아래 [테스트](#테스트) 참고.

---

## 데이터 소스 전환

`weatherService`가 환경변수를 읽어 프로바이더를 고릅니다. 화면·스토어·지수 코드는 전환에 영향을 받지 않습니다.

```js
export const createWeatherService = ({ source = 'mock', apiKey = '' } = {}) => {
  if (source === 'mock') return mockWeatherProvider
  if (source === 'openweather') return createOpenWeatherProvider(apiKey)
  throw new Error(`지원하지 않는 날씨 데이터 소스입니다: ${source}`)
}
```

두 프로바이더 모두 동일한 인터페이스를 구현합니다.

| 메서드 | 설명 |
| --- | --- |
| `listInitialCities()` | 초기 도시 목록 |
| `searchCities(query, { signal })` | 도시 검색 |
| `fetchCityWeather(location, { signal })` | 단일 도시 날씨 |

### OpenWeather 연동 상태

> **연동 코드는 구현 완료, 실제 API 키로는 미검증입니다.** 기본값은 `mock`이며, `.env.example`을 `.env`로 복사한 뒤 아래처럼 채우면 실 API로 전환됩니다.

```bash
# .env
VITE_WEATHER_SOURCE=openweather
VITE_OPENWEATHER_KEY=발급받은_키
```

`createOpenWeatherProvider`는 도시 하나당 세 엔드포인트를 `Promise.all`로 병렬 호출한 뒤 `mapOpenWeatherBundle`로 내부 스키마에 매핑합니다.

| 내부 필드 | OpenWeather 출처 |
| --- | --- |
| `temp`, `feelsLike`, `humidity` | `/data/2.5/weather` → `main.*` |
| `status` | `weather[0].description` (`lang=kr`) |
| `windSpeed` | `wind.speed` |
| `coords`, `timezone`, `updatedAt` | `coord`, `timezone`, `dt` |
| `pop` | `/data/2.5/forecast` → `list[0].pop` |
| `hourly` | `/data/2.5/forecast` → `list[]` 전체 |
| `forecast` | 위 `list[]`를 도시 로컬 날짜로 묶고 **일별 최대 pop** 채택 |
| `pm10` | `/data/2.5/air_pollution` → `components.pm10` |
| 도시 검색 | `/geo/1.0/direct` → `local_names.ko` 우선, `country === 'KR'`만 통과 |

무료 플랜의 `5 day / 3 hour forecast`는 5일까지만 제공합니다. `findNextRain`은 배열을 그대로 순회하므로 예보 기간이 바뀌어도 코드 수정이 필요 없습니다.

### 미연동 / 로드맵

- 🔜 실 API 키 검증 및 에러 케이스 대응
- 🔜 즐겨찾기 · 최근 검색어 localStorage 영속화
- 🔜 즐겨찾기 전용 화면, 도시 상세 화면 (현재 상세는 `window.alert`)
- 🔜 지도 기반 도시 추가
- 🔜 섭씨/화씨 토글
- 🔜 산책 추천 패널 이미지 (`walkImage` / `stayHomeImage` prop 자리는 확보됨, 현재 플레이스홀더)

---

## 기술 스택

| 분류 | 사용 기술 | 비고 |
| --- | --- | --- |
| UI 프레임워크 | Vue 3 (Composition API, `<script setup>`) | |
| 빌드 도구 | Vite 8 | `@` → `src` 별칭 설정됨 (현재 상대 경로 import 사용) |
| 상태 관리 | Pinia 3 | Setup Store 문법 |
| 라우팅 | Vue Router 5 | `App.vue`가 `<RouterView>`만 렌더, 404 Catch-all |
| HTTP | **네이티브 `fetch`** | 별도 HTTP 라이브러리 미사용 |
| 스타일 | 순수 CSS + CSS 변수 토큰 | UI 라이브러리 미사용 |
| 테스트 | `node:test` + `node:assert` | 별도 러너 미설치 |
| 린트/포맷 | ESLint, Oxlint, Prettier | |

의존성을 최소로 유지했습니다. axios·Element Plus·Leaflet 등은 현재 기능 범위에서 필요하지 않아 도입하지 않았습니다.

---

## 실행 방법

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm test
```

```bash
npm run lint
```

기본 상태에서는 환경변수 없이 Mock 데이터로 바로 실행됩니다. 실 API 전환은 `.env.example`을 `.env`로 복사해 사용하세요 — [데이터 소스 전환](#데이터-소스-전환) 참고.

---

## 프로젝트 구조

```
.env.example                         # 데이터 소스 · API 키 템플릿
src/
├── main.js                          # 앱 진입점 (Pinia · Router 등록)
├── App.vue                          # <RouterView /> 만 렌더하는 셸
├── assets/styles/                   # reset · tokens · global
├── router/index.js                  # / · 404 Catch-all
├── views/
│   ├── WeatherDashboardView.vue     # 라우트 진입점 (<WeatherParent /> 한 줄)
│   └── NotFoundView.vue             # 404
├── components/weather/
│   ├── WeatherParent.vue            # 상태·계산·핸들러 오케스트레이션
│   ├── BaseDashboardCard.vue        # 패널 껍데기 + <slot> / <slot name="meta">
│   ├── SearchBar.vue                # 검색 입력 + 최근 검색 태그
│   ├── CitySearchResults.vue        # 검색 결과 드롭다운
│   ├── WeatherCard.vue              # 도시 카드
│   ├── IndexGrid.vue                # 지수 그리드
│   ├── IndexCard.vue                # 지수 카드 (점수 게이지)
│   ├── PreparationPanel.vue         # 외출 준비물
│   ├── WalkTimePanel.vue            # 산책 추천 시간
│   └── LogPanel.vue                 # 반응형 상태 추적 로그
├── stores/
│   └── weatherStore.js              # Pinia 스토어
├── services/
│   ├── weatherService.js            # 프로바이더 선택
│   ├── providers/
│   │   ├── mockWeatherProvider.js
│   │   └── openWeatherProvider.js
│   └── mappers/
│       ├── openWeatherMapper.js     # API 응답 → 내부 스키마
│       └── locationMapper.js        # Geocoding → 내부 위치
├── data/
│   ├── koreanCityCatalog.js         # 8개 도시 + 검색 별칭
│   └── weatherMock.js               # Mock 날씨 데이터
└── utils/
    ├── weatherModel.js              # 타입 정의 + clamp / 위치 비교 유틸
    ├── citySearch.js
    ├── formatRelativeTime.js
    ├── logger.js                    # 로그 접두사 포맷 (Vue 비의존)
    ├── indices/                     # 지수 5종 + 레지스트리
    │   ├── index.js                 # INDICES 레지스트리 · computeIndices
    │   ├── carWash.js
    │   ├── outdoorActivity.js
    │   ├── iceAmericano.js
    │   ├── bungeoppang.js
    │   └── mosquito.js
    └── recommendations/
        ├── preparation.js           # 외출 준비물
        └── walkTimes.js             # 산책 가능 시간
test/weather.test.js
```

Vue 표준 디렉터리 규칙(`components` / `views` / `stores` / `services` / `utils` / `data`)을 그대로 따르고, 날씨 컴포넌트만 `components/weather/`로 묶었습니다.

### 스캐폴드 잔여 파일

아래는 Vue 학습·템플릿 파일로, 날씨 기능과 무관하며 현재 화면에서 사용되지 않습니다.

```
src/components/practices/       # Vue 문법 실습 컴포넌트
src/components/HelloWorld.vue, TheWelcome.vue, WelcomeItem.vue, icons/
src/views/HomeView.vue, AboutView.vue
src/stores/counter.js
src/assets/base.css, main.css, challenge.css
```

---

## 라우팅

| 경로 | 이름 | 컴포넌트 | 설명 |
| --- | --- | --- | --- |
| `/` | `weather-dashboard` | `WeatherDashboardView` | 대시보드 |
| `/:pathMatch(.*)*` | `not-found` | `NotFoundView` | 404 Catch-all |

`App.vue`는 `<RouterView />`만 렌더하는 셸이고, `views/WeatherDashboardView.vue`는 `<WeatherParent />` 한 줄만 갖는 얇은 진입점입니다. 실제 상태와 로직은 전부 `components/weather/WeatherParent.vue`에 있습니다.

이 3단 구성 덕분에 즐겨찾기·상세 같은 화면을 추가할 때 **`views/`에 파일 하나 만들고 라우트 한 줄 추가**하면 되고, 기존 컴포넌트는 props/emit만 쓰므로 그대로 재사용됩니다.

---

## 데이터 흐름

```
onMounted (WeatherParent.vue)
  → store.loadCities()
    → weatherService.listInitialCities()   ← mock 또는 openweather
      → (API인 경우) mapOpenWeatherBundle
        → 내부 스키마 CityWeather[]
          → store.cities

사용자가 카드 선택
  → store.selectCity(id)
    → selectedCity (computed)
      → computeIndices(selectedCity)   → IndexGrid
      → getPreparationItems(...)       → PreparationPanel
      → getWalkableHours(...hourly)    → WalkTimePanel

사용자가 검색어 입력
  → @update-query → watch → store.searchCities(query)
    → 300ms 디바운스 + AbortController
      → searchResults → CitySearchResults
        → 선택 시 addCityFromSearchResult → cities에 추가
```

역할 분담:

- **App.vue / View** — 라우팅 셸과 진입점. 로직 없음
- **WeatherParent** — 스토어와 계산 유틸을 조립하고 사용자 액션을 위임. 계산 로직 없음
- **Component** — props로 받고 emit으로 알림. 스토어 직접 접근 없음
- **Store** — 상태·비동기·디바운스·중복 판정
- **Service / Provider** — 데이터 출처 추상화
- **Mapper** — 외부 응답을 내부 스키마로 고정
- **Utils** — 순수 함수. 프레임워크 의존 없음 → Node 테스트로 직접 검증 가능

---

## Vue 개념 적용

### Composition API

- `ref` — `cities`, `searchQuery`, `selectionMessage`, `now`, `logs`
- `computed` — `selectedCity`, `filteredCities`, `indices`, `outdoorIndex`, `preparationItems`, `walkableHours`, `showSearchResults`, `dashboardSummary`, `bestWalkCity`
- `storeToRefs` — 스토어 상태를 반응성 유지한 채 구조 분해
- `onMounted` / `onBeforeUnmount` — 1분 타이머 등록 및 정리, 진행 중 검색 취소

### 반응성 감시 (watch / watchEffect)

`WeatherParent`에 `watch` 5개와 `watchEffect` 1개가 있습니다. 첫 번째만 실제 동작을 일으키고, 나머지 5개는 로그 전용이라 모두 제거해도 앱은 동일하게 작동합니다.

| 대상 | 방식 | 역할 |
| --- | --- | --- |
| `searchQuery` | `watch` | **검색 실행 트리거** (유일한 기능성 watcher) |
| `selectionMessage` | `watch` | 상태바 문구 변경 로그 |
| (자동 추적) | `watchEffect` | 검색어 + 결과 건수 로그. 마운트 즉시 1회 실행 |
| `cities` | `watch` + `{ deep: true }` | 즐겨찾기 토글·도시 증감 감지 |
| `[selectedCityId, searchQuery]` | `watch` 배열 다중 소스 | 두 값 통합 감지 |
| `() => bestWalkCity?.id` | `watch` getter 소스 | 산책 1위 변경 (이전 값 추적 가능) |

getter 소스를 쓰는 이유는 객체 전체를 감시하면 `oldValue`가 보존되지 않기 때문입니다.

로그는 `utils/logger.js`가 접두사를 붙이고, `pushLog`가 콘솔과 `logs` ref에 **동일한 문자열**을 남깁니다. `LogPanel`이 최근 20건을 화면에 표시하므로 콘솔을 열지 않고도 반응성 발화를 확인할 수 있습니다.

### 컴포넌트 통신

| 컴포넌트 | props | emits |
| --- | --- | --- |
| `BaseDashboardCard` | `title`, `titleId`, `eyebrow`, `icon` | — (슬롯: 기본 / `meta`) |
| `SearchBar` | `modelValue`, `resultCount`, `recentSearches` | `update-query`, `submit`, `select-recent`, `remove-recent` |
| `CitySearchResults` | `results`, `status`, `visible` | `select` |
| `WeatherCard` | `city`, `selected`, `now` | `select-card`, `click-detail`, `toggle-favorite` |
| `IndexGrid` / `IndexCard` | `indices` / `index` | — |
| `PreparationPanel` | `cityName`, `items` | — |
| `WalkTimePanel` | `city`, `availableHours`, `walkImage`, `stayHomeImage` | — |
| `LogPanel` | `logs` | — |

### 슬롯과 스코프

`BaseDashboardCard`는 패널 껍데기(테두리·라운드·그림자·헤더)만 갖는 액자이고, 내용은 `<slot>`으로 주입받습니다.

```vue
<BaseDashboardCard eyebrow="REGIONAL WEATHER" title="지역별 날씨" title-id="cities-title">
  <template #meta>{{ selectionMessage }}</template>
  <WeatherCard v-for="city in filteredCities" :key="city.id" :city="city"
    @select-card="handleSelectCity" @click-detail="handleDetail" />
</BaseDashboardCard>
```

`<WeatherCard>`는 화면상 `BaseDashboardCard` 안에 그려지지만 **코드상으로는 `WeatherParent`의 템플릿에 적혀 있으므로 부모 스코프에서 컴파일**됩니다. 따라서 props/emit 상대는 언제나 `WeatherParent`이고, `BaseDashboardCard`는 데이터를 전혀 만지지 않습니다.

같은 이유로 **슬롯 콘텐츠는 `BaseDashboardCard`의 `<style scoped>`를 받지 않습니다.** 내용 스타일은 전부 넣는 쪽에 둡니다. 패널마다 다른 배경·아이콘 색은 CSS 변수(`--card-bg`, `--card-icon-bg` 등)로 노출해 사용처에서 덮어씁니다.

### Pinia

`useWeatherStore` (Setup Store, `src/stores/weatherStore.js`)

- **state** — `cities`, `selectedCityId`, `searchQuery`, `recentSearches`, `searchResults`, `searchStatus`, `cityLoadStatus`, `loadStatus`, `error`
- **getters** — `selectedCity`, `filteredCities`, `favoriteCities`
- **actions** — `loadCities`, `searchCities`, `clearSearch`, `addCityFromSearchResult`, `removeCity`, `selectCity`, `toggleFavorite`, `addRecentSearch`, `removeRecentSearch`, `refreshCity`

좌표 기반 중복 판정(`isSameLocation`)으로 같은 도시가 두 번 추가되지 않습니다. `refreshCity`는 갱신 시에도 즐겨찾기 상태를 보존합니다.

### 확장 포인트: 지수 레지스트리

지수는 컴포넌트에 하드코딩되지 않고 배열로 등록됩니다.

```js
export const INDICES = [carWash, outdoorActivity, iceAmericano, bungeoppang, mosquito]

export const computeIndices = (weather) =>
  INDICES.map((index) => ({ ...index, ...index.compute(weather) }))
```

`IndexGrid`는 이 배열을 `v-for`로 순회합니다. **지수 추가 = `src/utils/indices/`에 파일 1개 작성 + 배열에 한 줄 등록**이며, 컴포넌트는 수정하지 않습니다.

### Modern JavaScript

- `async` / `await`, `Promise.all` — 세 엔드포인트 병렬 호출
- `AbortController` — 이전 검색 요청 취소
- Optional chaining / nullish coalescing — API 응답 누락 필드 방어
- `structuredClone` — Mock 데이터 원본 오염 방지
- `Map` — 예보 일별 그룹핑
- `URL` / `URLSearchParams` — 쿼리 문자열 조립
- ES Module `import` / `export`, 순수 함수 단위 분리

---

## 테스트

`node:test` 8개, 외부 러너 없이 `npm test`로 실행됩니다.

```
✔ 국내 도시 카탈로그와 별칭을 검색한다
✔ Geocoding 결과는 국내만 남기고 내부 위치 모델로 바꾼다
✔ Forecast를 날짜별 최대 pop으로 묶는다
✔ OpenWeather 필드를 고정 내부 스키마로 매핑한다
✔ 지수 레지스트리 계약과 Mock 등급 분포를 지킨다
✔ 지수 경계와 다음 비를 계산한다
✔ 산책 시간은 맑은 15~26도를 포함하고 비를 제외한다
✔ 데이터 소스를 선택하고 잘못된 설정을 거부한다
```

특히 다음 두 가지를 자동으로 강제합니다.

- **지수 등급 분포** — 각 지수가 Mock 8개 도시에서 최소 2개 이상 서로 다른 등급을 내야 통과. 목업 값이 한쪽으로 쏠려 조건부 렌더링이 화면에 드러나지 않는 상황을 막습니다.
- **경계값** — 붕어빵 15℃ 반전, 모기 15℃ 컷오프, `findNextRain`의 최초 강수일 선택 및 빈 배열 → `null` 처리

---

## 과제 요건 대응

| 요건 | 구현 위치 |
| --- | --- |
### 과제 1 — Mockup

| 요건 | 구현 위치 |
| --- | --- |
| 배열 렌더링 (`v-for`) + `:key` | `WeatherParent`(도시), `IndexGrid`(지수), `SearchBar`(최근 검색), `WalkTimePanel`(시간대) |
| 조건부 렌더링 (`v-if`) | `WeatherCard`의 25℃ 기준 더움/선선함 뱃지, 산책 가능 시간 유무, 로딩/에러/빈 결과 |
| 양방향 바인딩 · 한글 처리 (`:value`, `@input`) | `SearchBar.vue` — IME 조합 대응을 위해 `v-model` 대신 수동 바인딩 |
| 카드 선택 시 상태 표기 | `WeatherParent`의 `handleSelectCity` → `"{도시}이(가) 선택되었습니다."` |
| 상세보기 버블링 차단 | `@click.stop="$emit('click-detail', city)"` → `window.alert` |
| 본인 데이터 추가 | 8개 도시 카탈로그, 시간대별·일별 예보, 미세먼지, 생활 지수 5종, 산책 시간 · 외출 준비물 추천 |

### 과제 2 — 반응형 상태 추적

과제 문서의 변수명과 구현의 변수명이 다릅니다. 스토어와 테스트가 현재 이름에 묶여 있어 리네이밍하지 않았습니다.

| 과제 문서 | 구현 | 위치 |
| --- | --- | --- |
| `searchQuery` | `searchQuery` | 스토어 state |
| `weatherList` | `cities` | 스토어 state |
| `filteredWeatherList` | `filteredCities` | 스토어 getter |
| `selectedCityInfo` | `selectedCity` | 스토어 getter |

| 요건 | 구현 위치 |
| --- | --- |
| 반응형 상태 관리 | 위 대응표 참고 |
| computed 필터링 | `filteredCities` — 검색어를 `name`/`state`/`apiName`에 부분 일치 |
| `watch`로 상태바 문구 감시 | `watch(selectionMessage, …)` → 콘솔 + `LogPanel` |
| `watchEffect`로 검색어 추적 | 마운트 즉시 1회 + 타이핑마다 발화 |
| 검색 결과 3분기 표시 | 빈 검색어→전체 / 일치→해당 카드 / 불일치→안내 블록 |
| 본인 상태·computed·watcher 추가 | `logs` ref + `LogPanel`, `dashboardSummary`·`bestWalkCity` computed, deep·다중 소스·getter 소스 watcher 3종 |

### 과제 3 — 컴포넌트 분리

| 요건 | 구현 위치 |
| --- | --- |
| `WeatherParent.vue` — 모든 반응형 데이터 유지 | `components/weather/WeatherParent.vue` |
| `BaseDashboardCard.vue` — 디자인 공통화 + `<slot>` | 6개 패널이 공유. `meta` 네임드 슬롯 포함 |
| `SearchBar.vue` — props/emits | `modelValue` ← / `update-query` → |
| `WeatherCard.vue` — props/emits | `city` ← / `select-card`·`click-detail` → |
| 컴포넌트별 `<style scoped>` 분리 | 껍데기는 `BaseDashboardCard`, 내용 스타일은 각 컴포넌트 |
| 슬롯 자식은 부모 스코프에서 컴파일 | [슬롯과 스코프](#슬롯과-스코프) 참고 |
| 추가 Component | `IndexGrid`·`IndexCard`·`PreparationPanel`·`WalkTimePanel`·`LogPanel`·`CitySearchResults` |
