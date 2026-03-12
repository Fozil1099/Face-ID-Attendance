<template>
  <!-- Анимированная рамка поиска лица -->
  <div class="face-overlay" :class="overlayClass">
    <div class="corner top-left" />
    <div class="corner top-right" />
    <div class="corner bottom-left" />
    <div class="corner bottom-right" />

    <!-- Сканирующая линия (активна при scanning) -->
    <div v-if="state === 'scanning'" class="scan-line" />

    <!-- Метка результата -->
    <div v-if="label" class="overlay-label" :class="labelClass">
      {{ label }}
    </div>

    <!-- Процент уверенности -->
    <div v-if="confidence !== null" class="confidence-badge">
      {{ Math.round(confidence * 100) }}%
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type OverlayState = 'idle' | 'scanning' | 'found' | 'unknown' | 'error'

interface Props {
  state?: OverlayState
  label?: string
  confidence?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  state: 'idle',
  label: '',
  confidence: null,
})

const overlayClass = computed(() => ({
  scanning: props.state === 'scanning',
  found: props.state === 'found',
  unknown: props.state === 'unknown',
  error: props.state === 'error',
}))

const labelClass = computed(() => ({
  'label-found': props.state === 'found',
  'label-unknown': props.state === 'unknown',
  'label-error': props.state === 'error',
}))
</script>

<style scoped>
.face-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -55%);
  width: 220px;
  height: 260px;
  pointer-events: none;
  z-index: 5;
  transition: border-color 0.3s;
}

/* Угловые рамки */
.corner {
  position: absolute;
  width: 28px;
  height: 28px;
  border-color: rgba(255, 255, 255, 0.85);
  border-style: solid;
  transition: border-color 0.3s;
}

.top-left    { top: 0; left: 0;     border-width: 3px 0 0 3px; border-radius: 4px 0 0 0; }
.top-right   { top: 0; right: 0;    border-width: 3px 3px 0 0; border-radius: 0 4px 0 0; }
.bottom-left { bottom: 0; left: 0;  border-width: 0 0 3px 3px; border-radius: 0 0 0 4px; }
.bottom-right{ bottom: 0; right: 0; border-width: 0 3px 3px 0; border-radius: 0 0 4px 0; }

/* Состояние: сканирование */
.face-overlay.scanning .corner {
  border-color: #5ac8fa;
  animation: pulse-border 1.2s ease-in-out infinite;
}

/* Состояние: найден */
.face-overlay.found .corner {
  border-color: #2dd36f;
}

/* Состояние: неизвестный */
.face-overlay.unknown .corner {
  border-color: #ffc409;
}

/* Состояние: ошибка */
.face-overlay.error .corner {
  border-color: #eb445a;
}

/* Сканирующая линия */
.scan-line {
  position: absolute;
  left: 8px;
  right: 8px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #5ac8fa, transparent);
  animation: scan 1.8s ease-in-out infinite;
  border-radius: 2px;
}

/* Метка имени */
.overlay-label {
  position: absolute;
  bottom: -38px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  backdrop-filter: blur(6px);
}

.label-found   { background: rgba(45, 211, 111, 0.85); }
.label-unknown { background: rgba(255, 196, 9, 0.85); color: #222; }
.label-error   { background: rgba(235, 68, 90, 0.85); }

/* Бейдж уверенности */
.confidence-badge {
  position: absolute;
  top: -30px;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
}

/* Анимации */
@keyframes scan {
  0%   { top: 10px; opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { top: calc(100% - 12px); opacity: 0; }
}

@keyframes pulse-border {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.45; }
}
</style>
