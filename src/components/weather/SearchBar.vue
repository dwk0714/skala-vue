<!--
  SearchBar.vue — 도시 검색창 + 최근 검색어 태그 (과제 3 요건 3)

  어떤 컴포넌트인가:
    검색어 입력과 최근 검색어 UI만 담당하는 프레젠테이션 컴포넌트.
    검색을 실행하지 않는다. 입력이 바뀌면 부모에게 알리기만 하고,
    실제 검색(디바운스·API 호출)은 부모→스토어가 처리한다.

  부모:  WeatherParent.vue — 히어로 아래 .search-shell 안
  자식:  BaseDashboardCard.vue — 패널 껍데기를 빌려 쓴다

  한글 IME 처리 (과제 1 요건 3):
    v-model을 쓰지 않고 :value / @input 으로 나눠 처리한다.
    v-model은 한글 조합이 끝나야 값을 반영하는 경우가 있어,
    조합 중 글자가 유실되거나 한 박자 늦게 반영될 수 있다.
    :value + @input 은 input 이벤트가 날 때마다 그대로 올려보내므로
    "부" → "부사" → "부산" 각 단계가 모두 부모에 전달된다.
-->
<script setup>
import BaseDashboardCard from './BaseDashboardCard.vue'

/**
 * props
 *
 * @property {string} modelValue      현재 검색어. 부모의 searchQuery를 그대로 받는다
 * @property {number} resultCount     헤더 우측에 표시할 필터 결과 개수 (예: "8개 도시")
 * @property {Array}  recentSearches  최근 검색어 문자열 배열 (최신순, 최대 5개)
 */
defineProps({
  modelValue: { type: String, default: '' },
  resultCount: { type: Number, default: 0 },
  recentSearches: { type: Array, default: () => [] },
})

/**
 * emits
 *
 * update-query  {string} 입력이 바뀔 때마다. 부모가 searchQuery에 대입한다
 *               (v-model 규약인 update:modelValue 대신 과제가 지정한 이름을 쓴다)
 * submit        검색 버튼 클릭 또는 Enter. 부모가 최근 검색어에 추가하고 첫 결과를 선택한다
 * select-recent {string} 최근 검색어 태그 본문 클릭 → 그 검색어로 다시 검색
 * remove-recent {string} 태그의 × 클릭 → 그 검색어만 목록에서 제거
 */
const emit = defineEmits(['update-query', 'submit', 'select-recent', 'remove-recent'])
</script>

<template>
  <BaseDashboardCard
    eyebrow="CITY FINDER"
    title="오늘 걸을 도시를 찾아보세요"
    title-id="city-search-title"
  >
    <!-- 헤더 우측: 현재 필터에 걸린 도시 수 -->
    <template #meta>
      <span class="result-count">{{ resultCount }}개 도시</span>
    </template>

    <!-- .prevent 로 폼 기본 제출(페이지 새로고침)을 막는다 -->
    <form class="search-form" @submit.prevent="emit('submit')">
      <span aria-hidden="true">⌕</span>
      <input
        :value="modelValue"
        type="search"
        autocomplete="off"
        placeholder="서울, 울산, 제주처럼 입력해 보세요"
        aria-label="도시 검색"
        @input="emit('update-query', $event.target.value)"
      />
      <button type="submit">검색</button>
    </form>

    <!-- 최근 검색어: 있을 때만 노출. 태그마다 [검색어][×] 두 버튼 -->
    <div v-if="recentSearches.length" class="recent-row">
      <span>최근 검색</span>
      <div v-for="item in recentSearches" :key="item" class="recent-tag">
        <button type="button" @click="emit('select-recent', item)">{{ item }}</button>
        <button
          type="button"
          :aria-label="`${item} 최근 검색어 삭제`"
          @click="emit('remove-recent', item)"
        >
          ×
        </button>
      </div>
    </div>
  </BaseDashboardCard>
</template>

<style scoped>
/*
  패널 루트 — 히어로 바로 아래 전체 폭
  --card-* 로 BaseDashboardCard 헤더를 이 패널용으로 덮는다 (제목이 가장 크고 eyebrow가 진초록)
  z-index:5 는 아래로 펼쳐지는 검색 결과 드롭다운과의 겹침 순서를 잡기 위한 것
  backdrop-filter: 뒤 배경을 흐리게 해 유리판 느낌을 준다
*/
.dashboard-card {
  --card-heading-gap: 20px;
  --card-heading-margin: 18px;
  --card-eyebrow-color: var(--primary-700);
  --card-eyebrow-size: 0.68rem;
  --card-eyebrow-weight: 800;
  --card-eyebrow-spacing: 0.14em;
  --card-title-margin: 4px 0 0;
  --card-title-size: clamp(1.15rem, 2vw, 1.45rem);
  position: relative;
  z-index: 5;
  padding: 24px;
  backdrop-filter: blur(18px);
}

.recent-row,
.search-form {
  display: flex;
  align-items: center;
}

/* "8개 도시" 뱃지 — 패널 우측 상단. 연초록 배경 + 진초록 글자 */
.result-count {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 7px 11px;
  background: var(--primary-100);
  color: var(--primary-800);
  font-size: 0.76rem;
  font-weight: 750;
}

/* 검색 입력줄 — 패널 중앙. [⌕] [입력창] [검색버튼] 가로 배치 */
.search-form {
  gap: 10px;
  border: 1px solid var(--border-strong);
  border-radius: 15px;
  padding: 7px 8px 7px 15px;
  background: rgba(255, 255, 255, 0.82);
  transition:
    box-shadow 0.2s,
    border-color 0.2s;
}

/* 입력 중 — 테두리가 초록으로 바뀌고 연초록 링이 생긴다 */
.search-form:focus-within {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 4px rgba(57, 132, 99, 0.12);
}

/* 입력창 — 남는 폭을 모두 차지. 자체 테두리·배경 없음 */
input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  padding: 8px 0;
  background: transparent;
  color: var(--ink-900);
  font: inherit;
}

/* [검색] 버튼 — 입력줄 우측 끝. 진초록 배경 + 흰 글자 */
.search-form > button {
  border: 0;
  border-radius: 11px;
  padding: 10px 17px;
  background: var(--primary-700);
  color: white;
  cursor: pointer;
  font: inherit;
  font-weight: 750;
}

/* 최근 검색 줄 — 입력줄 아래. 태그가 많으면 다음 줄로 넘어간다 */
.recent-row {
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
  color: var(--ink-500);
  font-size: 0.76rem;
}

/* 검색어 태그 — 연회색 배경의 알약. 안에 버튼 두 개가 붙어 있다 */
.recent-tag {
  display: inline-flex;
  overflow: hidden;
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  background: var(--surface-muted);
}

/* 태그 본문 버튼 (검색어 텍스트) */
.recent-tag button {
  border: 0;
  padding: 6px 9px;
  background: transparent;
  color: var(--ink-700);
  cursor: pointer;
  font: inherit;
}

/* 태그 우측 × 버튼 — 본문보다 흐린 색으로 보조 동작임을 표시 */
.recent-tag button:last-child {
  padding-left: 2px;
  color: var(--ink-400);
}

/* 좁은 화면 — 여백을 줄이고, 자리를 많이 먹는 결과 개수 뱃지는 숨긴다 */
@media (max-width: 540px) {
  .dashboard-card {
    padding: 18px;
  }
  .result-count {
    display: none;
  }
}
</style>
