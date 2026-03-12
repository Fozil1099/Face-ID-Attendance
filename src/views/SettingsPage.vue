<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Настройки</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="settings-content">
      <!-- Распознавание -->
      <ion-list-header>Распознавание лиц</ion-list-header>
      <ion-list lines="none" class="settings-list">
        <ion-item class="range-item">
          <div class="range-wrap">
            <div class="range-header">
              <span class="range-title">Порог точности</span>
              <span class="range-value"
                >{{ Math.round(settings.recognitionThreshold * 100) }}%</span
              >
            </div>
            <p class="range-hint">Чем ниже — тем строже</p>
            <ion-range
              :min="30"
              :max="80"
              :step="5"
              :value="settings.recognitionThreshold * 100"
              @ion-change="updateThreshold($event)"
            />
          </div>
        </ion-item>

        <ion-item class="range-item">
          <div class="range-wrap">
            <div class="range-header">
              <span class="range-title">Задержка автоотметки</span>
              <span class="range-value">{{ settings.autoMarkDelay }} сек</span>
            </div>
            <p class="range-hint">Задержка перед отметкой присутствия</p>
            <ion-range
              :min="1"
              :max="10"
              :value="settings.autoMarkDelay"
              @ion-change="updateDelay($event)"
            />
          </div>
        </ion-item>
      </ion-list>

      <!-- Данные -->
      <ion-list-header>Данные</ion-list-header>
      <ion-list lines="none" class="settings-list">
        <ion-item>
          <ion-label>
            <h3>Хранить журнал</h3>
            <p>{{ settings.keepDays }} дней</p>
          </ion-label>
          <ion-select
            :value="settings.keepDays"
            @ion-change="updateKeepDays($event)"
            interface="action-sheet"
          >
            <ion-select-option :value="30" class="text-white"
              >30 дней</ion-select-option
            >
            <ion-select-option :value="60">60 дней</ion-select-option>
            <ion-select-option :value="90">90 дней</ion-select-option>
            <ion-select-option :value="180">180 дней</ion-select-option>
            <ion-select-option :value="365">1 год</ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item button @click="exportCSV">
          <ion-icon :icon="downloadOutline" slot="start" color="primary" />
          <ion-label>Экспорт журнала (CSV)</ion-label>
        </ion-item>

        <ion-item button @click="cleanOld">
          <ion-icon :icon="trashBinOutline" slot="start" color="warning" />
          <ion-label>Удалить старые записи</ion-label>
        </ion-item>
      </ion-list>

      <!-- Опасная зона -->
      <ion-list-header>Опасная зона</ion-list-header>
      <ion-list lines="none" class="settings-list">
        <ion-item button @click="confirmClearAll">
          <ion-icon :icon="trashOutline" slot="start" color="danger" />
          <ion-label color="danger">Очистить весь журнал</ion-label>
        </ion-item>
      </ion-list>

      <!-- Версия -->
      <div class="app-version">
        <p>Face ID Attendance v1.0.0</p>
        <p>Vue 3 + Ionic + face-api.js</p>
      </div>
    </ion-content>

    <ion-alert
      :is-open="showClearAlert"
      header="Очистить журнал?"
      message="Все записи посещаемости будут удалены без возможности восстановления."
      :buttons="[
        { text: 'Отмена', role: 'cancel' },
        { text: 'Очистить', role: 'destructive', handler: clearAll },
      ]"
      @did-dismiss="showClearAlert = false"
    />

    <ion-toast
      :is-open="showToast"
      :message="toastMessage"
      :duration="2500"
      color="success"
      position="top"
      @did-dismiss="showToast = false"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonRange,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonAlert,
  IonToast,
} from "@ionic/vue";
import { downloadOutline, trashOutline, trashBinOutline } from "ionicons/icons";

import { databaseService, type AppSettings } from "@/services/DatabaseService";
import { useAttendanceStore } from "@/store/attendance";

const attendanceStore = useAttendanceStore();

const settings = ref<AppSettings>({
  recognitionThreshold: 0.55,
  autoMarkDelay: 2,
  keepDays: 90,
});

const showClearAlert = ref(false);
const showToast = ref(false);
const toastMessage = ref("");

function updateThreshold(event: CustomEvent) {
  settings.value.recognitionThreshold = (event.detail.value as number) / 100;
  databaseService.saveSettings({
    recognitionThreshold: settings.value.recognitionThreshold,
  });
}

function updateDelay(event: CustomEvent) {
  settings.value.autoMarkDelay = event.detail.value as number;
  databaseService.saveSettings({ autoMarkDelay: settings.value.autoMarkDelay });
}

function updateKeepDays(event: CustomEvent) {
  settings.value.keepDays = event.detail.value as number;
  databaseService.saveSettings({ keepDays: settings.value.keepDays });
}

async function exportCSV() {
  await attendanceStore.exportCSV();
  toastMessage.value = "Журнал экспортирован!";
  showToast.value = true;
}

async function cleanOld() {
  await databaseService.cleanupOldRecords();
  await attendanceStore.loadRecords();
  toastMessage.value = "Старые записи удалены";
  showToast.value = true;
}

function confirmClearAll() {
  showClearAlert.value = true;
}

async function clearAll() {
  await attendanceStore.clearAll();
  toastMessage.value = "Журнал очищен";
  showToast.value = true;
}

onMounted(async () => {
  settings.value = await databaseService.getSettings();
});
</script>

<style scoped>
.settings-content {
  --background: #f4f5f8;
}

ion-list-header {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-top: 20px;
}

.settings-list {
  background: #fff;
  border-radius: 16px;
  margin: 4px 16px 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.app-version {
  text-align: center;
  padding: 24px 16px;
  color: var(--ion-color-medium);
  font-size: 12px;
}

.app-version p {
  margin: 2px 0;
}

.range-item {
  --padding-start: 0;
  --inner-padding-end: 0;
  --padding-top: 0;
  --padding-bottom: 0;
}

.range-wrap {
  width: 100%;
  padding: 12px 16px 4px;
}

.range-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.range-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--ion-text-color, #000);
}

.text-white {
  color: #fff !important;
}

.range-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--ion-color-primary, #3880ff);
  background: #e8f0fe;
  padding: 2px 10px;
  border-radius: 10px;
}

.range-hint {
  font-size: 12px;
  color: var(--ion-color-medium);
  margin: 0 0 0;
}
</style>
