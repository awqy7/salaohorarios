import type { Service, Appointment, BarberSchedule } from '../types';
import { supabase, supabaseAvailable } from './supabase';

export const services: Service[] = [
  { id: '1', name: 'Corte Degradê (Fade)', price: 35, duration: 40, image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=400&q=80' },
  { id: '2', name: 'Corte Americano',      price: 30, duration: 30, image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=400&q=80' },
  { id: '3', name: 'Corte Social',         price: 25, duration: 30, image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80' },
  { id: '4', name: 'Barba Terapia',        price: 25, duration: 30, image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=400&q=80' },
  { id: '5', name: 'Cabelo + Barba',       price: 55, duration: 60, image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=400&q=80' },
];

const defaultSchedules: BarberSchedule[] = [
  { id: '0', dayOfWeek: 0, isWorking: false, startTime: '09:00', endTime: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { id: '1', dayOfWeek: 1, isWorking: true,  startTime: '09:00', endTime: '19:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { id: '2', dayOfWeek: 2, isWorking: true,  startTime: '09:00', endTime: '19:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { id: '3', dayOfWeek: 3, isWorking: true,  startTime: '09:00', endTime: '19:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { id: '4', dayOfWeek: 4, isWorking: true,  startTime: '09:00', endTime: '19:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { id: '5', dayOfWeek: 5, isWorking: true,  startTime: '09:00', endTime: '20:00', lunchStart: '12:00', lunchEnd: '13:00' },
  { id: '6', dayOfWeek: 6, isWorking: true,  startTime: '09:00', endTime: '17:00', lunchStart: '12:00', lunchEnd: '13:00' },
];

const LS_APPOINTMENTS = 'goldcuts_appointments';
const LS_SCHEDULES    = 'goldcuts_schedules';

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
  } catch {
    /* quota exceeded, ignora */
  }
}

export async function getAppointments(): Promise<Appointment[]> {
  if (supabaseAvailable && supabase) {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: false });
    if (!error && data && data.length > 0) {
      const mapped = data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        clientName: r.clientname as string,
        clientPhone: r.clientphone as string,
        serviceId: r.serviceid as string,
        date: r.date as string,
        time: r.time as string,
        status: r.status as Appointment['status'],
        paid: r.paid as boolean,
        paymentProof: r.paymentproof as string | undefined,
        createdAt: r.createdat as string,
      }));
      return mapped;
    }
  }

  return loadFromLS<Appointment[]>(LS_APPOINTMENTS, []);
}

export async function saveAppointment(a: Appointment): Promise<void> {
  if (supabaseAvailable && supabase) {
    const record = {
      id: a.id,
      clientname: a.clientName,
      clientphone: a.clientPhone,
      serviceid: a.serviceId,
      date: a.date,
      time: a.time,
      status: a.status,
      paid: a.paid,
      paymentproof: a.paymentProof || null,
      createdat: a.createdAt,
    };

    await (supabase.from('appointments') as any)
      .upsert(record, { onConflict: 'id' });
  }

  const all = loadFromLS<Appointment[]>(LS_APPOINTMENTS, []);
  const idx = all.findIndex(x => x.id === a.id);
  if (idx >= 0) {
    all[idx] = a;
  } else {
    all.push(a);
  }
  saveToLS(LS_APPOINTMENTS, all);
}

export async function getSchedules(): Promise<BarberSchedule[]> {
  if (supabaseAvailable && supabase) {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('dayofweek', { ascending: true });
    if (!error && data && data.length > 0) {
      return data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        dayOfWeek: r.dayofweek as number,
        isWorking: r.isworking as boolean,
        startTime: r.starttime as string,
        endTime: r.endtime as string,
        lunchStart: r.lunchstart as string,
        lunchEnd: r.lunchend as string,
      }));
    }
  }

  return loadFromLS<BarberSchedule[]>(LS_SCHEDULES, defaultSchedules);
}

export async function saveSchedules(schedules: BarberSchedule[]): Promise<void> {
  if (supabaseAvailable && supabase) {
    for (const s of schedules) {
      await (supabase.from('schedules') as any)
        .upsert({
          id: s.id,
          dayofweek: s.dayOfWeek,
          isworking: s.isWorking,
          starttime: s.startTime,
          endtime: s.endTime,
          lunchstart: s.lunchStart,
          lunchend: s.lunchEnd,
        }, { onConflict: 'id' });
    }
    return;
  }

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
    if (current >= lunchStart && current < lunchEnd) {
      current = lunchEnd;
      continue;
    }

    const timeStr = current.toTimeString().substring(0, 5);
    const slotEndTime = new Date(current.getTime() + duration * 60000);

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
