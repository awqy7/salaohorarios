import type { Service, Appointment, BarberSchedule } from '../types';

// ─── Serviços (fixos no front) ──────────────────────────────────────────
export const services: Service[] = [
  { id: '1', name: 'Corte Degradê (Fade)', price: 35, duration: 40, image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=400&q=80' },
  { id: '2', name: 'Corte Americano',      price: 30, duration: 30, image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=400&q=80' },
  { id: '3', name: 'Corte Social',         price: 25, duration: 30, image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80' },
  { id: '4', name: 'Barba Terapia',        price: 25, duration: 30, image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=400&q=80' },
  { id: '5', name: 'Cabelo + Barba',       price: 55, duration: 60, image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=400&q=80' },
];

// ─── Horários padrão ───────────────────────────────────────────────────
const defaultSchedules: BarberSchedule[] = [
  { id: '0', dayOfWeek: 0, isWorking: false, startTime: '09:00', endTime: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { id: '1', dayOfWeek: 1, isWorking: true,  startTime: '09:00', endTime: '19:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { id: '2', dayOfWeek: 2, isWorking: true,  startTime: '09:00', endTime: '19:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { id: '3', dayOfWeek: 3, isWorking: true,  startTime: '09:00', endTime: '19:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { id: '4', dayOfWeek: 4, isWorking: true,  startTime: '09:00', endTime: '19:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { id: '5', dayOfWeek: 5, isWorking: true,  startTime: '09:00', endTime: '20:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { id: '6', dayOfWeek: 6, isWorking: true,  startTime: '09:00', endTime: '17:00', lunchStart: '12:00', lunchEnd: '13:00' },
];

// ─── Keys localStorage ──────────────────────────────────────────────────
const LS_APPOINTMENTS = 'goldcuts_appointments';
const LS_SCHEDULES    = 'goldcuts_schedules';

// ─── Cache em memória ───────────────────────────────────────────────────
let cachedAppointments: Appointment[] | null = null;
let cachedSchedules: BarberSchedule[] | null = null;
let cacheApptsAt = 0;
let cacheSchedsAt = 0;
const CACHE_TTL = 30_000; // 30s

function loadFromLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function saveToLS(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* quota exceeded, ignora */ }
}

export async function getAppointments(): Promise<Appointment[]> {
  const now = Date.now();
  if (cachedAppointments && (now - cacheApptsAt) < CACHE_TTL) {
    return cachedAppointments;
  }
  cachedAppointments = loadFromLS<Appointment[]>(LS_APPOINTMENTS, []);
  cacheApptsAt = now;
  return cachedAppointments;
}

export async function saveAppointment(a: Appointment): Promise<void> {
  const all = await getAppointments();
  const idx = all.findIndex(x => x.id === a.id);
  if (idx >= 0) {
    all[idx] = a;
  } else {
    all.push(a);
  }
  cachedAppointments = all;
  cacheApptsAt = Date.now();
  saveToLS(LS_APPOINTMENTS, all);
}

export async function getSchedules(): Promise<BarberSchedule[]> {
  const now = Date.now();
  if (cachedSchedules && (now - cacheSchedsAt) < CACHE_TTL) {
    return cachedSchedules;
  }
  cachedSchedules = loadFromLS<BarberSchedule[]>(LS_SCHEDULES, defaultSchedules);
  cacheSchedsAt = now;
  return cachedSchedules;
}

export async function saveSchedules(schedules: BarberSchedule[]): Promise<void> {
  cachedSchedules = schedules;
  cacheSchedsAt = Date.now();
  saveToLS(LS_SCHEDULES, schedules);
}

function computeAvailableTimes(
  dateStr: string,
  duration: number,
  daySchedule: BarberSchedule,
  dayApps: Appointment[]
): string[] {
  const times: string[] = [];
  let current = new Date(`${dateStr}T${daySchedule.startTime}:00`);
  const end    = new Date(`${dateStr}T${daySchedule.endTime}:00`);
  const lunchStart = new Date(`${dateStr}T${daySchedule.lunchStart}:00`);
  const lunchEnd   = new Date(`${dateStr}T${daySchedule.lunchEnd}:00`);

  while (current < end) {
    // Pula intervalo de almoço
    if (current >= lunchStart && current < lunchEnd) {
      current = lunchEnd;
      continue;
    }

    const timeStr = current.toTimeString().substring(0, 5);

    const slotEndTime = new Date(current.getTime() + duration * 60000);

    // Se o horário extrapola o almoço, pula
    if (current < lunchEnd && slotEndTime > lunchStart) {
      current = lunchEnd;
      continue;
    }

    const isTaken = dayApps.some(app => {
      const svc = services.find(s => s.id === app.serviceId);
      const dur = svc ? svc.duration : 30;
      const appStart = new Date(`${dateStr}T${app.time}:00`);
      const appEnd   = new Date(appStart.getTime() + dur * 60000);
      return current < appEnd && slotEndTime > appStart;
    });

    if (!isTaken) times.push(timeStr);
    current = new Date(current.getTime() + 30 * 60000);
  }

  return times;
}

export async function getAvailableTimes(dateStr: string, duration: number): Promise<string[]> {
  const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
  const [schedules, appointments] = await Promise.all([getSchedules(), getAppointments()]);
  const daySchedule = schedules.find(s => s.dayOfWeek === dayOfWeek);

  if (!daySchedule || !daySchedule.isWorking) return [];

  const dayApps = appointments.filter(a => a.date === dateStr && a.status !== 'cancelled');
  return computeAvailableTimes(dateStr, duration, daySchedule, dayApps);
}

export async function prefetchAvailableTimes(
  dates: string[],
  duration: number
): Promise<Map<string, string[]>> {
  const [schedules, appointments] = await Promise.all([
    getSchedules(),
    getAppointments(),
  ]);

  const result = new Map<string, string[]>();

  for (const dateStr of dates) {
    const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
    const daySchedule = schedules.find(s => s.dayOfWeek === dayOfWeek);

    if (!daySchedule || !daySchedule.isWorking) {
      result.set(dateStr, []);
      continue;
    }

    const dayApps = appointments.filter(
      a => a.date === dateStr && a.status !== 'cancelled'
    );

    result.set(dateStr, computeAvailableTimes(dateStr, duration, daySchedule, dayApps));
  }

  return result;
}
