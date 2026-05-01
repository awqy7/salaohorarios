import type { Service, Appointment, BarberSchedule } from '../types';
import { supabase } from './supabase';

// ─── Serviços (fixos no front) ─────────────────────────────────────
export const services: Service[] = [
  { id: '1', name: 'Corte Degradê (Fade)', price: 35, duration: 40, image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=400&q=80' },
  { id: '2', name: 'Corte Americano',      price: 30, duration: 30, image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=400&q=80' },
  { id: '3', name: 'Corte Social',         price: 25, duration: 30, image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80' },
  { id: '4', name: 'Barba Terapia',        price: 25, duration: 30, image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=400&q=80' },
  { id: '5', name: 'Cabelo + Barba',       price: 55, duration: 60, image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=400&q=80' },
];

// ─── Horários padrão ───────────────────────────────────────────────
const defaultSchedules: BarberSchedule[] = [
  { id: '0', dayOfWeek: 0, isWorking: false, startTime: '09:00', endTime: '18:00' },
  { id: '1', dayOfWeek: 1, isWorking: true,  startTime: '09:00', endTime: '19:00' },
  { id: '2', dayOfWeek: 2, isWorking: true,  startTime: '09:00', endTime: '19:00' },
  { id: '3', dayOfWeek: 3, isWorking: true,  startTime: '09:00', endTime: '19:00' },
  { id: '4', dayOfWeek: 4, isWorking: true,  startTime: '09:00', endTime: '19:00' },
  { id: '5', dayOfWeek: 5, isWorking: true,  startTime: '09:00', endTime: '20:00' },
  { id: '6', dayOfWeek: 6, isWorking: true,  startTime: '09:00', endTime: '17:00' },
];

// ─── Keys localStorage (fallback) ─────────────────────────────────
const LS_APPOINTMENTS = 'goldcuts_appointments';
const LS_SCHEDULES    = 'goldcuts_schedules';

// ─── Helpers ───────────────────────────────────────────────────────

export async function getAppointments(): Promise<Appointment[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (!error && data) {
        return data.map(r => ({
          id:          r.id,
          clientName:  r.client_name,
          clientPhone: r.client_phone,
          serviceId:   r.service_id,
          date:        r.date,
          time:        (r.time as string).substring(0, 5),
          status:      r.status,
          paid:        r.paid,
          createdAt:   r.created_at,
        }));
      }
    } catch (_) { /* fallback */ }
  }

  const raw = localStorage.getItem(LS_APPOINTMENTS);
  return raw ? JSON.parse(raw) : [];
}

export async function saveAppointment(a: Appointment): Promise<void> {
  if (supabase) {
    try {
      const { error } = await supabase.from('appointments').insert([{
        client_name:  a.clientName,
        client_phone: a.clientPhone,
        service_id:   a.serviceId,
        date:         a.date,
        time:         a.time + ':00',
        status:       a.status,
        paid:         a.paid,
      }]);
      if (!error) return;
    } catch (_) { /* fallback */ }
  }

  // localStorage fallback
  const all = await getAppointments();
  all.push(a);
  localStorage.setItem(LS_APPOINTMENTS, JSON.stringify(all));
}

export async function getSchedules(): Promise<BarberSchedule[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('day_of_week', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map(r => ({
          id:         String(r.id),
          dayOfWeek:  r.day_of_week,
          isWorking:  r.is_working,
          startTime:  (r.start_time as string).substring(0, 5),
          endTime:    (r.end_time   as string).substring(0, 5),
        }));
      }
    } catch (_) { /* fallback */ }
  }

  const raw = localStorage.getItem(LS_SCHEDULES);
  return raw ? JSON.parse(raw) : defaultSchedules;
}

export async function saveSchedules(schedules: BarberSchedule[]): Promise<void> {
  if (supabase) {
    try {
      let ok = true;
      for (const s of schedules) {
        const { error } = await supabase
          .from('schedules')
          .update({
            is_working: s.isWorking,
            start_time: s.startTime + ':00',
            end_time:   s.endTime   + ':00',
          })
          .eq('id', s.id);
        if (error) { ok = false; break; }
      }
      if (ok) return;
    } catch (_) { /* fallback */ }
  }

  localStorage.setItem(LS_SCHEDULES, JSON.stringify(schedules));
}

export async function getAvailableTimes(dateStr: string, duration: number): Promise<string[]> {
  const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
  const schedules = await getSchedules();
  const daySchedule = schedules.find(s => s.dayOfWeek === dayOfWeek);

  if (!daySchedule || !daySchedule.isWorking) return [];

  const appointments = await getAppointments();
  const dayApps = appointments.filter(a => a.date === dateStr && a.status !== 'cancelled');

  const times: string[] = [];
  let current = new Date(`${dateStr}T${daySchedule.startTime}:00`);
  const end    = new Date(`${dateStr}T${daySchedule.endTime}:00`);

  while (current < end) {
    const timeStr = current.toTimeString().substring(0, 5);

    const isTaken = dayApps.some(app => {
      const svc = services.find(s => s.id === app.serviceId);
      const dur = svc ? svc.duration : 30;
      const appStart = new Date(`${dateStr}T${app.time}:00`);
      const appEnd   = new Date(appStart.getTime() + dur * 60000);
      const slotEnd  = new Date(current.getTime() + duration * 60000);
      return current < appEnd && slotEnd > appStart;
    });

    if (!isTaken) times.push(timeStr);
    current = new Date(current.getTime() + 30 * 60000);
  }

  return times;
}
