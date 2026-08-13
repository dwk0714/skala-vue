<script setup>
import BaseDashboardCard from '../../components/weather/shared/BaseDashboardCard.vue'
</script>

<template>
  <main class="about-page">
    <header>
      <span>ABOUT WEATHER WALK</span>
      <h1>날씨를 일상의 선택으로</h1>
      <p>도시별 관측부터 외출 판단, 날씨 음악과 도시 그랑프리까지</p>
    </header>

    <section class="about-grid">
      <BaseDashboardCard title="지역 날씨" title-id="about-cities" icon="🏙️">
        <p>국내 도시를 검색하고 현재 날씨와 시간대별 예보를 비교해보세요</p>
      </BaseDashboardCard>
      <BaseDashboardCard title="생활 지수" title-id="about-indices" icon="🌿">
        <p>손세차·야외활동·얼죽아·붕어빵·모기 지수를 확인해보세요</p>
      </BaseDashboardCard>
      <BaseDashboardCard title="도시 그랑프리" title-id="about-battle" icon="🏁">
        <p>당신의 도시로 타 도시를 이겨보세요! 라운드 종합점수로 우위를 가려보세요</p>
      </BaseDashboardCard>
      <BaseDashboardCard title="날씨 음악" title-id="about-music" icon="🎧">
        <p>오늘에 어울리는 플레이리스트를 추천합니다</p>
      </BaseDashboardCard>
    </section>

    <RouterLink class="home-link" to="/">← 메인으로 돌아가기</RouterLink>
  </main>
</template>

<style scoped>
.about-page {
  width: min(960px, calc(100% - 32px));
  margin: 0 auto;
  padding: 60px 0 50px;
}

header {
  max-width: 900px;
}

header span {
  color: var(--primary-700);
  font-size: 0.68rem;
  font-weight: 850;
  letter-spacing: 0.16em;
}

h1 {
  margin: 8px 0 12px;
  color: var(--ink-900);
  font-size: clamp(2.2rem, 5vw, 3.6rem);
  line-height: 1.08;
  letter-spacing: -0.06em;
  white-space: nowrap;
}

header p,
.about-grid p {
  color: var(--ink-500);
  line-height: 1.7;
}

.about-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 40px;
}

.about-grid p {
  margin: 0;
  font-size: 0.78rem;
}

.home-link {
  display: inline-block;
  margin-top: 28px;
  color: var(--primary-700);
  font-size: 0.8rem;
  font-weight: 800;
  text-decoration: none;
}

@media (max-width: 760px) {
  h1 {
    text-wrap: balance;
    white-space: normal;
    word-break: keep-all;
  }

  .about-grid {
    grid-template-columns: 1fr;
  }
}
</style>
