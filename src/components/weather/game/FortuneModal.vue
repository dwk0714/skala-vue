<script setup>
import { computed, ref, watch } from 'vue'
import fortuneMessages from '../../../data/fortuneMock.json'

const props = defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close'])
const birthDate = ref('')
const fortune = ref(null)
const dialogVisible = computed({
  get: () => props.open,
  set: (value) => {
    if (!value) emit('close')
  },
})

const today = (() => {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
})()

const showFortune = () => {
  const seed = `${birthDate.value}${today}`
    .replaceAll('-', '')
    .split('')
    .reduce((sum, digit) => sum + Number(digit), 0)
  fortune.value = fortuneMessages[seed % fortuneMessages.length]
}

const resetFortune = () => {
  birthDate.value = ''
  fortune.value = null
}

const isFutureDate = (date) => date.getTime() > Date.now()

watch(birthDate, () => {
  fortune.value = null
})
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    class="fortune-dialog"
    modal-class="fortune-overlay"
    title="오늘의 레이스 운세"
    width="min(500px, calc(100% - 28px))"
    append-to-body
    destroy-on-close
    align-center
    @closed="resetFortune"
  >
    <template #header>
      <div class="fortune-header">
        <span class="fortune-icon" aria-hidden="true">P1</span>
        <div>
          <p class="eyebrow">WEATHER GP · PIT WALL MESSAGE</p>
          <h2>오늘의 레이스 운세</h2>
        </div>
      </div>
    </template>

    <article>
      <p class="description">오늘의 레이스를 위한 당신만의 피트월 메시지를 확인하세요.</p>

      <label for="fortune-birth-date">DRIVER BIRTH DATE · 생년월일</label>
      <ElDatePicker
        id="fortune-birth-date"
        v-model="birthDate"
        class="birth-date-picker"
        type="date"
        value-format="YYYY-MM-DD"
        format="YYYY년 MM월 DD일"
        placeholder="생년월일을 선택해 주세요"
        popper-class="fortune-date-popper"
        :disabled-date="isFutureDate"
        :clearable="false"
        aria-label="생년월일"
      />

      <ElCollapseTransition>
        <div v-if="fortune" class="fortune-result" aria-live="polite">
          <span>RACE CONTROL · TODAY'S MESSAGE</span>
          <strong>{{ fortune.title }}</strong>
          <p>{{ fortune.summary }}</p>
          <p>{{ fortune.detail }}</p>
          <div class="lucky-items">
            <ElTag>팀 컬러 · {{ fortune.luckyColor }}</ElTag>
            <ElTag>카 넘버 · {{ fortune.luckyNumber }}</ElTag>
          </div>
        </div>
        <div v-else class="ready-state">
          <span>GRID STATUS</span>
          <strong>피트월 메시지를 기다리고 있습니다.</strong>
          <p>생년월일을 선택하면 오늘의 레이스 전략이 도착합니다.</p>
        </div>
      </ElCollapseTransition>

      <ElButton
        class="fortune-button"
        type="primary"
        size="large"
        :disabled="!birthDate"
        @click="showFortune"
      >
        {{ fortune ? '전략 다시 확인하기' : '피트월 메시지 확인하기' }}
      </ElButton>
      <small
        >재미로 보는 Mock 운세이며, 입력한 생년월일은 저장하거나 외부로 전송하지 않습니다.</small
      >
    </article>
  </ElDialog>
</template>

<style scoped>
:global(.fortune-overlay) {
  background: rgba(2, 2, 5, 0.82);
  backdrop-filter: blur(10px) saturate(120%);
}

