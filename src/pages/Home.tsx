import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Scissors, User } from 'lucide-react';
import { services, getAvailableTimes } from '../lib/db';
import type { Service } from '../types';

export function Home() {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate]       = useState('');
  const [availableTimes, setAvailableTimes]   = useState<string[]>([]);
  const [selectedTime, setSelectedTime]       = useState('');
  const [clientName, setClientName]           = useState('');
  const [clientPhone, setClientPhone]         = useState('');
  const [loadingTimes, setLoadingTimes]       = useState(false);

  // Próximos 14 dias
  const upcomingDates = Array.from({ length: 14 }).map((_, i) =>
    format(addDays(new Date(), i), 'yyyy-MM-dd')
  );

  useEffect(() => {
    if (!selectedDate || !selectedService) return;
    setLoadingTimes(true);
    setSelectedTime('');
    getAvailableTimes(selectedDate, selectedService.duration)
      .then(times => setAvailableTimes(times))
      .catch(() => setAvailableTimes([]))
      .finally(() => setLoadingTimes(false));
  }, [selectedDate, selectedService]);

  const handleContinue = () => {
    if (!selectedService || !selectedDate || !selectedTime || !clientName || !clientPhone) return;
    sessionStorage.setItem('booking_draft', JSON.stringify({
      service: selectedService, date: selectedDate, time: selectedTime, clientName, clientPhone,
    }));
    navigate('/payment');
  };

  const canContinue = !!(selectedService && selectedDate && selectedTime && clientName && clientPhone);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="hero-section">
        <h1 className="hero-title">✂ GoldCuts</h1>
        <p className="hero-subtitle">Escolha o serviço, a data e o horário. Pague online e pronto!</p>
      </div>

      <div className="responsive-grid">

        {/* ── Coluna Esquerda ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Serviços */}
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Scissors size={22} color="var(--primary)" /> 1. Escolha o Serviço
            </h3>
            <div className="services-grid">
              {services.map(svc => (
                <div
                  key={svc.id}
                  onClick={() => setSelectedService(svc)}
                  className={`card selectable-card${selectedService?.id === svc.id ? ' selected' : ''}`}
                  style={{ padding: '0.75rem', cursor: 'pointer', border: '1px solid var(--border)' }}
                >
                  <img
                    src={svc.image}
                    alt={svc.name}
                    style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px', marginBottom: '0.75rem' }}
                  />
                  <div style={{ fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.95rem' }}>{svc.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>R$ {svc.price.toFixed(2)}</span>
                    <span className="badge badge-warning">{svc.duration} min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dados pessoais */}
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <User size={22} color="var(--primary)" /> 3. Seus Dados
            </h3>
            <div className="input-group">
              <label>Nome Completo</label>
              <input type="text" className="input" placeholder="Ex: João da Silva"
                value={clientName} onChange={e => setClientName(e.target.value)} />
            </div>
            <div className="input-group">
              <label>WhatsApp</label>
              <input type="tel" className="input" placeholder="(00) 00000-0000"
                value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Coluna Direita ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Data e hora */}
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Calendar size={22} color="var(--primary)" /> 2. Data e Horário
            </h3>

            {!selectedService ? (
              <p style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                👆 Selecione um serviço primeiro.
              </p>
            ) : (
              <>
                {/* Datas */}
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 500 }}>Datas Disponíveis</label>
                <div className="scroll-x" style={{ marginBottom: '1.5rem' }}>
                  {upcomingDates.map(date => {
                    const d = new Date(date + 'T00:00:00');
                    return (
                      <div
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`card selectable-card${selectedDate === date ? ' selected' : ''}`}
                        style={{ minWidth: '72px', padding: '0.6rem 0.4rem', textAlign: 'center', cursor: 'pointer' }}
                      >
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {format(d, 'EEE', { locale: ptBR })}
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: selectedDate === date ? 'var(--primary)' : 'inherit' }}>
                          {format(d, 'dd')}
                        </div>
                        <div style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                          {format(d, 'MMM', { locale: ptBR })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Horários */}
                {selectedDate && (
                  <>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', fontWeight: 500 }}>
                      <Clock size={16} color="var(--primary)" /> Horários Disponíveis
                    </label>
                    {loadingTimes ? (
                      <p style={{ color: 'var(--text-muted)' }}>Carregando horários...</p>
                    ) : availableTimes.length === 0 ? (
                      <p style={{ color: 'var(--danger)' }}>Nenhum horário disponível nesta data.</p>
                    ) : (
                      <div className="times-grid">
                        {availableTimes.map(t => (
                          <div
                            key={t}
                            onClick={() => setSelectedTime(t)}
                            className={`card selectable-card${selectedTime === t ? ' selected' : ''}`}
                            style={{ padding: '0.6rem', textAlign: 'center', cursor: 'pointer', fontWeight: 600 }}
                          >
                            {t}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Resumo */}
          <div className="card" style={{ border: '1px solid var(--primary)', background: 'rgba(212,175,55,0.04)' }}>
            <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              Resumo
            </h3>
            {selectedService ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Serviço</span>
                  <strong>{selectedService.name}</strong>
                </div>
                {selectedDate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Data</span>
                    <strong>{format(new Date(selectedDate + 'T00:00:00'), "dd/MM/yyyy")}</strong>
                  </div>
                )}
                {selectedTime && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Horário</span>
                    <strong>{selectedTime}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>Total</span>
                  <strong style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>R$ {selectedService.price.toFixed(2)}</strong>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Selecione um serviço para ver o resumo.</p>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem', opacity: canContinue ? 1 : 0.5 }}
              disabled={!canContinue}
              onClick={handleContinue}
            >
              Continuar para Pagamento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
