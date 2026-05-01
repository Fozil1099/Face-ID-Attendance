<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>
          <ion-icon :icon="scanOutline" style="margin-right:6px;" />
          Face ID
        </ion-title>
        <ion-buttons slot="end">
          <ion-button @click="router.push('/tabs/people')">
            <ion-icon :icon="peopleOutline" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="home-content">

      <!-- Карточка камеры -->
      <div class="camera-container">
        <CameraView
          ref="cameraRef"
          :active="cameraActive"
          :status-text="cameraStatus"
          :status-class="statusClass"
          :is-loading="isScanning"
          :is-ready="modelsReady && !isScanning"
          @stream-started="onStreamStarted"
          @stream-error="onStreamError"
        />

        <!-- Рамка распознавания лица -->
        <FaceOverlay
          :state="overlayState"
          :label="overlayLabel"
          :confidence="overlayConfidence"
        />
      </div>

      <!-- Кнопка сканирования -->
      <div class="scan-section">
        <ion-button
          expand="block"
          size="large"
          class="scan-button"
          :disabled="!modelsReady || isScanning || !streamReady"
          @click="scanFace"
        >
          <ion-icon :icon="scanOutline" slot="start" />
          {{ isScanning ? 'Сканирование...' : 'Сканировать лицо' }}
        </ion-button>

        <!-- Прогресс загрузки моделей -->
        <div v-if="!modelsReady && !modelsError" class="models-loading">
          <ion-spinner name="crescent" color="primary" />
          <span>Загрузка модели распознавания...</span>
        </div>
        <!-- Ошибка загрузки моделей -->
        <div v-if="modelsError" class="models-error">
          <ion-icon :icon="helpCircleOutline" color="danger" />
          <span>Ошибка: {{ modelsError }}</span>
          <ion-button size="small" color="warning" @click="loadModels">Повторить</ion-button>
        </div>
      </div>

      <!-- Результат распознавания -->
      <ion-card v-if="recognitionResult" class="result-card" :class="resultCardClass">
        <ion-card-content>
          <div class="result-content">
            <div class="result-avatar">
              <img
                v-if="recognitionResult.person?.photoPath"
                :src="recognitionResult.person.photoPath"
                class="result-photo"
              />
              <div v-else class="result-unknown-icon">
                <ion-icon :icon="helpCircleOutline" />
              </div>
            </div>

            <div class="result-info">
              <div class="result-title">
                {{ recognitionResult.person ? recognitionResult.person.name : 'Неизвестный' }}
              </div>
              <div class="result-subtitle">
                Точность: {{ Math.round(recognitionResult.confidence * 100) }}%
              </div>
              <div v-if="alreadyMarked" class="already-marked">
                <ion-icon :icon="checkmarkCircleOutline" />
                Уже отмечен сегодня
              </div>
            </div>
          </div>

          <!-- Кнопка отметить приход -->
          <ion-button
            v-if="recognitionResult.person && !alreadyMarked"
            expand="block"
            color="success"
            class="mark-button"
            :disabled="isMarking"
            @click="markArrival"
          >
            <ion-icon :icon="checkmarkCircleOutline" slot="start" />
            {{ isMarking ? 'Отмечаем...' : 'Отметить приход' }}
          </ion-button>

          <ion-button
            v-if="recognitionResult.person"
            expand="block"
            fill="outline"
            color="medium"
            @click="resetResult"
          >
            Сканировать снова
          </ion-button>

          <ion-button
            v-if="!recognitionResult.person && recognitionResult.faceDetected"
            expand="block"
            fill="outline"
            color="warning"
            @click="router.push('/register')"
          >
            <ion-icon :icon="personAddOutline" slot="start" />
            Зарегистрировать
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Toast успеха -->
      <ion-toast
        :is-open="showSuccessToast"
        :message="`✅ ${markedPersonName} отмечен(а) — ${markedTime}`"
        :duration="3000"
        color="success"
        position="top"
        @did-dismiss="showSuccessToast = false"
      />

    </ion-content>

  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonIcon, IonCard, IonCardContent,
  IonSpinner, IonLabel, IonBadge, IonToast,
} from '@ionic/vue'
import {
  scanOutline, peopleOutline,
  checkmarkCircleOutline, personAddOutline, helpCircleOutline,
} from 'ionicons/icons'

import CameraView from '@/components/CameraView.vue'
import FaceOverlay from '@/components/FaceOverlay.vue'
import { faceRecognitionService, type RecognitionResult } from '@/services/FaceRecognitionService'
import { usePeopleStore } from '@/store/people'
import { useAttendanceStore } from '@/store/attendance'
import { attendanceService } from '@/services/AttendanceService'

const router = useRouter()
const peopleStore = usePeopleStore()
const attendanceStore = useAttendanceStore()

const cameraRef = ref<InstanceType<typeof CameraView> | null>(null)
const cameraActive = ref(true)
const streamReady = ref(false)
const modelsReady = ref(false)
const modelsError = ref('')
const isScanning = ref(false)
const isMarking = ref(false)