:global(.fortune-dialog.el-dialog) {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-top: 4px solid #e10600;
  border-radius: 8px;
  padding: 0;
  background:
    radial-gradient(circle at 95% 0, rgba(151, 28, 183, 0.28), transparent 38%),
    linear-gradient(145deg, #1c1d22, #090a0d 68%);
  color: #d8dbe0;
  box-shadow:
    0 34px 90px rgba(0, 0, 0, 0.72),
    0 0 44px rgba(225, 6, 0, 0.13);
}

/* 피트월 모니터처럼 보이는 상단 속도선. */
:global(.fortune-dialog.el-dialog::before) {
  position: absolute;
  top: 12px;
  right: -22px;
  width: 145px;
  height: 2px;
  background: #e10600;
  box-shadow:
    12px 7px 0 #e10600,
    24px 14px 0 #e10600;
  content: '';
  opacity: 0.7;
  transform: skewX(-32deg);
}

:global(.fortune-dialog .el-dialog__header) {
  margin: 0;
  padding: 30px 34px 0;
}

:global(.fortune-dialog .el-dialog__body) {
  padding: 0;
}

:global(.fortune-dialog .el-dialog__headerbtn) {
  top: 14px;
  right: 14px;
}

:global(.fortune-dialog .el-dialog__close) {
  color: #b9bdc5;
  font-size: 1.1rem;
}

:global(.fortune-dialog .el-dialog__headerbtn:hover .el-dialog__close) {
  color: #ff3b35;
}

article {
  padding: 12px 34px 34px;
}

.fortune-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.fortune-icon {
  display: grid;
  width: 58px;
  height: 48px;
  place-items: center;
  background: linear-gradient(120deg, #f01a14, #970300);
  box-shadow: 0 12px 28px rgba(225, 6, 0, 0.3);
  clip-path: polygon(12% 0, 100% 0, 88% 100%, 0 100%);
  color: white;
  font-size: 1rem;
  font-style: italic;
  font-weight: 950;
}

.eyebrow {
  margin: 0;
  color: #ff3b35;
  font-size: 0.58rem;
  font-style: italic;
  font-weight: 900;
  letter-spacing: 0.14em;
}

h2 {
  margin: 2px 0 0;
  color: #fff;
  font-size: 1.7rem;
  font-style: italic;
  font-weight: 900;
  letter-spacing: -0.05em;
}

.description {
  margin-top: 8px;
  color: #9298a2;
  font-size: 0.82rem;
}

label {
  display: block;
  margin-top: 24px;
  color: #c8cbd1;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.07em;
}

.birth-date-picker {
  width: 100%;
  margin-top: 7px;
}

:global(.fortune-dialog .birth-date-picker .el-input__wrapper) {
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  background: #08090c;
  box-shadow: none;
}

:global(.fortune-dialog .birth-date-picker .el-input__inner),
:global(.fortune-dialog .birth-date-picker .el-input__prefix) {
  color: #f3f4f6;
}

:global(.fortune-date-popper) {
  --el-bg-color-overlay: #15161a;
  --el-border-color-light: rgba(255, 255, 255, 0.14);
  --el-color-primary: #e10600;
  --el-text-color-regular: #d9dce1;
  --el-text-color-primary: #fff;
}

.ready-state {
  display: grid;
  gap: 4px;
  margin-top: 14px;
  border: 1px solid rgba(255, 255, 255, 0.11);
  border-left: 3px solid #e10600;
  border-radius: 4px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.045);
}

.ready-state > span {
  color: #ff3b35;
  font-size: 0.56rem;
  font-style: italic;
  font-weight: 900;
  letter-spacing: 0.14em;
}

.ready-state strong {
  color: #e5e7eb;
  font-size: 0.8rem;
}

.ready-state p {
  margin: 0;
  color: #878d97;
  font-size: 0.7rem;
}

.fortune-result {
  display: grid;
  gap: 7px;
  margin-top: 14px;
  border: 1px solid rgba(255, 67, 60, 0.34);
  border-radius: 5px;
  padding: 18px;
  background:
    linear-gradient(120deg, rgba(225, 6, 0, 0.16), rgba(118, 23, 164, 0.12)),
    rgba(255, 255, 255, 0.04);
}

.fortune-result > span {
  color: #ff3b35;
  font-size: 0.65rem;
  font-weight: 850;
}

.fortune-result strong {
  color: #fff;
  font-size: 1rem;
}

.fortune-result p {
  margin: 0;
  color: #adb1ba;
  font-size: 0.72rem;
  line-height: 1.65;
}

.lucky-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 3px;
}

:global(.fortune-dialog .lucky-items .el-tag) {
  border-color: rgba(255, 255, 255, 0.16);
  border-radius: 3px;
  background: rgba(225, 6, 0, 0.16);
  color: #ffd0ce;
  font-size: 0.64rem;
  font-weight: 750;
}

.fortune-button {
  width: 100%;
  margin-top: 14px;
  border: 0;
  border-radius: 4px;
  background: linear-gradient(110deg, #e10600, #8f0502);
  box-shadow: 0 14px 30px rgba(225, 6, 0, 0.22);
  font-style: italic;
  font-weight: 900;
  letter-spacing: 0.04em;
}

:global(.fortune-dialog .fortune-button.is-disabled) {
  background: #34363d;
  color: #747983;
  box-shadow: none;
}

article > small {
  display: block;
  margin-top: 12px;
  color: #737984;
  font-size: 0.65rem;
  line-height: 1.6;
}

@media (max-width: 480px) {
  :global(.fortune-dialog .el-dialog__header) {
    padding: 24px 22px 0;
  }

  article {
    padding: 12px 22px 26px;
  }
}
</style>
