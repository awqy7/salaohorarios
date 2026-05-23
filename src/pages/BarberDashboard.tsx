import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Users, Calendar, Settings, CheckCircle, BarChart2, LogOut, Clock, TrendingUp, Eye, X } from 'lucide-react';
import { format } from 'date-fns';

import { getAppointments, getSchedules, saveSchedules, saveAppointment, services } from '../lib/db';
import type { Appointment, BarberSchedule } from '../types';

const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function BarberDashboard() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [schedules, setSchedules]       = useState<BarberSchedule[]>([]);
  const [activeTab, setActiveTab]       = useState<'overview' | 'appointments' | 'schedule'>('overview');
  const [saving, setSaving]             = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem('barber_auth')) {
      navigate('/barber/login');
      return;
    }
    const load = async () => {
      const [apps, scheds] = await Promise.all([getAppointments(), getSchedules()]);
      setAppointments(apps);
      setSchedules(scheds);
    };
    load();
    const interval = setInterval(load, 15_000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleReject = async (app: Appointment) => {
    const updated = { ...app, status: 'cancelled' as const };
    await saveAppointment(updated);
    setAppointments(prev => prev.map(a => a.id === app.id ? updated : a));
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    const fixed = schedules.map(s => ({ ...s, lunchStart: '12:00', lunchEnd: '13:00' }));
    setSchedules(fixed);
    await saveSchedules(fixed);
    setSaving(false);
    alert('Horários salvos com sucesso!');
  };

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const handleScheduleChange = (id: string, field: keyof BarberSchedule, value: any) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleLogout = () => {
    sessionStorage.removeItem('barber_auth');
    navigate('/');
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const confirmed = appointments.filter(a => a.status !== 'cancelled');
  const todayApps = confirmed.filter(a => a.date === todayStr).sort((a, b) => a.time.localeCompare(b.time));
  const totalRev = confirmed.filter(a => a.paid).reduce((acc, app) => {
    const svc = services.find(s => s.id === app.serviceId);
    return acc + (svc?.price || 0);
  }, 0);

  const revenueByService = services.map(svc => ({
    ...svc,
    count: confirmed.filter(a => a.serviceId === svc.id).length,
    revenue: confirmed.filter(a => a.serviceId === svc.id && a.paid).reduce((acc) => acc + svc.price, 0),
  })).sort((a, b) => b.revenue - a.revenue);

  const maxRevenue = Math.max(...revenueByService.map(s => s.revenue), 1);

  const tabs = [
    { key: 'overview',     label: 'Dashboard',   Icon: BarChart2 },
    { key: 'appointments', label: 'Agendamentos', Icon: Calendar },
    { key: 'schedule',     label: 'Horários',     Icon: Settings },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
          <span className="gold-text">Painel do Barbeiro</span>
        </h2>
        <button className="btn btn-ghost" onClick={handleLogout} style={{ fontSize: '0.85rem' }}>
          <LogOut size={16} /> Sair
        </button>
      </div>

      <div style={{
        display: 'flex', gap: '0.4rem', marginBottom: '1.5rem',
        borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem',
        overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
      }}>
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`btn ${activeTab === key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab(key as 'overview' | 'appointments' | 'schedule')}
            style={{ fontSize: '0.8rem', padding: '0.6rem 1rem', whiteSpace: 'nowrap', minHeight: '40px' }}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="responsive-grid-3" style={{ marginBottom: '2rem' }}>
            {[
              { label: 'Faturamento', value: `R$ ${totalRev.toFixed(2)}`, Icon: DollarSign, color: 'var(--gold-500)' },
              { label: 'Clientes', value: String(confirmed.length), Icon: Users, color: 'var(--success)' },
              { label: 'Hoje', value: String(todayApps.length), Icon: Clock, color: '#60a5fa' },
            ].map(({ label, value, Icon, color }) => (
              <div key={label} className="card stat-card">
                <div className="stat-icon" style={{ background: `${color}12` }}>
                  <Icon size={24} color={color} />
                </div>
                <div>
                  <div className="stat-label">{label}</div>
                  <h3 className="stat-value" style={{ color }}>{value}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.05rem' }}>
              <TrendingUp size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle', color: 'var(--gold-500)' }} />
              Faturamento por Serviço
            </h3>
            {revenueByService.map(svc => (
              <div key={svc.id} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{svc.name}</span>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{svc.count}x</span>
                    <strong style={{ color: 'var(--gold-500)', fontSize: '0.9rem', minWidth: '70px', textAlign: 'right' }}>
                      R$ {svc.revenue.toFixed(2)}
                    </strong>
                  </div>
                </div>
                <div style={{
                  height: 4, background: 'var(--surface-elevated)', borderRadius: 2, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    width: `${(svc.revenue / maxRevenue) * 100}%`,
                    background: 'var(--gold-gradient)',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            ))}
            {revenueByService.every(s => s.count === 0) && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhum agendamento ainda.</p>
            )}
          </div>
        </>
      )}

      {activeTab === 'appointments' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', margin: 0 }}>
              Agendamentos
              <span style={{
                marginLeft: '0.5rem', fontSize: '0.75rem', fontWeight: 600,
                color: 'var(--gold-500)', background: 'rgba(212,167,74,0.08)',
                padding: '2px 10px', borderRadius: 9999,
              }}>
                {confirmed.length}
              </span>
            </h3>
          </div>

          {confirmed.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <Calendar size={48} color="var(--text-muted)" style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Nenhum agendamento ainda.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {confirmed.sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)).map(app => {
                const svc = services.find(s => s.id === app.serviceId);
                const displayDate = format(new Date(app.date + 'T00:00:00'), 'dd/MM');
                const isConfirmed = app.status === 'confirmed';
                return (
                  <div key={app.id} className="card" style={{
                    padding: '1rem',
                    borderLeft: `3px solid ${isConfirmed ? 'var(--success)' : 'var(--text-muted)'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.15rem' }}>
                          {app.clientName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {app.clientPhone}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontFamily: 'var(--font-display)', fontWeight: 700,
                          fontSize: '1rem', color: 'var(--gold-500)',
                        }}>
                          {app.time}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {displayDate}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                      <span className="badge" style={{
                        background: 'rgba(212,167,74,0.06)', color: 'var(--text-secondary)',
                        border: '1px solid var(--border)', fontSize: '0.65rem',
                      }}>
                        {svc?.name || '—'}
                      </span>
                      <span className="badge" style={{
                        background: 'rgba(212,167,74,0.06)', color: 'var(--gold-500)',
                        border: '1px solid var(--border)', fontSize: '0.65rem',
                      }}>
                        R$ {svc?.price.toFixed(2) || '—'}
                      </span>
                      {app.paid ? (
                        <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                          <CheckCircle size={8} /> Pago
                        </span>
                      ) : (
                        <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Pendente</span>
                      )}
                      {isConfirmed && (
                        <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Confirmado</span>
                      )}
                      {app.status === 'cancelled' && (
                        <span className="badge" style={{
                          background: 'var(--danger-bg)', color: 'var(--danger)',
                          border: '1px solid rgba(248,113,113,0.15)', fontSize: '0.65rem',
                        }}>Recusado</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {app.paymentProof && (
                        <button className="btn btn-ghost"
                          style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', minHeight: 0 }}
                          onClick={() => window.open(app.paymentProof, '_blank')}>
                          <Eye size={11} /> Comprovante
                        </button>
                      )}
                      {isConfirmed && (
                        <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto' }}>
                          <button className="btn btn-ghost"
                            style={{ color: 'var(--danger)', fontSize: '0.7rem', padding: '0.3rem 0.6rem', minHeight: 0 }}
                            onClick={() => handleReject(app)}>
                            <X size={11} /> Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="card" style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.15rem' }}>Horários de Trabalho</h3>
          <p style={{ marginBottom: '1.25rem', fontSize: '0.8rem' }}>
            Almoço fixo das <strong>12:00</strong> às <strong>13:00</strong>
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {schedules.map(schedule => (
              <div
                key={schedule.id}
                style={{
                  display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.6rem',
                  padding: '0.7rem 0.85rem', borderRadius: 'var(--radius-md)',
                  background: schedule.isWorking ? 'rgba(212,167,74,0.03)' : 'var(--surface-elevated)',
                  border: `1px solid ${schedule.isWorking ? 'rgba(212,167,74,0.1)' : 'var(--border)'}`,
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', flex: '1 1 100%' }}>
                  <input
                    type="checkbox"
                    checked={schedule.isWorking}
                    onChange={e => handleScheduleChange(schedule.id, 'isWorking', e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--gold-500)', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    {daysOfWeek[schedule.dayOfWeek]}
                  </span>
                </label>

                {schedule.isWorking && (
                  <div style={{
                    display: 'flex', gap: '0.5rem', width: '100%',
                    flexDirection: 'row', flexWrap: 'wrap',
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: '1 1 auto', minWidth: 0 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>De</span>
                      <input type="time" className="input"
                        value={schedule.startTime}
                        onChange={e => handleScheduleChange(schedule.id, 'startTime', e.target.value)}
                        style={{ padding: '0.5rem 0.6rem', fontSize: '0.85rem', minHeight: 40, width: '100%' }}
                      />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: '1 1 auto', minWidth: 0 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Até</span>
                      <input type="time" className="input"
                        value={schedule.endTime}
                        onChange={e => handleScheduleChange(schedule.id, 'endTime', e.target.value)}
                        style={{ padding: '0.5rem 0.6rem', fontSize: '0.85rem', minHeight: 40, width: '100%' }}
                      />
                    </label>
                  </div>
                )}

                {!schedule.isWorking && (
                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem', marginLeft: '1.6rem' }}>Folga</span>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSaveSchedule} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Horários'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
