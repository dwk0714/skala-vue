<!-- 날씨와 현지 시간으로 고른 Spotify 플레이리스트를 재생하는 표시 컴포넌트. -->
<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  recommendations: { type: Array, default: () => [] },
})

const selectedIndex = ref(0)
const recommendation = computed(() => props.recommendations[selectedIndex.value] ?? null)
const spotifyUrl = computed(() =>
  recommendation.value ? `https://open.spotify.com/playlist/${recommendation.value.spotifyId}` : '',
)
const spotifyEmbedUrl = computed(() =>
  recommendation.value
    ? `https://open.spotify.com/embed/playlist/${recommendation.value.spotifyId}?utm_source=generator&theme=0`
    : '',
)

/** 도시나 날씨가 바뀌면 새 조건의 첫 추천으로 되돌린다. */
watch(
  () => props.recommendations,
  () => (selectedIndex.value = 0),
)

const selectNext = () => {
  if (props.recommendations.length > 1)
    selectedIndex.value = (selectedIndex.value + 1) % props.recommendations.length
}
</script>

<template>
  <section v-if="recommendation" class="music-panel" aria-labelledby="music-title">
    <header>
      <div>
        <small>WEATHER PLAYLIST</small>
        <h3 id="music-title">오늘의 추천 음악 - {{ recommendation.title }}</h3>
        <p>{{ recommendation.description }}</p>
      </div>
      <button type="button" :disabled="recommendations.length < 2" @click="selectNext">
        다른 음악 추천 ↻
      </button>
    </header>

    <div class="genre-list" aria-label="추천 장르">
      <span v-for="genre in recommendation.genres" :key="genre">{{ genre }}</span>
    </div>

    <!-- 브라우저 자동재생 정책을 존중해 사용자가 Spotify 플레이어에서 직접 재생한다. -->
    <iframe
      :key="recommendation.id"
      :src="spotifyEmbedUrl"
      :title="`${recommendation.title} Spotify 플레이어`"
      width="100%"
      height="152"
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
    ></iframe>
    <a :href="spotifyUrl" target="_blank" rel="noopener noreferrer">Spotify에서 전체 듣기 →</a>
  </section>
</template>

<style scoped>
.music-panel {
  margin-bottom: 16px;
  border: 1px solid color-mix(in srgb, #7c5cff 24%, var(--border-soft));
  border-radius: 18px;
  padding: 16px;
  background: linear-gradient(135deg, var(--surface-soft), rgba(124, 92, 255, 0.14));
}

header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 18px;
}

small {
  color: #7563d5;
  font-size: 0.6rem;
  font-weight: 850;
  letter-spacing: 0.13em;
}

h3 {
  margin: 4px 0;
  color: var(--ink-900);
  font-size: 1rem;
}

p {
  margin: 0;
  color: var(--ink-500);
  font-size: 0.72rem;
}

button {
  flex: 0 0 auto;
  border: 1px solid var(--border-soft);
  border-radius: 999px;
  padding: 8px 11px;
  background: var(--surface-card);
  color: var(--primary-700);
  cursor: pointer;
  font: inherit;
  font-size: 0.68rem;
  font-weight: 800;
}

button:disabled {
  cursor: default;
  opacity: 0.45;
}

.genre-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0;
}

.genre-list span {
  border-radius: 999px;
  padding: 5px 8px;
  background: color-mix(in srgb, #7c5cff 12%, var(--surface-card));
  color: var(--ink-600);
  font-size: 0.62rem;
}

iframe {
  display: block;
  border: 0;
  border-radius: 12px;
}

a {
  display: inline-block;
  margin-top: 10px;
  color: var(--primary-700);
  font-size: 0.7rem;
  font-weight: 800;
  text-decoration: none;
}

@media (max-width: 580px) {
  header {
    flex-direction: column;
  }
}
</style>
