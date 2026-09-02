export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled';

export interface Booking {
  id: string;
  sessionId: string;
  permitName: string;
  sessionType: 'Theory' | 'Practical';
  sessionStartsAt: string;
  instructorName: string;
  studentName: string;
  status: BookingStatus;
  bookedAt: string;
}
