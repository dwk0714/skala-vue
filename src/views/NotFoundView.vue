<template>
  <main class="not-found">
    <p>404</p>
    <h1>페이지를 찾을 수 없어요.</h1>
    <RouterLink to="/">메인으로 돌아가기</RouterLink>
  </main>
</template>

<style scoped>
.not-found {
  display: grid;
  min-height: 100vh;
  place-content: center;
  gap: 12px;
  text-align: center;
}

.not-found p,
.not-found h1 {
  margin: 0;
}

.not-found a {
  color: var(--primary-700);
  font-weight: 700;
}
</style>
