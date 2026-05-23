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
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paid: boolean;
  paymentProof?: string;
  createdAt: string;
}

export interface BarberSchedule {
  id: string;
  dayOfWeek: number; // 0-6 (Sun-Sat)
  isWorking: boolean;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  lunchStart: string; // HH:mm
  lunchEnd: string; // HH:mm
}
