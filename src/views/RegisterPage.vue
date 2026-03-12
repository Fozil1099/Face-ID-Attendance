<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/people" text="Назад" />
        </ion-buttons>
        <ion-title>Регистрация</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="register-content">
      <div class="form-container">

        <!-- Превью фото -->
        <div class="photo-preview-wrap">
          <div class="photo-preview" @click="choosePhotoSource">
            <img v-if="photoBase64" :src="photoBase64" class="preview-img" />
            <div v-else class="preview-placeholder">
              <ion-icon :icon="personCircleOutline" class="placeholder-icon" />
              <span>Добавить фото</span>
            </div>
            <div class="photo-edit-badge">
              <ion-icon :icon="cameraOutline" />
            </div>
          </div>

          <!-- Статус лица -->
          <div v-if="faceStatus" class="face-status" :class="faceStatusClass">
            <ion-icon :icon="faceStatus === 'ok' ? checkmarkCircleOutline : alertCircleOutline" />
            {{ faceStatus === 'ok' ? 'Лицо обнаружено' : 'Лицо не найдено' }}
          </div>
        </div>

        <!-- Поле имени -->
        <ion-item class="name-item" lines="none">
          <ion-label position="stacked">Имя и Фамилия *</ion-label>
          <ion-input
            v-model="name"
            placeholder="Введите имя"
            type="text"
            autocapitalize="words"
            :maxlength="60"
          />
        </ion-item>

        <!-- Кнопки выбора фото -->
        <div class="photo-buttons">
          <ion-button expand="block" fill="outline" @click="takePhoto">
            <ion-icon :icon="cameraOutline" slot="start" />
            Камера
          </ion-button>
          <ion-button expand="block" fill="outline" @click="pickGallery">
            <ion-icon :icon="imagesOutline" slot="start" />
            Галерея
          </ion-button>
        </div>

        <!-- Ошибка -->
        <div v-if="errorMsg" class="error-msg">
          <ion-icon :icon="alertCircleOutline" />
          {{ errorMsg }}
        </div>

        <!-- Кнопка сохранить -->
        <ion-button
          expand="block"
          size="large"
          class="save-button"
          :disabled="!canSave || isSaving"
          @click="savePerson"
        >
          <ion-icon :icon="saveOutline" slot="start" />
          {{ isSaving ? 'Сохраняем...' : 'Зарегистрировать' }}
        </ion-button>

        <p class="hint">
          * Загрузите чёткое фото лица анфас для точного распознавания
        </p>
      </div>
    </ion-content>

    <!-- Action sheet выбора источника фото -->
    <ion-action-sheet
      :is-open="showPhotoSheet"
      header="Выбрать фото"
      :buttons="photoSheetButtons"
      @did-dismiss="showPhotoSheet = false"
    />

    <!-- Loading -->
    <ion-loading :is-open="isSaving" message="Обработка лица..." />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton, IonIcon, IonItem,
  IonLabel, IonInput, IonActionSheet, IonLoading,
} from '@ionic/vue'
import {
  personCircleOutline, cameraOutline, imagesOutline,
  saveOutline, checkmarkCircleOutline, alertCircleOutline,
} from 'ionicons/icons'

import { cameraService } from '@/services/CameraService'
import { faceRecognitionService } from '@/services/FaceRecognitionService'
import { usePeopleStore } from '@/store/people'

const router = useRouter()
const peopleStore = usePeopleStore()

const name = ref('')
const photoBase64 = ref('')
const faceStatus = ref<'ok' | 'fail' | null>(null)
const errorMsg = ref('')
const isSaving = ref(false)
const showPhotoSheet = ref(false)

const canSave = computed(() => name.value.trim().length >= 2 && photoBase64.value && faceStatus.value === 'ok')

const faceStatusClass = computed(() => ({
  'status-ok': faceStatus.value === 'ok',
  'status-fail': faceStatus.value === 'fail',
}))

const photoSheetButtons = [
  {
    text: 'Снять на камеру',
    icon: cameraOutline,
    handler: takePhoto,
  },
  {
    text: 'Выбрать из галереи',
    icon: imagesOutline,
    handler: pickGallery,
  },
  { text: 'Отмена', role: 'cancel' },
]

function choosePhotoSource() {
  showPhotoSheet.value = true
}

async function takePhoto() {
  errorMsg.value = ''
  const photo = await cameraService.takePhoto()
  if (photo) {
    await setPhoto(photo.base64)
  }
}

async function pickGallery() {
  errorMsg.value = ''
  const photo = await cameraService.pickFromGallery()
  if (photo) {
    await setPhoto(photo.base64)
  }
}

async function setPhoto(base64: string) {
  photoBase64.value = base64
  faceStatus.value = null

  // Проверяем, обнаружено ли лицо
  try {
    const descriptor = await faceRecognitionService.extractDescriptor(base64)
    faceStatus.value = descriptor ? 'ok' : 'fail'
    if (!descriptor) {
      errorMsg.value = 'На фото не обнаружено лицо. Попробуйте другое фото с чётким видом лица.'
    }
  } catch {
    faceStatus.value = 'fail'
    errorMsg.value = 'Ошибка анализа фото'
  }
}

async function savePerson() {
  if (!canSave.value) return
  isSaving.value = true
  errorMsg.value = ''

  const person = await peopleStore.registerPerson(name.value, photoBase64.value)

  isSaving.value = false

  if (person) {
    router.replace('/tabs/people')
  } else {
    errorMsg.value = peopleStore.error ?? 'Ошибка регистрации'
  }
}
</script>

<style scoped>
.register-content {
  --background: #f4f5f8;
}

.form-container {
  padding: 24px 16px;
  max-width: 480px;
  margin: 0 auto;
}

.photo-preview-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
}

.photo-preview {
  position: relative;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px dashed var(--ion-color-primary);
  overflow: visible;
}

.preview-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.preview-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #e8eaf6;
  color: var(--ion-color-primary);
  gap: 4px;
  font-size: 12px;
}

.placeholder-icon {
  font-size: 48px;
}

.photo-edit-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--ion-color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.face-status {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
}

.status-ok   { color: #2dd36f; background: #d4f8e8; }
.status-fail { color: #eb445a; background: #ffe5e8; }

.name-item {
  --background: #fff;
  --color: #000000;
  --placeholder-color: #888888;
  --placeholder-opacity: 1;
  --border-radius: 12px;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.photo-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.error-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #eb445a;
  font-size: 13px;
  background: #ffe5e8;
  padding: 10px 14px;
  border-radius: 10px;
  margin-bottom: 12px;
}

.save-button {
  --border-radius: 14px;
  font-weight: 700;
  margin-top: 8px;
}

.hint {
  text-align: center;
  font-size: 12px;
  color: var(--ion-color-medium);
  margin-top: 12px;
}
</style>
