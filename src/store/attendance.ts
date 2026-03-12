import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { databaseService } from "@/services/DatabaseService";
import { attendanceService } from "@/services/AttendanceService";
import type { AttendanceRecord } from "@/models/Attendance";
import type { Person } from "@/models/Person";

export const useAttendanceStore = defineStore("attendance", () => {
  const records = ref<AttendanceRecord[]>([]);
  const loading = ref(false);
  const todayCount = ref(0);

  const sortedRecords = computed(() =>
    [...records.value].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    ),
  );

  const todayRecords = computed(() => {
    const today = new Date().toISOString().split("T")[0];
    return sortedRecords.value.filter((r) => r.timestamp.startsWith(today));
  });

  const groupedByDate = computed(() => {
    const groups: Record<string, AttendanceRecord[]> = {};
    for (const record of sortedRecords.value) {
      const date = record.timestamp.split("T")[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(record);
    }
    return groups;
  });

  /** Загрузить все записи */
  async function loadRecords() {
    loading.value = true;
    try {
      records.value = await databaseService.getAllAttendance();
      todayCount.value = (await databaseService.getTodayAttendance()).length;
    } finally {
      loading.value = false;
    }
  }

  /** Отметить приход */
  async function markArrival(
    person: Person,
    photoSnapshot: string,
    confidence: number,
  ): Promise<AttendanceRecord> {
    const record = await attendanceService.markArrival(
      person,
      photoSnapshot,
      confidence,
    );
    records.value.unshift(record);
    todayCount.value++;
    return record;
  }

  /** Отметить вручную */
  async function markManual(person: Person): Promise<AttendanceRecord> {
    const record = await attendanceService.markManual(person);
    records.value.unshift(record);
    todayCount.value++;
    return record;
  }

  /** Проверить приход сегодня */
  async function hasArrivedToday(personId: string): Promise<boolean> {
    return attendanceService.hasArrivedToday(personId);
  }

  /** Удалить запись */
  async function deleteRecord(id: string): Promise<void> {
    await databaseService.deleteAttendanceRecord(id);
    records.value = records.value.filter((r) => r.id !== id);
  }

  /** Очистить весь журнал */
  async function clearAll(): Promise<void> {
    await databaseService.clearAllAttendance();
    records.value = [];
    todayCount.value = 0;
  }

  /** Экспорт CSV */
  async function exportCSV(): Promise<void> {
    await attendanceService.exportCSV();
  }

  return {
    records,
    loading,
    todayCount,
    sortedRecords,
    todayRecords,
    groupedByDate,
    loadRecords,
    markArrival,
    markManual,
    hasArrivedToday,
    deleteRecord,
    clearAll,
    exportCSV,
  };
});
