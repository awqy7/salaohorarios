-- Tabela de Agendamentos (Appointments)
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  service_id TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT DEFAULT 'pending',
  paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Configuração de Horários (Schedules)
CREATE TABLE schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL UNIQUE,
  is_working BOOLEAN DEFAULT true,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  lunch_start TIME DEFAULT '12:00:00',
  lunch_end TIME DEFAULT '13:00:00'
);

-- Inserir horários padrão
INSERT INTO schedules (day_of_week, is_working, start_time, end_time, lunch_start, lunch_end) VALUES 
  (0, false, '09:00:00', '18:00:00', '12:00:00', '13:00:00'),
  (1, true,  '09:00:00', '19:00:00', '12:00:00', '13:00:00'),
  (2, true,  '09:00:00', '19:00:00', '12:00:00', '13:00:00'),
  (3, true,  '09:00:00', '19:00:00', '12:00:00', '13:00:00'),
  (4, true,  '09:00:00', '19:00:00', '12:00:00', '13:00:00'),
  (5, true,  '09:00:00', '20:00:00', '12:00:00', '13:00:00'),
  (6, true,  '09:00:00', '17:00:00', '12:00:00', '13:00:00');
