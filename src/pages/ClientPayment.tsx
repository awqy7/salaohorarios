import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, ArrowLeft, Copy, Upload, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { saveAppointment } from '../lib/db';
import type { Appointment } from '../types';

const DUMMY_PIX_KEY = '00020126580014br.gov.bcb.pix0136admin@barbearia.com520400005303986540510.005802BR5913Barbearia6008BRASILIA62070503***63041A2B';

export function ClientPayment() {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('booking_draft');
    if (raw) {
      setBookingData(JSON.parse(raw));
    } else {
      navigate('/');
    }
  }, [navigate]);

  if (!bookingData) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <p>Carregando...</p>
    </div>
  );

  const displayDate = format(new Date(bookingData.date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR });

  const handleCopyPix = () => {
    navigator.clipboard.writeText(DUMMY_PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePay = () => {
    if (!receiptFile) return;

    setIsProcessing(true);
    setTimeout(async () => {
      const newAppointment: Appointment = {
        id:          Math.random().toString(36).substring(2, 9),
        clientName:  bookingData.clientName,
        clientPhone: bookingData.clientPhone,
        serviceId:   bookingData.service.id,
        date:        bookingData.date,
        time:        bookingData.time,
        status:      'confirmed', // Pela lógica solicitada, confirma direto se tiver comprovante
        paid:        true,
        createdAt:   new Date().toISOString(),
      };

      try {
        await saveAppointment(newAppointment);
      } catch (e) {
        console.error(e);
      }

      sessionStorage.removeItem('booking_draft');
      sessionStorage.setItem('last_appointment', JSON.stringify(newAppointment));
      navigate('/success');
    }, 2000);
  };

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto' }}>
      <button className="btn btn-secondary" style={{ marginBottom: '1.5rem' }} onClick={() => navigate('/')}>
        <ArrowLeft size={18} /> Voltar
      </button>

      <div className="card animate-fade-in">
        <h2 style={{ textAlign: 'center', color: 'var(--primary)', marginBottom: '2rem' }}>
          Pagamento via PIX
        </h2>

        {/* Resumo */}
        <div style={{ background: 'var(--surface-light)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Resumo do Agendamento
          </h4>
          {[
            ['Serviço',  bookingData.service.name],
            ['Data',     `${displayDate} às ${bookingData.time}`],
            ['Cliente',  bookingData.clientName],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{k}</span>
              <strong>{v}</strong>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
            <span style={{ fontSize: '1.1rem' }}>Total a Pagar</span>
            <strong style={{ fontSize: '1.6rem', color: 'var(--primary)' }}>
              R$ {bookingData.service.price.toFixed(2)}
            </strong>
          </div>
        </div>

        {/* PIX QR e Código */}
        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--surface-light)', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <p style={{ margin: '0 0 1rem', color: 'var(--text-main)', fontWeight: 500 }}>
            Escaneie o QR Code ou copie o código abaixo:
          </p>
          
          <div style={{ background: 'white', padding: '10px', borderRadius: '8px', display: 'inline-block', marginBottom: '1.5rem' }}>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(DUMMY_PIX_KEY)}`}
              alt="QR Code PIX"
              style={{ width: '180px', height: '180px', display: 'block' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input 
              type="text" 
              className="input" 
              readOnly 
              value={DUMMY_PIX_KEY}
              style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}
            />
            <button 
              className="btn btn-primary" 
              style={{ padding: '0.875rem' }} 
              onClick={handleCopyPix}
              title="Copiar PIX"
            >
              {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
            </button>
          </div>
        </div>

        {/* Upload de Comprovante */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>Anexar Comprovante</h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            O agendamento só será confirmado após o envio do comprovante.
          </p>
          
          <label style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '2rem', border: '2px dashed var(--border)', borderRadius: '12px',
            cursor: 'pointer', transition: 'var(--transition)',
            background: receiptFile ? 'rgba(16, 185, 129, 0.05)' : 'var(--surface-light)',
            borderColor: receiptFile ? 'var(--success)' : 'var(--border)'
          }}>
            {receiptFile ? (
              <>
                <CheckCircle size={32} color="var(--success)" style={{ marginBottom: '0.5rem' }} />
                <span style={{ color: 'var(--success)', fontWeight: 500 }}>Comprovante anexado!</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{receiptFile.name}</span>
              </>
            ) : (
              <>
                <Upload size={32} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
                <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>Clique para escolher o arquivo</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>PNG, JPG ou PDF</span>
              </>
            )}
            <input 
              type="file" 
              accept="image/*,.pdf" 
              style={{ display: 'none' }} 
              onChange={e => setReceiptFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
          onClick={handlePay}
          disabled={!receiptFile || isProcessing}
        >
          {isProcessing ? '⏳ Confirmando Agendamento...' : 'Enviar Comprovante e Confirmar'}
        </button>
      </div>
    </div>
  );
}
