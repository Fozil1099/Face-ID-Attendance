<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Сотрудники</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="router.push('/register')">
            <ion-icon :icon="personAddOutline" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <!-- Поиск -->
      <ion-toolbar color="primary">
        <ion-searchbar
          v-model="searchQuery"
          placeholder="Поиск по имени..."
          :debounce="200"
          color="light"
        />
      </ion-toolbar>
    </ion-header>

    <ion-content class="people-content">

      <!-- Счётчик -->
      <div class="people-meta">
        <span class="count-badge">{{ filteredPeople.length }} чел.</span>
        <span class="today-badge">
          <ion-icon :icon="checkmarkCircleOutline" />
          {{ todayCount }} сегодня
        </span>
      </div>

      <!-- Список людей -->
      <div v-if="filteredPeople.length > 0" class="people-list">
        <PersonCard
          v-for="person in filteredPeople"
          :key="person.id"
          :person="person"
          :arrived-today="arrivedTodayIds.has(person.id)"
          @click="openPersonMenu(person)"
        >
          <template #actions>
            <ion-button fill="clear" size="small" @click.stop="askDelete(person)">
              <ion-icon :icon="trashOutline" slot="icon-only" color="danger" />
            </ion-button>
          </template>
        </PersonCard>
      </div>

      <!-- Пустой список -->
      <div v-else class="empty-state">
        <ion-icon :icon="peopleOutline" class="empty-icon" />
        <h3>{{ searchQuery ? 'Никого не найдено' : 'Нет сотрудников' }}</h3>
        <p>{{ searchQuery ? 'Попробуйте другой запрос' : 'Нажмите + чтобы добавить' }}</p>
      </div>

      <!-- FAB — кнопка добавить всегда видна -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="router.push('/register')" color="primary">
          <ion-icon :icon="addOutline" />
        </ion-fab-button>
      </ion-fab>

    </ion-content>

    <!-- Action Sheet для человека -->
    <ion-action-sheet
      :is-open="!!selectedPerson"
      :header="selectedPerson?.name"
      :buttons="actionButtons"
      @did-dismiss="selectedPerson = null"
    />

  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonSearchbar,
  IonLabel, IonActionSheet,
  IonFab, IonFabButton,
  alertController,
} from '@ionic/vue'
import {
  personAddOutline, peopleOutline, addOutline,
  checkmarkCircleOutline,
  trashOutline,
} from 'ionicons/icons'

import PersonCard from '@/components/PersonCard.vue'
import { usePeopleStore } from '@/store/people'
import { useAttendanceStore } from '@/store/attendance'
import type { Person } from '@/models/Person'

const router = useRouter()
const peopleStore = usePeopleStore()
const attendanceStore = useAttendanceStore()

const searchQuery = ref('')
const selectedPerson = ref<Person | null>(null)

const filteredPeople = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return peopleStore.people
  return peopleStore.people.filter(p => p.name.toLowerCase().includes(q))
})

const arrivedTodayIds = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return new Set(
    attendanceStore.records
      .filter(r => r.timestamp.startsWith(today))
      .map(r => r.personId)
  )
})

const todayCount = computed(() => arrivedTodayIds.value.size)

const actionButtons = computed(() => {
  const person = selectedPerson.value
  return [
    {
      text: 'Удалить',
      icon: trashOutline,
      role: 'destructive',
      handler: () => {
        if (person) askDelete(person)
      },
    },
    { text: 'Отмена', role: 'cancel' },
  ]
})

function openPersonMenu(person: Person) {
  selectedPerson.value = person
}

async function askDelete(person: Person) {
  selectedPerson.value = null
  const alert = await alertController.create({
    header: 'Удалить сотрудника?',
    message: `Удалить ${person.name}? Все записи посещаемости сохранятся.`,
    buttons: [
      { text: 'Отмена', role: 'cancel' },
      {
        text: 'Удалить',
        role: 'destructive',
        cssClass: 'alert-button-danger',
        handler: async () => {
          await peopleStore.deletePerson(person.id)
        },
      },
    ],
  })
  await alert.present()
}

onMounted(async () => {
  await Promise.all([
    peopleStore.loadPeople(),
    attendanceStore.loadRecords(),
  ])
})
</script>

<style scoped>
.people-content {
  --background: #f4f5f8;
}

.people-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px 4px;
}

.count-badge {
  font-size: 13px;
  font-weight: 700;
  color: var(--ion-color-medium);
}

.today-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #2dd36f;
  font-weight: 700;
  background: #d4f8e8;
  padding: 2px 8px;
  border-radius: 10px;
}

.people-list {
  padding: 8px 16px 100px;
}

.empty-state {
  padding-bottom: 120px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 32px 120px;
  text-align: center;
  color: var(--ion-color-medium);
}

.empty-icon {
  font-size: 72px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 8px;
}

.empty-state p {
  font-size: 14px;
  margin: 0 0 20px;
}
</style>
