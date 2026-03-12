<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">

        <ion-tab-button tab="home" href="/tabs/home" :style="tabStyle('home')">
          <ion-icon :icon="scanOutline" />
          <ion-label>Камера</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="people" href="/tabs/people" :style="tabStyle('people')">
          <ion-icon :icon="peopleOutline" />
          <ion-label>Люди</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="attendance" href="/tabs/attendance" :style="tabStyle('attendance')">
          <ion-icon :icon="listOutline" />
          <ion-label>Журнал</ion-label>
          <ion-badge v-if="todayCount > 0" color="success">
            {{ todayCount }}
          </ion-badge>
        </ion-tab-button>

        <ion-tab-button tab="settings" href="/tabs/settings" :style="tabStyle('settings')">
          <ion-icon :icon="settingsOutline" />
          <ion-label>Настройки</ion-label>
        </ion-tab-button>

      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage, IonTabs, IonRouterOutlet,
  IonTabBar, IonTabButton, IonLabel, IonIcon, IonBadge,
} from '@ionic/vue'
import {
  scanOutline, peopleOutline, listOutline, settingsOutline,
} from 'ionicons/icons'
import { useAttendanceStore } from '@/store/attendance'

const route = useRoute()
const attendanceStore = useAttendanceStore()
const todayCount = computed(() => attendanceStore.todayCount)

const selectedTab = computed(() => {
  const p = route.path
  if (p.includes('/people')) return 'people'
  if (p.includes('/attendance')) return 'attendance'
  if (p.includes('/settings')) return 'settings'
  return 'home'
})

function tabStyle(tabName: string) {
  const isActive = selectedTab.value === tabName
  const color = isActive ? '#3880ff' : '#92949c'
  return { '--color': color, '--color-selected': color }
}

onMounted(() => {
  attendanceStore.loadRecords()
})
</script>

<style>
/* CSS-переменные проникают в Shadow DOM — единственный реактивный способ */
ion-tab-bar {
  --background: #ffffff;
  --border: 0.5px solid #d7d8da;
  height: 56px;
}

ion-tab-button {
  /* Ionic автоматически переключается между --color и --color-selected */
  --color: #92949c;
  --color-selected: #3880ff;
  --ripple-color: #3880ff;
}

ion-tab-button ion-label {
  font-size: 11px;
  margin-top: 2px;
}
</style>
