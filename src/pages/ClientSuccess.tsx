import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, Scissors } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { services } from '../lib/db';

export function ClientSuccess() {
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<any>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('last_appointment');
    if (raw) {
      setAppointment(JSON.parse(raw));
    } else {
      navigate('/');
    }
  }, [navigate]);

  if (!appointment) return null;

  const svc = services.find(s => s.id === appointment.serviceId);
  const displayDate = format(new Date(appointment.date + 'T00:00:00'), "dd 'de' MMMM, yyyy", { locale: ptBR });
  const firstName = appointment.clientName.split(' ')[0];

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
      <div className="card animate-fade-in" style={{ padding: '3rem 2rem' }}>
        <CheckCircle size={80} color="var(--success)" style={{ margin: '0 auto 1.5rem' }} />
        <h2 style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}>
          Agendamento Confirmado! 🎉
        </h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
          Olá <strong>{firstName}</strong>, seu agendamento foi confirmado e o pagamento aprovado!
        </p>

        <div style={{ background: 'var(--surface-light)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
          {[
            { icon: <Scissors size={18} color="var(--primary)" />, label: 'Serviço', value: svc?.name || 'Serviço' },
            { icon: <Calendar size={18} color="var(--primary)" />, label: 'Data',    value: displayDate },
            { icon: <Clock size={18} color="var(--primary)" />,    label: 'Horário', value: appointment.time },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              {icon}
              <span style={{ color: 'var(--text-muted)', minWidth: '70px' }}>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Te esperamos no horário marcado. Qualquer imprevisto, entre em contato conosco. 💇
        </p>

        <Link to="/" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          Fazer Novo Agendamento
        </Link>
      </div>
    </div>
  );
}
