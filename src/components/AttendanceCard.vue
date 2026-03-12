<template>
  <div class="attendance-card" :class="{ today: isToday }">
    <div class="card-avatar">
      <img
        v-if="record.personPhoto"
        :src="record.personPhoto"
        :alt="record.personName"
        class="avatar-img"
      />
      <div v-else class="avatar-placeholder">
        {{ initials }}
      </div>
    </div>

    <div class="card-info">
      <div class="person-name">{{ record.personName }}</div>
      <div class="visit-time">
        <ion-icon :icon="timeOutline" class="time-icon" />
        {{ formattedTime }}
      </div>
      <div class="visit-date">{{ formattedDate }}</div>
    </div>

    <div class="card-meta">
      <div class="confidence-pill" :class="confidenceClass">
        {{ confidencePercent }}%
      </div>
      <div class="status-chip" :class="record.status">
        {{ record.status === 'arrived' ? 'Авто' : 'Вручную' }}
      </div>
    </div>

    <button v-if="showDelete" class="delete-btn" @click.stop="$emit('delete', record.id)">
      <ion-icon :icon="trashOutline" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { timeOutline, trashOutline } from 'ionicons/icons'
import type { AttendanceRecord } from '@/models/Attendance'
import { attendanceService } from '@/services/AttendanceService'

interface Props {
  record: AttendanceRecord
  showDelete?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDelete: false,
})

defineEmits<{ delete: [id: string] }>()

const initials = computed(() =>
  props.record.personName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
)

const formattedTime = computed(() => attendanceService.formatTime(props.record.timestamp))
const formattedDate = computed(() => attendanceService.formatDate(props.record.timestamp))

const isToday = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return props.record.timestamp.startsWith(today)
})

const confidencePercent = computed(() => Math.round(props.record.confidence * 100))

const confidenceClass = computed(() => {
  const pct = confidencePercent.value
  if (pct >= 85) return 'high'
  if (pct >= 65) return 'medium'
  return 'low'
})
</script>

<style scoped>
.attendance-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--ion-card-background, #fff);
  border-radius: 14px;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  transition: background 0.2s;
  position: relative;
}

.attendance-card.today {
  border-left: 4px solid #2dd36f;
}

.card-avatar {
  flex-shrink: 0;
}

.avatar-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.person-name {
  font-weight: 700;
  font-size: 15px;
  color: var(--ion-text-color, #222);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.visit-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--ion-color-medium, #888);
  margin-top: 2px;
}

.time-icon {
  font-size: 12px;
}

.visit-date {
  font-size: 11px;
  color: var(--ion-color-medium, #aaa);
}

.card-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.confidence-pill {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
}

.confidence-pill.high   { background: #d4f8e8; color: #1a7a45; }
.confidence-pill.medium { background: #fff4cc; color: #7a5a00; }
.confidence-pill.low    { background: #ffe5e8; color: #a01020; }

.status-chip {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  background: #f0f0f0;
  color: #666;
}

.status-chip.arrived {
  background: #e0f2fe;
  color: #0369a1;
}

.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  color: var(--ion-color-danger, #eb445a);
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  opacity: 0.7;
}

.delete-btn:hover {
  opacity: 1;
}
</style>
