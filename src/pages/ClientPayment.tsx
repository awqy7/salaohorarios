import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { saveAppointment } from '../lib/db';

const BARBEIRO_PHONE = '5533998650331';

function getInitialBookingData() {
  const raw = sessionStorage.getItem('booking_draft');
  return raw ? JSON.parse(raw) : null;
}

export function ClientPayment() {
  const navigate = useNavigate();
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const [bookingData] = useState<any>(getInitialBookingData);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!bookingData) {
    navigate('/');
    return null;
  }

  const handleConfirmWhatsApp = async () => {
    setSaving(true);
    try {
      const appointment = {
        id: crypto.randomUUID(),
        clientName: bookingData.clientName,
        clientPhone: bookingData.clientPhone,
        serviceId: bookingData.service.id,
        date: bookingData.date,
        time: bookingData.time,
        status: 'pending' as const,
        paid: false,
        paymentProof: undefined,
        createdAt: new Date().toISOString(),
      };

      await saveAppointment(appointment);
      sessionStorage.removeItem('booking_draft');
      sessionStorage.setItem('last_appointment', JSON.stringify(appointment));

      // Criar mensagem personalizada
      const displayDate = format(
        new Date(bookingData.date + 'T00:00:00'),
        "dd 'de' MMMM 'de' yyyy",
        { locale: ptBR }
      );

      const message = `Olá! Gostaria de confirmar o agendamento\n\n*Dados do Agendamento*\nCliente: ${bookingData.clientName}\nServico: ${bookingData.service.name}\nData: ${displayDate}\nHorario: ${bookingData.time}\n\nPode confirmar?`;

      const whatsappUrl = `https://wa.me/${BARBEIRO_PHONE}?text=${encodeURIComponent(message)}`;

      setSaved(true);
      window.open(whatsappUrl, '_blank');
      setTimeout(() => navigate('/success'), 1500);
    } catch (err) {
      console.error('Erro ao confirmar:', err);
      setSaving(false);
    }
  };

  const displayDate = format(
    new Date(bookingData.date + 'T00:00:00'),
    "dd 'de' MMMM",
    { locale: ptBR }
  );

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto' }}>
      <button className="btn btn-ghost" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }} onClick={() => navigate('/')}>
        <ArrowLeft size={16} /> Voltar
      </button>
      <div className="card animate-fade-in" style={{ position: 'relative', overflow: 'hidden' }}>
        {saved && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(7,7,13,0.97)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={40} color="var(--success)" />
            </div>
            <h3 style={{ color: 'var(--success)', margin: 0, fontSize: '1.3rem' }}>Agendamento Confirmado!</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem' }}>Abrindo WhatsApp...</p>
          </div>
        )}

        <h2 style={{ textAlign: 'center', marginBottom: '0.75rem', fontSize: '1.4rem' }}>
          <span className="gold-text">Confirmar Agendamento</span>
        </h2>

        <div style={{ background: 'var(--surface-elevated)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: 'var(--text-primary)' }}>📋 Resumo do Agendamento</h3>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>👤 Cliente</span>
            <strong>{bookingData.clientName}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>💇 Serviço</span>
            <strong style={{ textAlign: 'right', maxWidth: '60%' }}>{bookingData.service.name}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>📅 Data</span>
            <strong>{displayDate}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>⏰ Horário</span>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--gold-500)' }}>{bookingData.time}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 0, fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>💰 Valor</span>
            <strong style={{ fontSize: '1rem', background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              R$ {bookingData.service.price.toFixed(2)}
            </strong>
          </div>
        </div>

        <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(212,167,74,0.08)', border: '1px solid rgba(212,167,74,0.15)', marginBottom: '1.5rem' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            ✨ Clique no botão abaixo para confirmar seu agendamento via <strong>WhatsApp</strong>. Você será redirecionado para conversar diretamente com nosso barbeiro.
          </p>
        </div>

        <button
          className="btn"
          style={{
            width: '100%',
            justifyContent: 'center',
            gap: '0.6rem',
            fontSize: '0.95rem',
            padding: '0.75rem 1.5rem',
            minHeight: '50px',
            opacity: saving ? 0.7 : 1,
            cursor: saving ? 'not-allowed' : 'pointer',
            background: '#25D366',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(37, 211, 102, 0.3)',
          }}
          disabled={saving}
          onClick={handleConfirmWhatsApp}
        >
          {saving ? (
            <>
              <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.2)' }} />
              Abrindo WhatsApp...
            </>
          ) : (
            <>
              <MessageCircle size={20} />
              Confirmar via WhatsApp
            </>
          )}
        </button>

        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem', marginBottom: 0 }}>
          Você será redirecionado para o WhatsApp para finalizar a confirmação
        </p>
      </div>
    </div>
  );
}