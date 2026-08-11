<script setup>
import { ref } from 'vue'
const comment = ref('')
const isAgreed = ref(false)
const favoriteFruits = ref([])
const gender = ref('')
const selectedCar = ref('')
</script>

<template>
  <div class="practice-section">
    <h2>모든 HTML Form 요소와 v-model 매핑</h2>
    <div>
      <h3>1) textarea (장문 텍스트)</h3>
      <textarea v-model="comment" placeholder="의견을 남겨주세요"></textarea>
      <p>
        데이터 상태: <span>{{ comment }}</span>
      </p>
    </div>
    <br />
    <div>
      <h3>2) checkbox (동의 여부)</h3>
      <label> <input type="checkbox" v-model="isAgreed" /> 약관에 동의합니다.</label>
      <br />
      <p>
        데이터 상태: <span>{{ isAgreed }}</span>
      </p>
    </div>
    <br />
    <div>
      <h3>3) 다중 checkbox (복수 선택 -> 배열에 저장)</h3>
      <label> <input type="checkbox" v-model="favoriteFruits" value="사과" /> 사과</label>
      &nbsp;
      <label> <input type="checkbox" v-model="favoriteFruits" value="바나나" /> 바나나</label>
      &nbsp;
      <label> <input type="checkbox" v-model="favoriteFruits" value="딸기" /> 딸기</label>
      <p>
        데이터 상태(배열): <span>{{ favoriteFruits }}</span>
      </p>
    </div>
    <br />
    <div>
      <h3>4) radio button (단일 선택)</h3>
      <label> <input type="radio" v-model="gender" value="male" /> 남성</label>
      &nbsp;
      <label> <input type="radio" v-model="gender" value="female" /> 여성</label>
      <p>
        데이터 상태: &nbsp; <span>{{ gender }}</span>
      </p>
    </div>
    <br />
    <div>
      <h3>5) select (드롭다운 선택)</h3>
      <select v-model="selectedCar">
        <option value="">-- 선택하세요 --</option>
        <option value="tesla">테슬라</option>
        <option value="bmw">bmw</option>
        <option value="benz">benz</option>
      </select>
      <p>
        데이터 상태: <span>{{ selectedCar }}</span>
      </p>
    </div>
    <br />
  </div>
</template>
