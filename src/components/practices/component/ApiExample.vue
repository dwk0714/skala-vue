<script setup>
import { ref } from 'vue'
import axios from 'axios'

const weatherData = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

const handleFetchWeather = async () => {
  const apiKey = import.meta.env.VITE_OPENWEATHER_KEY
  if (!apiKey) {
    errorMessage.value = '.env.local에 VITE_OPENWEATHER_KEY를 설정해 주세요.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  try {
    // 비동기 통신: 서버에서 데이터를 다 가져올 때까지 await로 기다린다.
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat: 35.158582,
        lon: 126.804975,
        appid: apiKey,
        units: 'metric',
        lang: 'kr',
      },
    })
    // Axios는 JSON 응답을 response.data에 자동으로 파싱한다.
    console.log('Axios 응답 상태:', response.status)
    console.log('백엔드가 준 핵심 날씨 데이터(JSON):', response.data)
    weatherData.value = response.data
  } catch (error) {
    const status = error.response?.status
    const message = error.response?.data?.message ?? error.message
    console.error('Axios 통신 실패:', { status, message })
    errorMessage.value = `데이터를 가져오지 못했습니다${status ? ` (${status})` : ''}.`
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="practice-section">
    <h2>⚡ Axios 통신 검증</h2>
    <button @click="handleFetchWeather" :disabled="isLoading">
      {{ isLoading ? '데이터 로딩 중...' : '실시간 날씨 데이터 당겨오기' }}
    </button>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    <div v-if="weatherData" class="result-card">
      <p>
        📍 위치: <strong>{{ weatherData.name }}</strong>
      </p>
      <p></p>
      <p></p>
      <p>
        🌡️ 현재 기온: <strong>{{ weatherData.main.temp }}°C</strong> (정상 섭씨 변환 완료) ☁️ 날씨
        상태: <strong>{{ weatherData.weather[0].description }}</strong> 💧 습도:
        <strong>{{ weatherData.main.humidity }}%</strong>
      </p>
    </div>
    <div v-else>
      <p>아직 가져온 데이터가 없습니다. 버튼을 눌러 통신을 가동하세요.</p>
    </div>
  </div>
</template>

<style scoped>
.error-message {
  color: #c04f45;
}
</style>
