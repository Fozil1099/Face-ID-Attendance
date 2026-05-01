import { Preferences } from "@capacitor/preferences";
import type { Person } from "@/models/Person";
import type { AttendanceRecord } from "@/models/Attendance";

const KEYS = {
  PEOPLE: "face_id_people",
  ATTENDANCE: "face_id_attendance",
  SETTINGS: "face_id_settings",
};

export interface AppSettings {
  recognitionThreshold: number; // 0.4 – 0.7 (default 0.55)
  autoMarkDelay: number; // секунды до автоотметки
  keepDays: number; // сколько дней хранить журнал
}

const DEFAULT_SETTINGS: AppSettings = {
  recognitionThreshold: 0.55,
  autoMarkDelay: 2,
  keepDays: 90,
};

class DatabaseService {
  async getAllPeople(): Promise<Person[]> {
    const { value } = await Preferences.get({ key: KEYS.PEOPLE });
    if (!value) return [];
    try {
      return JSON.parse(value) as Person[];
    } catch {
      return [];
    }
  }

  async getPersonById(id: string): Promise<Person | null> {
    const people = await this.getAllPeople();
    return people.find((p) => p.id === id) ?? null;
  }

  async savePerson(person: Person): Promise<void> {
    const people = await this.getAllPeople();
    const idx = people.findIndex((p) => p.id === person.id);
    if (idx >= 0) {
      people[idx] = person;
    } else {
      people.push(person);
    }
    await Preferences.set({ key: KEYS.PEOPLE, value: JSON.stringify(people) });
  }

  async deletePerson(id: string): Promise<void> {
    const people = await this.getAllPeople();
    const filtered = people.filter((p) => p.id !== id);
    await Preferences.set({
      key: KEYS.PEOPLE,
      value: JSON.stringify(filtered),
    });
  }

  async updatePerson(id: string, updates: Partial<Person>): Promise<void> {
    const people = await this.getAllPeople();
    const idx = people.findIndex((p) => p.id === id);
    if (idx >= 0) {
      people[idx] = {
        ...people[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await Preferences.set({
        key: KEYS.PEOPLE,
        value: JSON.stringify(people),
      });
    }
  }

  async getAllAttendance(): Promise<AttendanceRecord[]> {
    const { value } = await Preferences.get({ key: KEYS.ATTENDANCE });
    if (!value) return [];
    try {
      return JSON.parse(value) as AttendanceRecord[];
    } catch {
      return [];
    }
  }

  async addAttendanceRecord(record: AttendanceRecord): Promise<void> {
    const records = await this.getAllAttendance();
    records.unshift(record); // новые записи в начало
    await Preferences.set({
      key: KEYS.ATTENDANCE,
      value: JSON.stringify(records),
    });
  }

  async deleteAttendanceRecord(id: string): Promise<void> {
    const records = await this.getAllAttendance();
    const filtered = records.filter((r) => r.id !== id);
    await Preferences.set({
      key: KEYS.ATTENDANCE,
      value: JSON.stringify(filtered),
    });
  }

  async clearAllAttendance(): Promise<void> {
    await Preferences.set({ key: KEYS.ATTENDANCE, value: "[]" });
  }

  async getAttendanceByPerson(personId: string): Promise<AttendanceRecord[]> {
    const records = await this.getAllAttendance();
    return records.filter((r) => r.personId === personId);
  }

  async getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
    const records = await this.getAllAttendance();
    return records.filter((r) => r.timestamp.startsWith(date));
  }

  async getTodayAttendance(): Promise<AttendanceRecord[]> {
    const today = new Date().toISOString().split("T")[0];
    return this.getAttendanceByDate(today);
  }

  async getSettings(): Promise<AppSettings> {
    const { value } = await Preferences.get({ key: KEYS.SETTINGS });
    if (!value) return { ...DEFAULT_SETTINGS };
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(value) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  async saveSettings(settings: Partial<AppSettings>): Promise<void> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    await Preferences.set({
      key: KEYS.SETTINGS,
      value: JSON.stringify(updated),
    });
  }

  async exportAttendanceCSV(): Promise<string> {
    const records = await this.getAllAttendance();
    const header = "ID,Имя,Дата,Время,Точность,Статус\n";
    const rows = records.map((r) => {
      const dt = new Date(r.timestamp);
      const date = dt.toLocaleDateString("ru-RU");
      const time = dt.toLocaleTimeString("ru-RU");
      const confidence = Math.round(r.confidence * 100);
      return `"${r.id}","${r.personName}","${date}","${time}","${confidence}%","${r.status}"`;
    });
    return header + rows.join("\n");
  }

  async cleanupOldRecords(): Promise<void> {
    const settings = await this.getSettings();
    const records = await this.getAllAttendance();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - settings.keepDays);
    const filtered = records.filter((r) => new Date(r.timestamp) >= cutoff);
    await Preferences.set({
      key: KEYS.ATTENDANCE,
      value: JSON.stringify(filtered),
    });
  }
}

export const databaseService = new DatabaseService();
