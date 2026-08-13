<!--
  SearchBar.vue — 도시 검색창 + 최근 검색어 태그 (과제 3 요건 3)

  어떤 컴포넌트인가:
    검색어 입력과 최근 검색어 UI만 담당하는 프레젠테이션 컴포넌트.
    검색을 실행하지 않는다. 입력이 바뀌면 부모에게 알리기만 하고,
    실제 검색(디바운스·API 호출)은 부모→스토어가 처리한다.

  부모:  WeatherHomeView.vue — 히어로 아래 .search-shell 안
  자식:  BaseDashboardCard.vue — 패널 껍데기를 빌려 쓴다

  한글 IME 처리 (과제 1 요건 3):
    ElInput의 model-value / input 이벤트를 사용해 입력값을 부모에 즉시 전달한다.
    검색 실행과 상태 관리는 여전히 부모와 Store가 담당한다.
-->
<script setup>
import { Search } from '@element-plus/icons-vue'
import BaseDashboardCard from '../shared/BaseDashboardCard.vue'

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
    title="당신의 도시를 어디인가요?"
    title-id="city-search-title"
  >
    <!-- 헤더 우측: 현재 필터에 걸린 도시 수 -->
    <template #meta>
      <ElTag class="result-count" round>{{ resultCount }}개 도시</ElTag>
    </template>

    <!-- .prevent 로 폼 기본 제출(페이지 새로고침)을 막는다 -->
    <form class="search-form" @submit.prevent="emit('submit')">
      <ElInput
        class="search-input"
        :model-value="modelValue"
        :prefix-icon="Search"
        size="large"
        clearable
        autocomplete="off"
        placeholder="당신의 도시를 입력해 주세요"
        aria-label="도시 검색"
        @input="emit('update-query', $event)"
        @clear="emit('update-query', '')"
      />
      <ElButton class="search-button" type="primary" size="large" native-type="submit"
        >검색</ElButton
      >
    </form>

    <!-- 최근 검색어: 있을 때만 노출. 태그마다 [검색어][×] 두 버튼 -->
    <div v-if="recentSearches.length" class="recent-row">
      <span>최근 검색</span>
      <ElTag
        v-for="item in recentSearches"
        :key="item"
        class="recent-tag"
        round
        closable
        role="button"
        tabindex="0"
        @click="emit('select-recent', item)"
        @keydown.enter="emit('select-recent', item)"
        @close.stop="emit('remove-recent', item)"
        >{{ item }}</ElTag
      >
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
  font-size: 0.76rem;
  font-weight: 750;
}

/* 검색 입력줄 — 패널 중앙. [⌕] [입력창] [검색버튼] 가로 배치 */
.search-form {
  gap: 10px;
}

.search-input {
  min-width: 0;
  flex: 1;
}

/* Element Plus 입력창 내부까지 알약 형태로 만들어 검색 영역을 부드럽게 보이게 한다. */
.search-input :deep(.el-input__wrapper) {
  border-radius: 999px;
  padding-inline: 18px;
  background: var(--surface-soft);
  box-shadow: 0 0 0 1px var(--border-soft) inset;
}

.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px var(--primary-500) inset;
}

/* 기본 단색 버튼 대신 대시보드의 파랑 계열 그라디언트를 사용한다. */
.search-button {
  flex: 0 0 auto;
  border: 0;
  border-radius: 999px;
  padding-inline: 24px;
  background: linear-gradient(135deg, #1687e8, #1765c7);
  box-shadow: 0 8px 18px rgba(23, 101, 199, 0.24);
  color: #fff;
  font-weight: 750;
}

.search-button:hover,
.search-button:focus-visible {
  background: linear-gradient(135deg, #2797f1, #1a71d8);
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
  cursor: pointer;
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
