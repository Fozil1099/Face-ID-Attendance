<template>
  <div class="camera-wrapper">
    <!-- Видео поток -->
    <video
      ref="videoRef"
      class="camera-video"
      autoplay
      playsinline
      muted
      :style="facingMode === 'user' ? 'transform: scaleX(-1)' : ''"
    />

    <!-- Canvas для отрисовки рамок лиц (face-api) -->
    <canvas ref="canvasRef" class="face-canvas"
      :style="facingMode === 'user' ? 'transform: scaleX(-1)' : ''"
    />

    <!-- Оверлей состояния -->
    <div class="camera-status">
      <div v-if="isLoading" class="status-badge loading">
        <ion-spinner name="dots" color="light" />
        <span>{{ statusText }}</span>
      </div>
      <div v-else-if="statusText" class="status-badge" :class="statusClass">
        {{ statusText }}
      </div>
    </div>

    <!-- Кнопка захвата (показывается только в режиме capture) -->
    <div v-if="showCaptureButton" class="capture-controls">
      <button class="capture-btn" @click="capture" :disabled="!isReady">
        <ion-icon :icon="cameraOutline" />
      </button>
    </div>

    <!-- Кнопка переключения камеры -->
    <button class="flip-btn" @click="switchCamera" title="Переключить камеру">
      <ion-icon :icon="cameraReverseOutline" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { IonSpinner, IonIcon } from '@ionic/vue'
import { cameraOutline, cameraReverseOutline } from 'ionicons/icons'
import { cameraService } from '@/services/CameraService'

interface Props {
  active?: boolean
  showCaptureButton?: boolean
  statusText?: string
  statusClass?: 'success' | 'warning' | 'danger' | ''
  isLoading?: boolean
  isReady?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  active: true,
  showCaptureButton: false,
  statusText: '',
  statusClass: '',
  isLoading: false,
  isReady: true,
})

const emit = defineEmits<{
  frameReady: [videoEl: HTMLVideoElement]
  capture: [base64: string]
  streamStarted: []
  streamError: [error: string]
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const facingMode = ref<'user' | 'environment'>('user')
let stream: MediaStream | null = null

async function startStream() {
  if (!videoRef.value) return
  stream = await cameraService.startVideoStream(videoRef.value, facingMode.value)
  if (stream) {
    emit('streamStarted')
    videoRef.value.addEventListener('loadeddata', () => {
      syncCanvasSize()
    })
  } else {
    emit('streamError', 'Не удалось получить доступ к камере')
  }
}

async function switchCamera() {
  facingMode.value = facingMode.value === 'user' ? 'environment' : 'user'
  cameraService.stopVideoStream(stream)
  stream = null
  await startStream()
}

function stopStream() {
  cameraService.stopVideoStream(stream)
  stream = null
}

function syncCanvasSize() {
  if (!videoRef.value || !canvasRef.value) return
  canvasRef.value.width = videoRef.value.videoWidth
  canvasRef.value.height = videoRef.value.videoHeight
}

function capture() {
  if (!videoRef.value) return
  const base64 = cameraService.captureFrame(videoRef.value)
  emit('capture', base64)
}

/** Получить текущий videoElement (для внешнего использования face-api) */
function getVideoElement(): HTMLVideoElement | null {
  return videoRef.value
}

/** Получить canvas для отрисовки рамок */
function getCanvasElement(): HTMLCanvasElement | null {
  return canvasRef.value
}

defineExpose({ getVideoElement, getCanvasElement, capture })

watch(
  () => props.active,
  (val) => {
    if (val) startStream()
    else stopStream()
  }
)

onMounted(() => {
  if (props.active) startStream()
})

onUnmounted(() => {
  stopStream()
})
</script>

<style scoped>
.camera-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 16px;
  overflow: hidden;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* зеркало управляется динамически через v-bind */
}

.face-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  transform: scaleX(-1);
}

.camera-status {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  backdrop-filter: blur(8px);
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  white-space: nowrap;
}

.status-badge.loading {
  background: rgba(0, 0, 0, 0.65);
}

.status-badge.success {
  background: rgba(45, 211, 111, 0.85);
  color: #fff;
}

.status-badge.warning {
  background: rgba(255, 196, 9, 0.85);
  color: #000;
}

.status-badge.danger {
  background: rgba(235, 68, 90, 0.85);
  color: #fff;
}

.capture-controls {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.capture-btn {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 28px;
  color: #333;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  transition: transform 0.15s;
}

.capture-btn:active {
  transform: scale(0.93);
}

.capture-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.flip-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  font-size: 20px;
  transition: background 0.15s, transform 0.15s;
}

.flip-btn:active {
  background: rgba(0, 0, 0, 0.7);
  transform: rotate(180deg);
}
</style>
