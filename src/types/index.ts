export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
  image: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paid: boolean;
  createdAt: string;
}

export interface BarberSchedule {
  id: string;
  dayOfWeek: number; // 0-6 (Sun-Sat)
  isWorking: boolean;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}
