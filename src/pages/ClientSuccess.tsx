import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, Scissors, MapPin } from 'lucide-react';
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
    <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
      <div className="card animate-scale-in" style={{ padding: '2.5rem 2rem' }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: 'var(--success-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
          border: '2px solid rgba(52,211,153,0.15)',
        }}>
          <CheckCircle size={52} color="var(--success)" className="animate-bounce" />
        </div>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          <span className="gold-text">Agendamento Confirmado!</span>
        </h2>
        <p style={{ fontSize: '1rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
          Olá <strong style={{ color: 'var(--text-primary)' }}>{firstName}</strong>, seu horário foi reservado com sucesso.
        </p>

        <div style={{
          background: 'var(--surface-elevated)', borderRadius: 'var(--radius-md)',
          padding: '1.25rem', marginBottom: '2rem', textAlign: 'left',
          border: '1px solid var(--border)',
        }}>
          {[
            { icon: <Scissors size={16} color="var(--gold-500)" />, label: 'Serviço', value: svc?.name || '—' },
            { icon: <Calendar size={16} color="var(--gold-500)" />, label: 'Data', value: displayDate },
            { icon: <Clock size={16} color="var(--gold-500)" />, label: 'Horário', value: appointment.time },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(212,167,74,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {icon}
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', minWidth: '60px' }}>{label}</span>
              <strong style={{ fontSize: '0.9rem' }}>{value}</strong>
            </div>
          ))}
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          Chegue no horário para garantir o melhor atendimento. <br />
          Se precisar remarcar, entre em contato conosco.
        </p>

        <Link to="/" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          Novo Agendamento
        </Link>
      </div>
    </div>
  );
}
