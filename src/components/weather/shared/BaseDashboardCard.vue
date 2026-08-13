<!--
  BaseDashboardCard.vue — 대시보드 공용 패널 "액자"

  어떤 컴포넌트인가:
    화면의 모든 패널이 공유하는 껍데기(테두리·라운드·그림자·헤더)만 담당하는
    프레젠테이션 컴포넌트. 내용은 <slot>으로 주입받으며 데이터를 전혀 다루지 않는다.
    스토어를 모르고, 자기 안에 무엇이 들어오는지도 모른다.

  부모 (이 컴포넌트를 쓰는 쪽):
    날씨 View와 하위 패널 — 지역별 날씨 / 생활 지수 패널
    SearchBar.vue          — 도시 검색 패널
    PreparationPanel.vue   — 외출 준비물 패널
    WalkTimePanel.vue      — 산책 추천 시간 패널

  자식:
    없음. 슬롯으로 받은 내용을 그대로 렌더할 뿐이다.

  슬롯 스코프 주의 (과제 3 요건 6):
    슬롯에 들어온 마크업은 "넣는 쪽"의 스코프에서 컴파일된다. 따라서
    - 슬롯 내용은 이 파일의 <style scoped>를 적용받지 못한다 → 내용 스타일은 넣는 쪽에 둔다
    - 슬롯 안 컴포넌트의 props/emit 상대는 이 컴포넌트가 아니라 넣는 쪽이다
-->
<script setup>
/**
 * props — 헤더에 표시할 텍스트만 받는다. 데이터·상태는 일절 받지 않는다.
 *
 * @property {string} title    패널 제목. <h2>로 렌더 (예: "지역별 날씨")
 * @property {string} titleId  <h2>의 id. 루트 <section aria-labelledby>와 짝지어
 *                             스크린리더가 이 패널의 이름을 읽게 한다. 페이지 내 고유해야 함
 * @property {string} eyebrow  제목 위 소형 영문 라벨 (예: "REGIONAL WEATHER"). 없으면 미표시
 * @property {string} icon     헤더 좌측 아이콘 칩에 넣을 이모지 (예: "🎒"). 없으면 칩 자체가 미표시
 */
defineProps({
  title: { type: String, required: true },
  titleId: { type: String, required: true },
  eyebrow: { type: String, default: '' },
  icon: { type: String, default: '' },
})
</script>

<template>
  <section class="dashboard-card" :aria-labelledby="titleId">
    <header class="card-heading">
      <!-- 아이콘 칩: icon prop이 있을 때만. 장식이므로 스크린리더에서 제외 -->
      <span v-if="icon" class="card-icon" aria-hidden="true">{{ icon }}</span>
      <div>
        <small v-if="eyebrow">{{ eyebrow }}</small>
        <h2 :id="titleId">{{ title }}</h2>
      </div>
      <!-- meta 슬롯: 헤더 우측 보조 영역. 검색 결과 개수, 선택 상태 문구 등
           내용이 없으면 빈 div가 레이아웃을 밀지 않도록 v-if로 제거한다 -->
      <div v-if="$slots.meta" class="card-meta"><slot name="meta" /></div>
    </header>
    <!-- 기본 슬롯: 패널 본문 -->
    <slot />
  </section>
</template>

<style scoped>
/*
  패널 본체 — 화면 중앙 열에 세로로 쌓이는 카드 한 장
  배경: 반투명 흰색(--surface-glass, rgba(255,255,255,.72)) / 테두리: 옅은 청록 헤어라인
  --card-bg 를 덮으면 배경을 바꿀 수 있다 (WalkTimePanel이 그라디언트로 교체)
*/
.dashboard-card {
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-xl);
  padding: 22px;
  background: var(--card-bg, var(--surface-glass));
  box-shadow: var(--shadow-card);
  backdrop-filter: var(--glass-blur);
}

/*
  헤더 — 패널 최상단 가로줄
  [아이콘 칩] [eyebrow + 제목] ......... [meta 슬롯(우측 끝)]
  아래 --card-* 변수는 패널마다 헤더 모양이 달라 노출한 조절 손잡이다
*/
.card-heading {
  display: flex;
  align-items: var(--card-heading-align, center);
  flex-direction: var(--card-heading-direction, row);
  gap: var(--card-heading-gap, 12px);
  margin-bottom: var(--card-heading-margin, 17px);
}

/* eyebrow — 제목 바로 위 소형 라벨. 기본 회녹색(--ink-400) */
.card-heading small {
  color: var(--card-eyebrow-color, var(--ink-400));
  font-size: var(--card-eyebrow-size, 0.62rem);
  font-weight: var(--card-eyebrow-weight, 400);
  letter-spacing: var(--card-eyebrow-spacing, 0.08em);
}

/* 제목 — 헤더 좌측(아이콘이 있으면 그 오른쪽). 짙은 먹색(--ink-900) */
.card-heading h2 {
  margin: var(--card-title-margin, 2px 0 0);
  color: var(--ink-900);
  font-size: var(--card-title-size, 1.1rem);
}

/* 아이콘 칩 — 헤더 좌측 끝 46×46 둥근 사각형
   배경색은 패널마다 다르다: 준비물 크림색(#fff3dc) / 산책 반투명 흰색 */
.card-icon {
  display: grid;
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 14px;
  background: var(--card-icon-bg, var(--surface-muted));
  font-size: 1.35rem;
}

/* meta 영역 — margin-left:auto 로 헤더 우측 끝으로 밀어낸다 */
.card-meta {
  margin-left: var(--card-meta-margin-left, auto);
}
</style>
