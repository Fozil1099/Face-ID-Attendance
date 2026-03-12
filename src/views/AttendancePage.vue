<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Журнал посещаемости</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="exportCSV">
            <ion-icon :icon="downloadOutline" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <!-- Фильтр по дате -->
      <ion-toolbar>
        <ion-segment v-model="filterMode">
          <ion-segment-button value="today" :style="segmentStyle('today')">Сегодня</ion-segment-button>
          <ion-segment-button value="week" :style="segmentStyle('week')">Неделя</ion-segment-button>
          <ion-segment-button value="all" :style="segmentStyle('all')">Всё</ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="attendance-content">

      <!-- Счётчики -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-value">{{ todayCount }}</div>
          <div class="stat-label">Сегодня</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ filteredRecords.length }}</div>
          <div class="stat-label">Показано</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ uniquePeople }}</div>
          <div class="stat-label">Уник. людей</div>
        </div>
      </div>

      <!-- Записи -->
      <div v-if="filteredRecords.length > 0">
        <template v-for="(recs, date) in groupedFiltered" :key="date">
          <div class="date-header">{{ formatDateHeader(date) }}</div>
          <div class="records-list">
            <AttendanceCard
              v-for="rec in recs"
              :key="rec.id"
              :record="rec"
              :show-delete="true"
              @delete="deleteRecord"
            />
          </div>
        </template>
      </div>

      <!-- Пустое состояние -->
      <div v-else class="empty-state">
        <ion-icon :icon="listOutline" class="empty-icon" />
        <h3>Нет записей</h3>
        <p>Записи появятся после сканирования лиц</p>
      </div>

    </ion-content>

  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonSegment, IonSegmentButton,
  IonLabel,
} from '@ionic/vue'
import {
  downloadOutline, listOutline,
} from 'ionicons/icons'

import AttendanceCard from '@/components/AttendanceCard.vue'
import { useAttendanceStore } from '@/store/attendance'
import type { AttendanceRecord } from '@/models/Attendance'

const attendanceStore = useAttendanceStore()
const filterMode = ref<'today' | 'week' | 'all'>('today')

const filteredRecords = computed((): AttendanceRecord[] => {
  const now = new Date()
  const records = attendanceStore.sortedRecords

  if (filterMode.value === 'today') {
    const today = now.toISOString().split('T')[0]
    return records.filter(r => r.timestamp.startsWith(today))
  }

  if (filterMode.value === 'week') {
    const weekAgo = new Date(now)
    weekAgo.setDate(now.getDate() - 7)
    return records.filter(r => new Date(r.timestamp) >= weekAgo)
  }

  return records
})

const groupedFiltered = computed(() => {
  const groups: Record<string, AttendanceRecord[]> = {}
  for (const rec of filteredRecords.value) {
    const date = rec.timestamp.split('T')[0]
    if (!groups[date]) groups[date] = []
    groups[date].push(rec)
  }
  return groups
})

const todayCount = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return attendanceStore.records.filter(r => r.timestamp.startsWith(today)).length
})

const uniquePeople = computed(
  () => new Set(filteredRecords.value.map(r => r.personId)).size
)

function formatDateHeader(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (dateStr === today) return 'Сегодня'
  if (dateStr === yesterday) return 'Вчера'
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function segmentStyle(value: string) {
  const isActive = filterMode.value === value
  const color = isActive ? 'var(--ion-color-primary, #3880ff)' : 'var(--ion-color-medium, #92949c)'
  return {
    '--color': color,
    '--color-checked': color,
    '--indicator-color': isActive ? 'var(--ion-color-primary, #3880ff)' : 'transparent',
    'font-weight': isActive ? '700' : '400',
  }
}

async function deleteRecord(id: string) {
  await attendanceStore.deleteRecord(id)
}

async function exportCSV() {
  await attendanceStore.exportCSV()
}

onMounted(async () => {
  await attendanceStore.loadRecords()
})
</script>

<style scoped>
.attendance-content { --background: #f4f5f8; }

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
}

.stat-value {
  font-size: 26px;
  font-weight: 800;
  color: var(--ion-color-primary);
}

.stat-label {
  font-size: 11px;
  color: var(--ion-color-medium);
  margin-top: 2px;
}

.date-header {
  padding: 8px 16px 4px;
  font-size: 13px;
  font-weight: 700;
  color: var(--ion-color-medium);
  text-transform: capitalize;
}

.records-list { padding: 0 16px; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 32px;
  text-align: center;
  color: var(--ion-color-medium);
}

.empty-icon { font-size: 72px; margin-bottom: 16px; opacity: .3; }
.empty-state h3 { font-size: 18px; font-weight: 700; margin: 0 0 8px; }
.empty-state p { font-size: 14px; margin: 0; }
</style>
