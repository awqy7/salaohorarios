-- Copie e cole isto no Supabase Dashboard > SQL Editor > New Query
-- Depois clique em "Run" para criar as tabelas

-- Recria a tabela de agendamentos
DROP TABLE IF EXISTS public.appointments CASCADE;
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY,
  clientname TEXT NOT NULL,
  clientphone TEXT NOT NULL,
  serviceid TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  paid BOOLEAN NOT NULL DEFAULT false,
  paymentproof TEXT,
  createdat TEXT NOT NULL
);

ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;

-- Recria a tabela de horários
DROP TABLE IF EXISTS public.schedules CASCADE;
CREATE TABLE public.schedules (
  id TEXT PRIMARY KEY,
  dayofweek INTEGER NOT NULL,
  isworking BOOLEAN NOT NULL DEFAULT true,
  starttime TEXT NOT NULL DEFAULT '09:00',
  endtime TEXT NOT NULL DEFAULT '18:00',
  lunchstart TEXT NOT NULL DEFAULT '12:00',
  lunchend TEXT NOT NULL DEFAULT '13:00'
);

ALTER TABLE public.schedules DISABLE ROW LEVEL SECURITY;

-- Insere horários padrão
INSERT INTO public.schedules (id, dayofweek, isworking, starttime, endtime, lunchstart, lunchend)
VALUES
  ('0', 0, false, '09:00', '18:00', '12:00', '13:00'),
  ('1', 1, true,  '09:00', '19:00', '12:00', '13:00'),
  ('2', 2, true,  '09:00', '19:00', '12:00', '13:00'),
  ('3', 3, true,  '09:00', '19:00', '12:00', '13:00'),
  ('4', 4, true,  '09:00', '19:00', '12:00', '13:00'),
  ('5', 5, true,  '09:00', '20:00', '12:00', '13:00'),
  ('6', 6, true,  '09:00', '17:00', '12:00', '13:00')
ON CONFLICT (id) DO NOTHING;