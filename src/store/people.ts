import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { v4 as uuidv4 } from "uuid";
import { databaseService } from "@/services/DatabaseService";
import { faceRecognitionService } from "@/services/FaceRecognitionService";
import type { Person } from "@/models/Person";

export const usePeopleStore = defineStore("people", () => {
  const people = ref<Person[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const count = computed(() => people.value.length);
  const getPerson = computed(
    () => (id: string) => people.value.find((p) => p.id === id),
  );

  /** Загрузить всех людей из БД */
  async function loadPeople() {
    loading.value = true;
    error.value = null;
    try {
      people.value = await databaseService.getAllPeople();
    } catch (e) {
      error.value = "Ошибка загрузки данных";
    } finally {
      loading.value = false;
    }
  }

  /** Зарегистрировать нового человека */
  async function registerPerson(
    name: string,
    photoBase64: string,
  ): Promise<Person | null> {
    loading.value = true;
    error.value = null;
    try {
      const descriptor =
        await faceRecognitionService.extractDescriptor(photoBase64);
      if (!descriptor) {
        error.value = "Лицо не обнаружено на фото. Попробуйте другое фото.";
        return null;
      }

      const person: Person = {
        id: uuidv4(),
        name: name.trim(),
        photoPath: photoBase64,
        faceDescriptor: Array.from(descriptor),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await databaseService.savePerson(person);
      people.value.push(person);
      return person;
    } catch (e) {
      error.value = "Ошибка регистрации";
      return null;
    } finally {
      loading.value = false;
    }
  }

  /** Обновить данные человека */
  async function updatePerson(
    id: string,
    name: string,
    photoBase64?: string,
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;
    try {
      const updates: Partial<Person> = { name: name.trim() };

      if (photoBase64) {
        const descriptor =
          await faceRecognitionService.extractDescriptor(photoBase64);
        if (!descriptor) {
          error.value = "Лицо не обнаружено на фото";
          return false;
        }
        updates.photoPath = photoBase64;
        updates.faceDescriptor = Array.from(descriptor);
      }

      await databaseService.updatePerson(id, updates);
      const idx = people.value.findIndex((p) => p.id === id);
      if (idx >= 0) {
        people.value[idx] = { ...people.value[idx], ...updates };
      }
      return true;
    } catch (e) {
      error.value = "Ошибка обновления";
      return false;
    } finally {
      loading.value = false;
    }
  }

  /** Удалить человека */
  async function deletePerson(id: string): Promise<void> {
    await databaseService.deletePerson(id);
    people.value = people.value.filter((p) => p.id !== id);
  }

  function clearError() {
    error.value = null;
  }

  return {
    people,
    loading,
    error,
    count,
    getPerson,
    loadPeople,
    registerPerson,
    updatePerson,
    deletePerson,
    clearError,
  };
});
