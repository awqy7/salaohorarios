import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, User, ArrowRight, Sparkles, Check, Star, Timer } from 'lucide-react';
import { services, getAvailableTimes } from '../lib/db';
import type { Service } from '../types';

const popularId = '5';

export function Home() {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate]       = useState('');
  const [availableTimes, setAvailableTimes]   = useState<string[]>([]);
  const [selectedTime, setSelectedTime]       = useState('');
  const [clientName, setClientName]           = useState('');
  const [clientPhone, setClientPhone]         = useState('');
  const [loadingTimes, setLoadingTimes]       = useState(false);

  const upcomingDates = Array.from({ length: 7 }).map((_, i) =>
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

  const today = new Date();

  return (
    <div className="animate-fade-in">
      <div className="hero-section">
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.3rem 0.85rem', borderRadius: 9999, fontSize: '0.7rem', fontWeight: 600,
            background: 'rgba(212,167,74,0.08)', color: 'var(--gold-500)',
            border: '1px solid rgba(212,167,74,0.15)',
          }}>
            <Sparkles size={11} /> Agendamento Online
          </span>
        </div>
        <h1 className="hero-title">GoldCuts</h1>
        <p className="hero-subtitle">
          Escolha seu serviço, selecione o melhor horário e garanta seu atendimento premium.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

        <div className="card" style={{ padding: 0 }}>
          <div className="step-indicator" style={{ padding: '1.25rem 1.25rem 0', marginBottom: 0 }}>
            <span className="step-number">1</span>
            <span className="step-label">Escolha seu Corte</span>
          </div>

          <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
            <div className="services-grid">
              {services.map(svc => {
                const isSelected = selectedService?.id === svc.id;
                const isPopular = svc.id === popularId;

                return (
                  <div
                    key={svc.id}
                    onClick={() => setSelectedService(svc)}
                    className="card selectable-card"
                    style={{
                      padding: 0, overflow: 'hidden', cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    {isPopular && !isSelected && (
                      <div style={{
                        position: 'absolute', top: 6, left: 6, zIndex: 2,
                        display: 'flex', alignItems: 'center', gap: '2px',
                        background: 'var(--gold-gradient)', color: 'var(--text-inverse)',
                        fontSize: '0.5rem', fontWeight: 700, padding: '2px 6px',
                        borderRadius: 5, boxShadow: '0 2px 8px rgba(212,167,74,0.3)',
                      }}>
                        <Star size={8} fill="currentColor" />
                      </div>
                    )}

                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: 6, left: 6, zIndex: 2,
                        display: 'flex', alignItems: 'center', gap: '2px',
                        background: 'var(--gold-gradient)', color: 'var(--text-inverse)',
                        fontSize: '0.5rem', fontWeight: 700, padding: '2px 6px',
                        borderRadius: 5,
                      }}>
                        <Check size={8} strokeWidth={3} />
                      </div>
                    )}

                    <div style={{
                      height: 90, overflow: 'hidden', position: 'relative',
                    }}>
                      <img src={svc.image} alt={svc.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: '50%',
                        background: 'linear-gradient(transparent, rgba(7,7,13,0.85))',
                      }} />
                      <div style={{
                        position: 'absolute', bottom: 5, left: 5,
                        display: 'flex', alignItems: 'center', gap: '2px',
                        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                        borderRadius: 4, padding: '1px 5px',
                        fontSize: '0.5rem', fontWeight: 600, color: 'var(--gold-500)',
                      }}>
                        <Timer size={7} /> {svc.duration} min
                      </div>
                    </div>

                    <div style={{ padding: '0.5rem' }}>
                      <div style={{
                        fontWeight: 600, fontSize: '0.75rem',
                        fontFamily: 'var(--font-display)',
                        marginBottom: '0.15rem',
                        lineHeight: 1.2,
                      }}>
                        {svc.name}
                      </div>
                      <div style={{
                        fontSize: '0.85rem', fontWeight: 700,
                        background: 'var(--gold-gradient)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}>
                        R$ {svc.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="step-indicator">
            <span className="step-number">2</span>
            <span className="step-label">Data & Horário</span>
          </div>

          {!selectedService ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <Calendar size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                Selecione um serviço primeiro
              </p>
            </div>
          ) : (
            <>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Datas Disponíveis
              </label>
              <div className="scroll-x" style={{ marginBottom: '1.25rem' }}>
                {upcomingDates.map(date => {
                  const d = new Date(date + 'T00:00:00');
                  const isToday = format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                  return (
                    <div
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className="card selectable-card"
                      style={{
                        minWidth: '74px', padding: '0.65rem 0.4rem', textAlign: 'center',
                        cursor: 'pointer', borderRadius: 'var(--radius-md)',
                        position: 'relative',
                      }}
                    >
                      {isToday && (
                        <div style={{
                          position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)',
                          fontSize: '0.5rem', fontWeight: 700, color: 'var(--text-inverse)',
                          background: 'var(--gold-gradient)', padding: '1px 7px',
                          borderRadius: 4, whiteSpace: 'nowrap',
                        }}>
                          HOJE
                        </div>
                      )}
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginBottom: 2, fontWeight: 500 }}>
                        {format(d, 'EEE', { locale: ptBR })}
                      </div>
                      <div style={{
                        fontSize: '1.15rem', fontWeight: 700,
                        color: selectedDate === date ? 'var(--gold-500)' : 'var(--text-primary)',
                        lineHeight: 1.3,
                      }}>
                        {format(d, 'dd')}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'capitalize', fontWeight: 500 }}>
                        {format(d, 'MMM', { locale: ptBR })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedDate && (
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Clock size={13} /> Horários
                  </label>
                  {loadingTimes ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                      <div className="spinner" style={{ margin: '0 auto' }} />
                    </div>
                  ) : availableTimes.length === 0 ? (
                    <p style={{ color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                      Nenhum horário disponível nesta data.
                    </p>
                  ) : (
                    <div className="times-grid">
                      {availableTimes.map(t => (
                        <div
                          key={t}
                          onClick={() => setSelectedTime(t)}
                          className="card selectable-card"
                          style={{
                            padding: '0.75rem 0.3rem', textAlign: 'center', cursor: 'pointer',
                            fontWeight: 600, fontSize: '0.9rem', borderRadius: 'var(--radius-md)',
                            fontFamily: 'var(--font-display)', minHeight: '44px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: selectedTime === t ? 'var(--gold-500)' : 'var(--text-primary)',
                          }}
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

        <div className="card">
          <div className="step-indicator">
            <span className="step-number">3</span>
            <span className="step-label">Seus Dados</span>
          </div>
          <div className="input-group">
            <label>
              <User size={12} style={{ marginRight: 3, verticalAlign: 'middle' }} />
              Nome Completo
            </label>
            <input type="text" className="input" placeholder="Seu nome"
              value={clientName} onChange={e => setClientName(e.target.value)} />
          </div>
          <div className="input-group">
            <label>WhatsApp</label>
            <input type="tel" className="input" placeholder="(00) 00000-0000"
              value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
          </div>
        </div>

        <div className="card" style={{
          border: '1px solid rgba(212,167,74,0.15)',
          background: 'linear-gradient(135deg, rgba(212,167,74,0.04), rgba(212,167,74,0.01))',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'var(--gold-gradient)', opacity: 0.5,
          }} />
          <h3 style={{
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem',
            borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.85rem',
          }}>
            Resumo do Pedido
          </h3>
          {selectedService ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Serviço</span>
                <strong style={{ fontSize: '0.85rem', textAlign: 'right', maxWidth: '60%' }}>{selectedService.name}</strong>
              </div>
              {selectedDate && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Data</span>
                  <strong style={{ fontSize: '0.85rem' }}>{format(new Date(selectedDate + 'T00:00:00'), "dd/MM/yyyy")}</strong>
                </div>
              )}
              {selectedTime && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Horário</span>
                  <strong style={{ fontSize: '0.85rem' }}>{selectedTime}</strong>
                </div>
              )}
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>Total</span>
                <strong style={{
                  fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)',
                  background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  R$ {selectedService.price.toFixed(2)}
                </strong>
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, textAlign: 'center', padding: '1rem 0' }}>
              Selecione um serviço
            </p>
          )}

          <button
            className="btn btn-primary"
            style={{
              width: '100%', marginTop: '1.25rem', opacity: canContinue ? 1 : 0.35,
            }}
            disabled={!canContinue}
            onClick={handleContinue}
          >
            Continuar <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
