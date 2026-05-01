import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Users, Calendar, Settings, CheckCircle, BarChart2, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAppointments, getSchedules, saveSchedules, services } from '../lib/db';
import type { Appointment, BarberSchedule } from '../types';

const daysOfWeek = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

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
    alert('✅ Horários salvos com sucesso!');
  };

  const handleScheduleChange = (id: string, field: keyof BarberSchedule, value: any) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleLogout = () => {
    sessionStorage.removeItem('barber_auth');
    navigate('/');
  };

  // Stats
  const todayStr    = format(new Date(), 'yyyy-MM-dd');
  const confirmed   = appointments.filter(a => a.status !== 'cancelled');
  const todayApps   = confirmed.filter(a => a.date === todayStr).sort((a, b) => a.time.localeCompare(b.time));
  const totalRev    = confirmed.filter(a => a.paid).reduce((acc, app) => {
    const svc = services.find(s => s.id === app.serviceId);
    return acc + (svc?.price || 0);
  }, 0);

  // Revenue per service
  const revenueByService = services.map(svc => ({
    ...svc,
    count: confirmed.filter(a => a.serviceId === svc.id).length,
    revenue: confirmed.filter(a => a.serviceId === svc.id && a.paid).reduce((acc) => acc + svc.price, 0),
  })).sort((a, b) => b.revenue - a.revenue);

  const tabs = [
    { key: 'overview',     label: 'Dashboard',   Icon: BarChart2  },
    { key: 'appointments', label: 'Agendamentos', Icon: Calendar   },
    { key: 'schedule',     label: 'Meus Horários',Icon: Settings   },
  ];

  return (
    <div className="animate-fade-in">
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>✂ Painel do Barbeiro</h2>
        <button className="btn btn-secondary" onClick={handleLogout}>
          <LogOut size={18} /> Sair
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`btn ${activeTab === key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab(key as any)}
          >
            <Icon size={18} /> {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <>
          {/* Stat cards */}
          <div className="responsive-grid-3" style={{ marginBottom: '2rem' }}>
            {[
              { label: 'Faturamento Total', value: `R$ ${totalRev.toFixed(2)}`, Icon: DollarSign, color: 'var(--primary)' },
              { label: 'Clientes Confirmados', value: String(confirmed.length), Icon: Users, color: 'var(--success)' },
              { label: 'Agendamentos Hoje', value: String(todayApps.length), Icon: Calendar, color: '#60a5fa' },
            ].map(({ label, value, Icon, color }) => (
              <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ padding: '1rem', background: `${color}18`, borderRadius: '12px', flexShrink: 0 }}>
                  <Icon size={30} color={color} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>{label}</p>
                  <h3 style={{ margin: 0, color }}>{value}</h3>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue by service */}
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Faturamento por Serviço</h3>
            {revenueByService.map(svc => (
              <div key={svc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                <span>{svc.name}</span>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{svc.count} atendimento(s)</span>
                  <strong style={{ color: 'var(--primary)', minWidth: '80px', textAlign: 'right' }}>R$ {svc.revenue.toFixed(2)}</strong>
                </div>
              </div>
            ))}
            {revenueByService.every(s => s.count === 0) && (
              <p style={{ color: 'var(--text-muted)' }}>Nenhum agendamento ainda.</p>
            )}
          </div>
        </>
      )}

      {/* ── APPOINTMENTS ── */}
      {activeTab === 'appointments' && (
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>
            Todos os Agendamentos ({confirmed.length})
          </h3>

          {confirmed.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Nenhum agendamento ainda.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    {['Data', 'Horário', 'Cliente', 'WhatsApp', 'Serviço', 'Valor', 'Status'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 0.5rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {confirmed.sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)).map(app => {
                    const svc = services.find(s => s.id === app.serviceId);
                    const displayDate = format(new Date(app.date + 'T00:00:00'), 'dd/MM/yyyy');
                    return (
                      <tr key={app.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{displayDate}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--primary)', fontWeight: 700 }}>{app.time}</td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>{app.clientName}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{app.clientPhone}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{svc?.name || '—'}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--primary)', fontWeight: 700 }}>R$ {svc?.price.toFixed(2) || '—'}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          {app.paid ? (
                            <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                              <CheckCircle size={12} /> Pago
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

      {/* ── SCHEDULE ── */}
      {activeTab === 'schedule' && (
        <div className="card">
          <h3 style={{ marginBottom: '0.5rem' }}>Configurar Horários de Trabalho</h3>
          <p style={{ marginBottom: '2rem' }}>Ative os dias que você trabalha e defina os horários de início e fim.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {schedules.map(schedule => (
              <div
                key={schedule.id}
                className="flex-responsive"
                style={{
                  alignItems: 'center', gap: '1rem',
                  padding: '1rem 1.25rem', borderRadius: '12px',
                  background: schedule.isWorking ? 'rgba(212,175,55,0.06)' : 'var(--surface-light)',
                  border: `1px solid ${schedule.isWorking ? 'var(--primary)' : 'var(--border)'}`,
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Toggle */}
                <input
                  type="checkbox"
                  checked={schedule.isWorking}
                  onChange={e => handleScheduleChange(schedule.id, 'isWorking', e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--primary)', cursor: 'pointer', flexShrink: 0 }}
                />

                {/* Day name */}
                <span style={{ minWidth: '90px', fontWeight: 600 }}>
                  {daysOfWeek[schedule.dayOfWeek]}
                </span>

                {schedule.isWorking ? (
                  <div className="flex-responsive" style={{ gap: '1rem', flex: 1, alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>De</span>
                      <input
                        type="time"
                        className="input"
                        value={schedule.startTime}
                        onChange={e => handleScheduleChange(schedule.id, 'startTime', e.target.value)}
                        style={{ padding: '0.5rem 0.75rem', width: 'auto' }}
                      />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Até</span>
                      <input
                        type="time"
                        className="input"
                        value={schedule.endTime}
                        onChange={e => handleScheduleChange(schedule.id, 'endTime', e.target.value)}
                        style={{ padding: '0.5rem 0.75rem', width: 'auto' }}
                      />
                    </label>
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Folga</span>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSaveSchedule} disabled={saving}>
              {saving ? 'Salvando...' : '💾 Salvar Horários'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
