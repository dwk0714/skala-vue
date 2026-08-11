<script setup>
import { ref } from 'vue'

const isLogged = ref(false)

const score = ref(85)
</script>

<template>
  <div class="practice-section">
    <h2>v-if, v-else-if, v-else 디렉티브 학습</h2>
    <h3>1) 기본 로그인 상태 스위치</h3>
    <p v-if="isLogged">환영합니다! 회원 전용 화면입니다.</p>
    <p v-else>로그인이 필요합니다. 먼저 로그인해 주세요.</p>
    <button @click="isLogged = !isLogged">{{ isLogged ? '로그아웃하기' : '로그인하기' }}</button>
    <br />
    <h3>2) 성적별 학점 등급 측정 (다중 조건문)</h3>
    <label>현재 점수 입력: </label>
    <input type="number" v-model="score" min="0" max="100" step="5" />
    <br />
    <div v-if="score >= 90" style="color: green; font-weight: bold">A 학점</div>
    <div v-else-if="score >= 80" style="color: blue">B 학점</div>
    <div v-else-if="score >= 70" style="color: orange">C 학점</div>
    <div v-else style="color: red; font-weight: bold">F 학점(재시험 대상)</div>
  </div>
</template>
