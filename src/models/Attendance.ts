export interface AttendanceRecord {
  id: string;
  personId: string;
  personName: string;
  personPhoto: string; // фото зарегистрированного человека
  timestamp: string; // ISO дата и время
  photoSnapshot: string; // фото в момент прихода (base64)
  confidence: number; // точность распознавания 0–1
  status: "arrived" | "manual";
}

export interface AttendanceSummary {
  personId: string;
  personName: string;
  personPhoto: string;
  totalVisits: number;
  lastVisit: string | null;
  todayVisit: boolean;
}