const recognitionResult = ref<RecognitionResult | null>(null)
const alreadyMarked = ref(false)
const showSuccessToast = ref(false)
const markedPersonName = ref('')
const markedTime = ref('')

const cameraStatus = computed(() => {
  if (!streamReady.value) return 'Подключение камеры...'
  if (!modelsReady.value) return 'Загрузка моделей...'
  if (isScanning.value) return 'Сканирование...'
  return ''
})

const statusClass = computed(() => {
  if (!streamReady.value || !modelsReady.value) return 'warning' as const
  return '' as const
})

const overlayState = computed(() => {
  if (isScanning.value) return 'scanning' as const
  if (!recognitionResult.value) return 'idle' as const
  if (recognitionResult.value.person) return 'found' as const
  if (recognitionResult.value.faceDetected) return 'unknown' as const
  return 'error' as const
})

const overlayLabel = computed(() => {
  if (!recognitionResult.value) return ''
  if (recognitionResult.value.person) return recognitionResult.value.person.name
  if (recognitionResult.value.faceDetected) return 'Неизвестный'
  return 'Лицо не найдено'
})

const overlayConfidence = computed(() => recognitionResult.value?.confidence ?? null)

const resultCardClass = computed(() => {
  if (!recognitionResult.value) return ''
  if (recognitionResult.value.person) return 'result-success'
  if (recognitionResult.value.faceDetected) return 'result-warning'
  return 'result-danger'
})

function onStreamStarted() {
  streamReady.value = true
}

function onStreamError(err: string) {
  streamReady.value = false
}

async function scanFace() {
  if (!cameraRef.value || isScanning.value) return
  const video = cameraRef.value.getVideoElement()
  if (!video) return

  isScanning.value = true
  recognitionResult.value = null

  try {
    const { cameraService } = await import('@/services/CameraService')
    const frameBase64 = cameraService.captureFrame(video)

    const result = await faceRecognitionService.recognize(
      frameBase64,
      peopleStore.people,
      0.55
    )

    recognitionResult.value = result

    if (result.person) {
      alreadyMarked.value = await attendanceStore.hasArrivedToday(result.person.id)
    }
  } catch (e) {
  } finally {
    isScanning.value = false
  }
}

async function markArrival() {
  if (!recognitionResult.value?.person || isMarking.value) return
  isMarking.value = true

  try {
    const video = cameraRef.value?.getVideoElement()
    const snapshot = video
      ? (await import('@/services/CameraService')).cameraService.captureFrame(video)
      : ''

    const record = await attendanceStore.markArrival(
      recognitionResult.value.person,
      snapshot,
      recognitionResult.value.confidence
    )

    markedPersonName.value = recognitionResult.value.person.name
    markedTime.value = attendanceService.formatTime(record.timestamp)
    alreadyMarked.value = true
    showSuccessToast.value = true
  } finally {
    isMarking.value = false
  }
}

function resetResult() {
  recognitionResult.value = null
  alreadyMarked.value = false
}

onMounted(async () => {
  await Promise.all([
    peopleStore.loadPeople(),
    attendanceStore.loadRecords(),
  ])

  // Загружаем модели в фоне
  loadModels()
})

async function loadModels() {
  modelsError.value = ''
  try {
    await faceRecognitionService.loadModels()
    modelsReady.value = true
  } catch (e: unknown) {
    const error = e as Error
    modelsError.value = error.message ?? 'Неизвестная ошибка'
  }
}

onUnmounted(() => {
  cameraActive.value = false
})
</script>

<style scoped>
.home-content {
  --background: #f4f5f8;
}

.camera-container {
  position: relative;
  width: 100%;
  height: 320px;
  margin-bottom: 0;
}

.scan-section {
  padding: 16px;
}

.scan-button {
  --border-radius: 14px;
  font-weight: 700;
  font-size: 16px;
}

.models-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
  color: var(--ion-color-medium);
  font-size: 13px;
}

.models-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 10px;
  background: #fff3cd;
  border-radius: 10px;
  font-size: 12px;
  color: var(--ion-color-danger);
  text-align: center;
}

.result-card {
  margin: 0 16px 16px;
  border-radius: 18px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.result-card.result-success { border-left: 5px solid #2dd36f; }
.result-card.result-warning { border-left: 5px solid #ffc409; }
.result-card.result-danger  { border-left: 5px solid #eb445a; }

.result-content {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.result-photo {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
}

.result-unknown-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #aaa;
}

.result-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--ion-text-color);
}

.result-subtitle {
  font-size: 13px;
  color: var(--ion-color-medium);
  margin-top: 2px;
}

.already-marked {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #2dd36f;
  font-weight: 600;
  margin-top: 6px;
}

.mark-button {
  margin-bottom: 8px;
  --border-radius: 12px;
  font-weight: 700;
}

ion-tab-bar {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.tab-active ion-icon,
.tab-active ion-label {
  color: var(--ion-color-primary);
}
</style>
