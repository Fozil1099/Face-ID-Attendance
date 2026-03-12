<template>
  <div class="person-card" @click="$emit('click', person.id)">
    <div class="avatar-wrap" :class="{ arrived: arrivedToday }">
      <img
        v-if="person.photoPath"
        :src="person.photoPath"
        :alt="person.name"
        class="avatar"
      />
      <div v-else class="avatar-placeholder">
        {{ initials }}
      </div>

      <!-- Метка "пришёл сегодня" -->
      <div v-if="arrivedToday" class="arrived-badge">✓</div>
    </div>

    <div class="person-info">
      <div class="person-name">{{ person.name }}</div>
      <div v-if="arrivedToday" class="arrived-label">Пришёл сегодня</div>
      <div v-else class="not-arrived-label">Ещё не пришёл</div>
    </div>

    <!-- Слот для действий -->
    <div class="card-actions" @click.stop>
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Person } from '@/models/Person'

interface Props {
  person: Person
  arrivedToday?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  arrivedToday: false,
})

defineEmits<{ click: [id: string] }>()

const initials = computed(() =>
  props.person.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
)
</script>

<style scoped>
.person-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--ion-card-background, #fff);
  border-radius: 16px;
  margin-bottom: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.person-card:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid transparent;
  transition: border-color 0.3s;
}

.avatar-wrap.arrived .avatar {
  border-color: #2dd36f;
}

.avatar-placeholder {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 18px;
  border: 2px solid transparent;
  transition: border-color 0.3s;
}

.avatar-wrap.arrived .avatar-placeholder {
  border-color: #2dd36f;
}

.arrived-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 18px;
  height: 18px;
  background: #2dd36f;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  border: 1.5px solid #fff;
}

.person-info {
  flex: 1;
  min-width: 0;
}

.person-name {
  font-weight: 700;
  font-size: 16px;
  color: var(--ion-text-color, #222);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arrived-label {
  font-size: 12px;
  color: #2dd36f;
  font-weight: 600;
  margin-top: 2px;
}

.not-arrived-label {
  font-size: 12px;
  color: var(--ion-color-medium, #aaa);
  margin-top: 2px;
}

.card-actions {
  display: flex;
  gap: 4px;
}
</style>
