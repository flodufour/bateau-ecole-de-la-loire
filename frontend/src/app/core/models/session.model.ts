export type SessionType = 'Theory' | 'Practical';

export interface Session {
  id: string;
  permitId: string;
  permitName: string;
  instructorId: string;
  instructorName: string;
  type: SessionType;
  startsAt: string;
  durationMinutes: number;
  maxCapacity: number;
  location: string;
}
