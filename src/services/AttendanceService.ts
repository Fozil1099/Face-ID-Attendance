import { v4 as uuidv4 } from "uuid";
import { databaseService } from "./DatabaseService";
import type { AttendanceRecord, AttendanceSummary } from "@/models/Attendance";
import type { Person } from "@/models/Person";

class AttendanceService {
  /**
   * Отметить приход человека
   */
  async markArrival(
    person: Person,
    photoSnapshot: string,
    confidence: number,
  ): Promise<AttendanceRecord> {
    const record: AttendanceRecord = {
      id: uuidv4(),
      personId: person.id,
      personName: person.name,
      personPhoto: person.photoPath,
      timestamp: new Date().toISOString(),
      photoSnapshot,
      confidence,
      status: "arrived",
    };

    await databaseService.addAttendanceRecord(record);
    return record;
  }

  /**
   * Добавить запись вручную (без камеры)
   */
  async markManual(person: Person): Promise<AttendanceRecord> {
    const record: AttendanceRecord = {
      id: uuidv4(),
      personId: person.id,
      personName: person.name,
      personPhoto: person.photoPath,
      timestamp: new Date().toISOString(),
      photoSnapshot: "",
      confidence: 1,
      status: "manual",
    };

    await databaseService.addAttendanceRecord(record);
    return record;
  }

  /**
   * Проверить, отмечался ли человек сегодня
   */
  async hasArrivedToday(personId: string): Promise<boolean> {
    const today = new Date().toISOString().split("T")[0];
    const records = await databaseService.getAttendanceByDate(today);
    return records.some((r) => r.personId === personId);
  }

  /**
   * Получить сводку посещаемости по каждому человеку
   */
  async getSummary(people: Person[]): Promise<AttendanceSummary[]> {
    const allRecords = await databaseService.getAllAttendance();
    const today = new Date().toISOString().split("T")[0];

    return people.map((person) => {
      const personRecords = allRecords.filter((r) => r.personId === person.id);
      const sorted = [...personRecords].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      return {
        personId: person.id,
        personName: person.name,
        personPhoto: person.photoPath,
        totalVisits: personRecords.length,
        lastVisit: sorted[0]?.timestamp ?? null,
        todayVisit: personRecords.some((r) => r.timestamp.startsWith(today)),
      };
    });
  }

  /**
   * Форматировать время посещения
   */
  formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Форматировать дату посещения
   */
  formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  /**
   * Форматировать полное время
   */
  formatDateTime(isoString: string): string {
    return `${this.formatDate(isoString)} ${this.formatTime(isoString)}`;
  }

  /**
   * Экспортировать журнал в CSV и скачать файл
   */
  async exportCSV(): Promise<void> {
    const csv = await databaseService.exportAttendanceCSV();
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const attendanceService = new AttendanceService();
