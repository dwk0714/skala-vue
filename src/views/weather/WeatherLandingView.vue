<template>
  <main class="landing-page">
    <section class="landing-hero">
      <div class="landing-copy">
        <span>WEATHER WALK</span>
        <h1>오늘, 어느 도시의 날씨가 좋을까요?</h1>
        <p>국내 도시의 날씨를 비교하고 생활 지수와 산책 추천까지 한 번에 확인하세요.</p>
        <div class="landing-actions">
          <RouterLink class="primary-action" to="/weather">지역 날씨 확인하기 →</RouterLink>
          <RouterLink class="secondary-action" to="/about">서비스 소개</RouterLink>
        </div>
      </div>
      <div class="landing-orbit" aria-hidden="true">
        <span>☀️</span>
        <i>🌿</i>
        <b>☁️</b>
      </div>
    </section>

    <section class="landing-summary" aria-label="서비스 주요 기능">
      <article><strong>8곳</strong><span>국내 주요 도시</span></article>
      <article><strong>5종</strong><span>생활 날씨 지수</span></article>
      <article><strong>1:1</strong><span>도시 날씨 대결</span></article>
    </section>
  </main>
</template>

<style scoped>
.landing-page {
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
  padding: 58px 0 50px;
}

.landing-hero {
  position: relative;
  display: flex;
  min-height: 430px;
  align-items: center;
  overflow: hidden;
  border: 1px solid var(--border-soft);
  border-radius: 32px;
  padding: clamp(34px, 7vw, 82px);
  background: var(--hero-bg);
  box-shadow: var(--shadow-float);
  backdrop-filter: var(--glass-blur);
}

.landing-copy {
  position: relative;
  z-index: 2;
  max-width: 920px;
}

.landing-copy > span {
  color: var(--primary-700);
  font-size: 0.7rem;
  font-weight: 850;
  letter-spacing: 0.18em;
}

h1 {
  margin: 10px 0 16px;
  color: var(--ink-900);
  font-size: clamp(2.35rem, 4vw, 3.2rem);
  line-height: 1.08;
  letter-spacing: -0.055em;
  white-space: nowrap;
}

p {
  max-width: 620px;
  margin: 0;
  color: var(--ink-600);
  font-size: clamp(0.9rem, 1.8vw, 1.05rem);
  line-height: 1.75;
  word-break: keep-all;
}

.landing-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 28px;
}

.landing-actions a {
  border-radius: 999px;
  padding: 12px 17px;
  font-size: 0.8rem;
  font-weight: 850;
  text-decoration: none;
}

.primary-action {
  background: var(--accent-gradient);
  box-shadow: 0 10px 24px rgba(30, 111, 196, 0.24);
  color: var(--text-on-accent);
}

.secondary-action {
  border: 1px solid var(--border-soft);
  background: var(--surface-soft);
  color: var(--primary-800);
  backdrop-filter: blur(14px);
}

.landing-orbit {
  position: absolute;
  right: 8%;
  width: 210px;
  height: 210px;
  border: 1px solid var(--border-soft);
  border-radius: 50%;
  background: var(--surface-soft);
  box-shadow: inset 0 0 50px rgba(105, 188, 255, 0.16);
  backdrop-filter: blur(18px);
}

.landing-orbit span,
.landing-orbit i,
.landing-orbit b {
  position: absolute;
  display: grid;
  width: 58px;
  height: 58px;
  place-items: center;
  border-radius: 18px;
  background: var(--surface-card);
  box-shadow: var(--shadow-card);
  font-size: 1.65rem;
  font-style: normal;
}

.landing-orbit span {
  top: 18px;
  left: 18px;
}

.landing-orbit i {
  right: 14px;
  bottom: 42px;
}

.landing-orbit b {
  bottom: -16px;
  left: 20px;
}

.landing-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 18px;
}

.landing-summary article {
  display: grid;
  gap: 4px;
  border: 1px solid var(--border-soft);
  border-radius: 18px;
  padding: 20px;
  background: var(--surface-card);
  box-shadow: var(--shadow-card);
  backdrop-filter: var(--glass-blur);
}

.landing-summary strong {
  color: var(--primary-800);
  font-size: 1.15rem;
}

.landing-summary span {
  color: var(--ink-500);
  font-size: 0.75rem;
}

@media (max-width: 800px) {
  .landing-page {
    width: min(100% - 20px, 1240px);
    padding-top: 28px;
  }

  .landing-hero {
    min-height: 420px;
    align-items: flex-start;
  }

  h1 {
    text-wrap: balance;
    white-space: normal;
    word-break: keep-all;
  }

  .landing-orbit {
    right: -60px;
    bottom: -55px;
    transform: scale(0.75);
  }

  .landing-summary {
    grid-template-columns: 1fr;
  }
}
</style>
