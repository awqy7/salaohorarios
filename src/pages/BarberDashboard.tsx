import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Users, Calendar, Settings, CheckCircle, BarChart2, LogOut, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAppointments, getSchedules, saveSchedules, services } from '../lib/db';
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
    loadData();
  }, [navigate]);

  const loadData = async () => {
    const [apps, scheds] = await Promise.all([getAppointments(), getSchedules()]);
    setAppointments(apps);
    setSchedules(scheds);
  };

  const handleSaveSchedule = async () => {
    setSaving(true);
    await saveSchedules(schedules);
    setSaving(false);
    alert('Horários salvos com sucesso!');
  };

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
            onClick={() => setActiveTab(key as any)}
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
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.05rem', margin: 0 }}>
              Todos os Agendamentos
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
            <p style={{ color: 'var(--text-muted)', padding: '2rem 1.5rem', margin: 0, textAlign: 'center' }}>
              Nenhum agendamento ainda.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Data', 'Horário', 'Cliente', 'WhatsApp', 'Serviço', 'Valor', 'Status'].map(h => (
                      <th key={h} style={{
                        padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600,
                        fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase',
                        letterSpacing: '0.05em', whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {confirmed.sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)).map(app => {
                    const svc = services.find(s => s.id === app.serviceId);
                    const displayDate = format(new Date(app.date + 'T00:00:00'), 'dd/MM/yyyy');
                    return (
                      <tr key={app.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>{displayDate}</td>
                        <td style={{
                          padding: '0.75rem 1rem', color: 'var(--gold-500)', fontWeight: 700,
                          fontFamily: 'var(--font-display)', fontSize: '0.95rem', whiteSpace: 'nowrap',
                        }}>
                          {app.time}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500, fontSize: '0.9rem' }}>{app.clientName}</td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{app.clientPhone}</td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}>{svc?.name || '—'}</td>
                        <td style={{
                          padding: '0.75rem 1rem', color: 'var(--gold-500)',
                          fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-display)',
                        }}>
                          R$ {svc?.price.toFixed(2) || '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {app.paid ? (
                            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={10} /> Pago
                            </span>
                          ) : (
                            <span className="badge badge-warning">Pendente</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>Horários de Trabalho</h3>
          <p style={{ marginBottom: '2rem', fontSize: '0.85rem' }}>
            Ative os dias e defina os horários de atendimento.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {schedules.map(schedule => (
              <div
                key={schedule.id}
                className="flex-responsive"
                style={{
                  alignItems: 'center', gap: '1rem',
                  padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)',
                  background: schedule.isWorking ? 'rgba(212,167,74,0.03)' : 'var(--surface-elevated)',
                  border: `1px solid ${schedule.isWorking ? 'rgba(212,167,74,0.1)' : 'var(--border)'}`,
                  transition: 'var(--transition)',
                }}
              >
                <input
                  type="checkbox"
                  checked={schedule.isWorking}
                  onChange={e => handleScheduleChange(schedule.id, 'isWorking', e.target.checked)}
                  style={{
                    width: '18px', height: '18px', accentColor: 'var(--gold-500)',
                    cursor: 'pointer', flexShrink: 0,
                  }}
                />

                <span style={{ minWidth: '90px', fontWeight: 600, fontSize: '0.9rem' }}>
                  {daysOfWeek[schedule.dayOfWeek]}
                </span>

                {schedule.isWorking ? (
                  <div className="flex-responsive" style={{ gap: '0.75rem', flex: 1, alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>De</span>
                      <input type="time" className="input"
                        value={schedule.startTime}
                        onChange={e => handleScheduleChange(schedule.id, 'startTime', e.target.value)}
                        style={{ padding: '0.4rem 0.6rem', width: 'auto', fontSize: '0.85rem' }}
                      />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Até</span>
                      <input type="time" className="input"
                        value={schedule.endTime}
                        onChange={e => handleScheduleChange(schedule.id, 'endTime', e.target.value)}
                        style={{ padding: '0.4rem 0.6rem', width: 'auto', fontSize: '0.85rem' }}
                      />
                    </label>
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>Folga</span>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSaveSchedule} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Horários'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
