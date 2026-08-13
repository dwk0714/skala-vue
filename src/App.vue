<script setup>
import { watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import ko from 'element-plus/es/locale/lang/ko'
import UnitToggler from './components/weather/shared/UnitToggler.vue'
import { useConfigStore } from './stores/configStore.js'

const configStore = useConfigStore()
const { theme } = storeToRefs(configStore)

watchEffect(() => {
  document.documentElement.dataset.theme = theme.value
  document.documentElement.classList.toggle('dark', theme.value === 'dark')
})
</script>

<template>
  <ElConfigProvider :locale="ko" :z-index="3000">
    <header class="app-header">
      <nav aria-label="주요 메뉴">
        <RouterLink class="brand" to="/">Weather Walk</RouterLink>
        <div class="nav-actions">
          <div class="nav-links">
            <RouterLink to="/weather">지역 날씨</RouterLink>
            <RouterLink to="/favorites">즐겨찾기</RouterLink>
            <RouterLink to="/battle">도시 대결</RouterLink>
            <RouterLink to="/about">소개</RouterLink>
          </div>
          <UnitToggler />
        </div>
      </nav>
    </header>
    <RouterView v-slot="{ Component, route }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="route.name" />
      </Transition>
    </RouterView>
  </ElConfigProvider>
</template>

<style scoped>
.app-header {
  position: sticky;
  z-index: 30;
  top: 0;
  border-bottom: 1px solid var(--border-soft);
  background: var(--header-bg);
  backdrop-filter: var(--glass-blur);
  box-shadow: 0 1px 22px rgba(11, 46, 82, 0.08);
}

nav {
  display: flex;
  width: min(1240px, calc(100% - 32px));
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin: 0 auto;
}

a {
  color: var(--ink-500);
  font-size: 0.78rem;
  font-weight: 650;
  text-decoration: none;
}

.brand {
  flex: 0 0 auto;
  color: var(--primary-800);
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.nav-links a {
  border-radius: 999px;
  padding: 9px 12px;
}

.nav-links a:hover,
.nav-links a.router-link-exact-active {
  background: var(--primary-100);
  color: var(--primary-800);
}

@media (max-width: 660px) {
  nav {
    width: 100%;
    align-items: start;
    flex-direction: column;
    gap: 5px;
    padding: 12px 10px 8px;
  }

  .brand {
    padding-left: 8px;
  }

  .nav-actions {
    width: 100%;
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .nav-links {
    width: 100%;
    overflow-x: auto;
  }

  .nav-links a {
    flex: 0 0 auto;
  }
}

:global(.page-enter-active),
:global(.page-leave-active) {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

:global(.page-enter-from),
:global(.page-leave-to) {
  opacity: 0;
  transform: translateY(5px);
}
</style>
