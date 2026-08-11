<script setup>
import { ref } from 'vue'
const msg1 = ref('')
const msg2 = ref('')
</script>

<template>
  <div class="practice-section">
    <h2>v-model 양방향 데이터 바인딩</h2>
    <h3>1) v-model 축약 문법 (양방향)</h3>
    <input type="text" v-model="msg1" placeholder="여기에 입력하세요" />
    <p>
      입력한 메세지: <strong>{{ msg1 }}</strong>
    </p>
    <br />
    <h3>2) v-model 내부 작동 원리 (단방향 + 이벤트)</h3>
    <input type="text" @input="(e) => (msg2 = e.target.value)" placeholder="원리 파악용 입력창" />
    <p>
      입력한 메세지: <strong>{{ msg2 }}</strong>
    </p>
  </div>
</template>
