import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, CheckCircle, Clock, Smartphone, AlertCircle, RefreshCw, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Appointment } from '../types';

export function ClientPayment() {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState<any>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(true);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string>('');
  const [appointmentId, setAppointmentId] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [qrCodeBase64, setQrCodeBase64] = useState<string>('');
  const [ticketUrl, setTicketUrl] = useState<string>('');
  const [isSimulated, setIsSimulated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentApproved, setPaymentApproved] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(600);

  const pollingIntervalRef = useRef<any>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('booking_draft');
    if (raw) {
      const parsed = JSON.parse(raw);
      setBookingData(parsed);
      generateRealPayment(parsed);
    } else {
      navigate('/');
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [navigate]);

  useEffect(() => {
    if (isCreatingPayment || paymentError || secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isCreatingPayment, paymentError, secondsLeft]);

  const generateRealPayment = async (data: any) => {
    setIsCreatingPayment(true);
    setPaymentError(null);

    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: data.service, date: data.date, time: data.time,
          clientName: data.clientName, clientPhone: data.clientPhone,
        }),
      });

      if (!response.ok) throw new Error('Falha ao gerar o código de pagamento.');

      const resData = await response.json();

      if (resData.success) {
        setPaymentId(resData.payment_id);
        setAppointmentId(resData.appointment_id);
        setQrCode(resData.qr_code);
        setQrCodeBase64(resData.qr_code_base64);
        setTicketUrl(resData.ticket_url);
        setIsSimulated(resData.isSandbox || !resData.qr_code_base64);
        startPaymentPolling(resData.payment_id, resData.appointment_id);
      } else {
        throw new Error(resData.error || 'Erro desconhecido.');
      }
    } catch (err: any) {
      console.error(err);
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setPaymentError(
          'Dica: para testar localmente, rode "npx netlify dev" no terminal para ativar as funções /api/*. Ou publique no Netlify para funcionar diretamente.'
        );
      } else {
        setPaymentError('Não foi possível gerar o pagamento. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const startPaymentPolling = (pId: string, aId: string) => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    pollingIntervalRef.current = setInterval(async () => {
      await checkPaymentStatus(pId, aId, true);
    }, 5000);
  };

  const checkPaymentStatus = async (pId: string, aId: string, isAuto = false) => {
    if (!isAuto) setIsCheckingPayment(true);
    try {
      const response = await fetch(`/api/check-payment?payment_id=${pId}&appointment_id=${aId}`);
      if (!response.ok) throw new Error('Erro ao consultar status.');
      const data = await response.json();
      if (data.approved) {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        setPaymentApproved(true);
        setTimeout(() => {
          const finishedAppointment: Appointment = {
            id: aId, clientName: bookingData.clientName, clientPhone: bookingData.clientPhone,
            serviceId: bookingData.service.id, date: bookingData.date, time: bookingData.time,
            status: 'confirmed', paid: true, createdAt: new Date().toISOString(),
          };
          sessionStorage.removeItem('booking_draft');
          sessionStorage.setItem('last_appointment', JSON.stringify(finishedAppointment));
          navigate('/success');
        }, 1500);
      }
    } catch (err) {
      console.error('Erro ao verificar pagamento:', err);
    } finally {
      if (!isAuto) setIsCheckingPayment(false);
    }
  };

  const handleCopyPix = () => {
    if (!qrCode) return;
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!bookingData) return null;

  const displayDate = format(new Date(bookingData.date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR });

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto' }}>
      <button
        className="btn btn-ghost"
        style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
        onClick={() => navigate('/')}
        disabled={paymentApproved}
      >
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="card animate-fade-in" style={{ position: 'relative', overflow: 'hidden' }}>
        {paymentApproved && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(7, 7, 13, 0.97)', zIndex: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '1rem', animation: 'fadeIn 0.3s ease',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle size={40} color="var(--success)" />
            </div>
            <h3 style={{ color: 'var(--success)', margin: 0, fontSize: '1.3rem' }}>Pagamento Confirmado!</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem' }}>Redirecionando...</p>
          </div>
        )}

        <h2 style={{ textAlign: 'center', marginBottom: '1.25rem', fontSize: '1.4rem' }}>
          <span className="gold-text">Finalizar Pagamento</span>
        </h2>

        <div style={{
          background: 'var(--surface-elevated)', borderRadius: 'var(--radius-md)',
          padding: '1rem', marginBottom: '1.25rem', border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Serviço</span>
            <strong style={{ fontSize: '0.85rem', textAlign: 'right', maxWidth: '60%' }}>{bookingData.service.name}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Data</span>
            <strong>{displayDate} às {bookingData.time}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Cliente</span>
            <strong>{bookingData.clientName}</strong>
          </div>
          <div className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>Total a Pagar</span>
            <strong style={{
              fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-display)',
              background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              R$ {bookingData.service.price.toFixed(2)}
            </strong>
          </div>
        </div>

        {isCreatingPayment ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
            <div className="spinner" style={{ margin: '0 auto 1.25rem' }} />
            <p style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
              Gerando código PIX seguro...
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Conectando ao Mercado Pago
            </p>
          </div>
        ) : paymentError ? (
          <div style={{
            textAlign: 'center', padding: '1.5rem 1.25rem',
            background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(248,113,113,0.15)', marginBottom: '1.5rem',
          }}>
            <AlertCircle size={32} color="var(--danger)" style={{ margin: '0 auto 0.75rem' }} />
            <h4 style={{ color: 'var(--danger)', marginBottom: '0.35rem', fontSize: '0.95rem' }}>Erro ao Gerar Pagamento</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>{paymentError}</p>
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => generateRealPayment(bookingData)}
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.35rem 0.85rem', borderRadius: 9999,
                background: 'rgba(212,167,74,0.06)', border: '1px solid rgba(212,167,74,0.12)',
                fontSize: '0.75rem', color: 'var(--gold-500)', fontWeight: 500, marginBottom: '1rem',
              }}>
                <Clock size={13} />
                Expira em: <strong>{formatTimeLeft(secondsLeft)}</strong>
              </div>

              <div style={{
                background: 'white', padding: '10px', borderRadius: 'var(--radius-md)',
                display: 'inline-block', marginBottom: '0.85rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              }}>
                {qrCodeBase64 ? (
                  <img
                    src={`data:image/png;base64,${qrCodeBase64}`}
                    alt="QR Code PIX"
                    style={{ width: '160px', height: '160px', display: 'block', borderRadius: '4px' }}
                  />
                ) : (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrCode)}`}
                    alt="QR Code PIX"
                    style={{ width: '160px', height: '160px', display: 'block', borderRadius: '4px' }}
                  />
                )}
              </div>

              {isSimulated && (
                <div style={{
                  fontSize: '0.7rem', color: 'var(--gold-500)',
                  background: 'rgba(212,167,74,0.08)', padding: '0.25rem 0.7rem',
                  borderRadius: 6, display: 'inline-block', marginBottom: '0.75rem',
                  border: '1px solid rgba(212,167,74,0.1)',
                }}>
                  Modo Demonstração
                </div>
              )}

              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 0 }}>
                Escaneie o QR Code com o app do seu banco
              </p>
            </div>

            <div style={{
              display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem',
            }}>
              <input
                type="text" className="input" readOnly value={qrCode}
                style={{
                  fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--surface)',
                  cursor: 'text', padding: '0.75rem', wordBreak: 'break-all',
                }}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                className={`btn ${copied ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: '100%', justifyContent: 'center', gap: '0.4rem' }}
                onClick={handleCopyPix}
              >
                {copied ? <><CheckCircle size={16} /> Copiado</> : <><Copy size={16} /> Copiar código PIX</>}
              </button>
            </div>

            {ticketUrl && (
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <a href={ticketUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '0.8rem', color: 'var(--gold-500)', textDecoration: 'underline', fontWeight: 500 }}>
                  Pagar pelo link do Mercado Pago
                </a>
              </div>
            )}

            <div style={{
              padding: '1rem', borderRadius: 'var(--radius-md)',
              background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: '0.75rem',
              alignItems: 'center', textAlign: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(212,167,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Smartphone size={14} color="var(--gold-500)" />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Aguardando pagamento...
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Assim que o pagamento for confirmado, seu agendamento será automaticamente aprovado.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <Shield size={11} /> Pagamento 100% seguro via Mercado Pago
              </div>
              <button
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.85rem' }}
                onClick={() => checkPaymentStatus(paymentId, appointmentId)}
                disabled={isCheckingPayment}
              >
                <RefreshCw size={14} className={isCheckingPayment ? 'animate-spin' : ''} />
                {isCheckingPayment ? 'Verificando...' : 'Já paguei — verificar agora'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
