<!--
  CitySearchResults.vue — 검색 결과 드롭다운

  어떤 컴포넌트인가:
    검색어에 매칭된 도시 후보를 검색창 아래에 띄우는 오버레이.
    검색을 직접 수행하지 않는다. 이미 만들어진 결과 배열과 로딩 상태를 받아 그리기만 한다.

  부모:  WeatherParent.vue — SearchBar 바로 아래, .search-shell 안에 놓인다
  자식:  없음

  화면 상태 3분기:
    로딩 중 → "도시를 찾고 있어요…"
    결과 있음 → 도시 버튼 목록
    결과 없음 → "일치하는 국내 도시가 없습니다."
-->
<script setup>
/**
 * props
 *
 * @property {Array}   results  검색 결과 도시 배열. { id, name, state, coords } 사용
 * @property {string}  status   검색 진행 상태. 'idle' | 'loading' | 'success' | 'error'
 *                              (여기서는 'loading'만 구분하고 나머지는 결과 유무로 판단)
 * @property {boolean} visible  드롭다운 노출 여부. 부모가 검색어 유무로 결정한다
 */
defineProps({
  results: { type: Array, default: () => [] },
  status: { type: String, default: 'idle' },
  visible: { type: Boolean, default: false },
})

/**
 * emits
 *
 * select  결과 항목 클릭 → 부모가 해당 도시를 목록에 추가하고 선택한다
 */
defineEmits(['select'])
</script>

<template>
  <div v-if="visible" class="results-panel">
    <p v-if="status === 'loading'" class="result-state">도시를 찾고 있어요…</p>
    <template v-else-if="results.length">
      <button v-for="city in results" :key="city.id" type="button" @click="$emit('select', city)">
        <!-- 좌측: 도시명 + 행정구역 / 우측: 좌표 (동명 도시 구분용) -->
        <span
          ><strong>{{ city.name }}</strong> · {{ city.state }}</span
        >
        <small>{{ city.coords.lat.toFixed(4) }}, {{ city.coords.lon.toFixed(4) }}</small>
      </button>
    </template>
    <p v-else class="result-state">일치하는 국내 도시가 없습니다.</p>
  </div>
</template>

<style scoped>
/*
  드롭다운 본체 — 검색 패널 바로 아래에 겹쳐 뜨는 흰 박스
  position:absolute + z-index:20 으로 아래 카드들 위에 떠 있고,
  left/right 24px 는 검색 패널의 좌우 안쪽 여백에 맞춘 값이다.
  margin-top:-8px 로 검색창에 살짝 붙여 한 덩어리처럼 보이게 한다.
  배경: 거의 불투명한 흰색 / 그림자: 떠 있는 느낌의 강한 그림자
*/
.results-panel {
  position: absolute;
  z-index: 20;
  right: 24px;
  left: 24px;
  margin-top: -8px;
  overflow: hidden;
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: var(--shadow-float);
}

/* 결과 한 줄 — 좌측 도시명 / 우측 좌표, 아래 헤어라인으로 구분 */
button {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border: 0;
  border-bottom: 1px solid var(--border-soft);
  padding: 12px 14px;
  background: transparent;
  color: var(--ink-700);
  cursor: pointer;
  font: inherit;
  text-align: left;
}

/* 마우스오버·키보드 포커스 — 아주 옅은 초록 배경 */
button:hover,
button:focus-visible {
  background: var(--primary-050);
}

/* 마지막 줄은 아래 구분선 제거 */
button:last-child {
  border-bottom: 0;
}

/* 좌표 텍스트 — 줄 우측 끝, 흐린 회녹색 */
small {
  color: var(--ink-400);
}

/* 로딩·빈 결과 안내 — 드롭다운 가운데 정렬 */
.result-state {
  margin: 0;
  padding: 16px;
  color: var(--ink-500);
  text-align: center;
}
</style>
