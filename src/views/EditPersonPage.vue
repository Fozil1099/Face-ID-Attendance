<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/people" text="Назад" />
        </ion-buttons>
        <ion-title>Редактировать</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="edit-content">
      <div v-if="person" class="form-container">

        <!-- Фото -->
        <div class="photo-wrap">
          <div class="photo-circle" @click="choosePhoto">
            <img v-if="photoBase64" :src="photoBase64" class="photo-img" />
            <div v-else class="photo-placeholder">
              {{ initials }}
            </div>
            <div class="photo-badge">
              <ion-icon :icon="cameraOutline" />
            </div>
          </div>

          <div v-if="faceStatus" class="face-status" :class="faceStatus === 'ok' ? 'ok' : 'fail'">
            {{ faceStatus === 'ok' ? '✓ Лицо обнаружено' : '✗ Лицо не найдено' }}
          </div>
        </div>

        <!-- Имя -->
        <ion-item lines="none" class="name-item">
          <ion-label position="stacked">Имя и Фамилия</ion-label>
          <ion-input v-model="name" type="text" autocapitalize="words" />
        </ion-item>

        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

        <ion-button
          expand="block"
          size="large"
          class="save-btn"
          :disabled="!canSave || isSaving"
          @click="save"
        >
          {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
        </ion-button>

      </div>

      <div v-else class="not-found">
        <p>Сотрудник не найден</p>
        <ion-button @click="router.back()">Назад</ion-button>
      </div>
    </ion-content>

    <ion-loading :is-open="isSaving" message="Обновление данных..." />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton, IonIcon, IonItem,
  IonLabel, IonInput, IonLoading,
} from '@ionic/vue'
import { cameraOutline } from 'ionicons/icons'
import { cameraService } from '@/services/CameraService'
import { faceRecognitionService } from '@/services/FaceRecognitionService'
import { usePeopleStore } from '@/store/people'
import type { Person } from '@/models/Person'

const route = useRoute()
const router = useRouter()
const peopleStore = usePeopleStore()

const person = ref<Person | null>(null)
const name = ref('')
const photoBase64 = ref('')
const faceStatus = ref<'ok' | 'fail' | null>(null)
const errorMsg = ref('')
const isSaving = ref(false)

const initials = computed(() =>
  (person.value?.name ?? '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
)

const canSave = computed(() => name.value.trim().length >= 2)

async function choosePhoto() {
  const photo = await cameraService.takePhoto()
  if (photo) {
    photoBase64.value = photo.base64
    faceStatus.value = null
    const descriptor = await faceRecognitionService.extractDescriptor(photo.base64)
    faceStatus.value = descriptor ? 'ok' : 'fail'
  }
}

async function save() {
  if (!person.value || !canSave.value) return
  if (photoBase64.value && faceStatus.value !== 'ok') {
    errorMsg.value = 'Лицо не обнаружено на новом фото'
    return
  }
  isSaving.value = true

  const ok = await peopleStore.updatePerson(
    person.value.id,
    name.value,
    photoBase64.value || undefined
  )

  isSaving.value = false
  if (ok) router.replace('/tabs/people')
  else errorMsg.value = peopleStore.error ?? 'Ошибка'
}

onMounted(async () => {
  await peopleStore.loadPeople()
  const id = route.params.id as string
  const found = peopleStore.people.find(p => p.id === id) ?? null
  person.value = found
  if (found) {
    name.value = found.name
    photoBase64.value = found.photoPath
  }
})
</script>

<style scoped>
.edit-content { --background: #f4f5f8; }
.form-container { padding: 24px 16px; max-width: 480px; margin: 0 auto; }
.photo-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 24px; }
.photo-circle { position: relative; width: 120px; height: 120px; border-radius: 50%; cursor: pointer; border: 3px solid var(--ion-color-primary); overflow: visible; }
.photo-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
.photo-placeholder { width: 100%; height: 100%; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 800; }
.photo-badge { position: absolute; bottom: 4px; right: 4px; width: 28px; height: 28px; border-radius: 50%; background: var(--ion-color-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; }
.face-status { margin-top: 8px; font-size: 13px; font-weight: 600; padding: 4px 12px; border-radius: 12px; }
.face-status.ok   { color: #2dd36f; background: #d4f8e8; }
.face-status.fail { color: #eb445a; background: #ffe5e8; }
.name-item { --background: #fff; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
.error-msg { color: #eb445a; font-size: 13px; margin-bottom: 12px; }
.save-btn { --border-radius: 14px; font-weight: 700; }
.not-found { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 16px; color: var(--ion-color-medium); }
</style>
