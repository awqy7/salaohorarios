import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, CheckCircle, FileText, Upload, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { saveAppointment } from '../lib/db';

const PIX_KEY = 'chave@goldcuts.com.br';

function getInitialBookingData() {
  const raw = sessionStorage.getItem('booking_draft');
  return raw ? JSON.parse(raw) : null;
}

export function ClientPayment() {
  const navigate = useNavigate();
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const [bookingData] = useState<any>(getInitialBookingData);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!bookingData) {
    navigate('/');
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = () => setProofPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    if (!proofFile || !bookingData || !proofPreview) return;
    setSaving(true);
    try {
      const appointment = {
        id: crypto.randomUUID(),
        clientName: bookingData.clientName,
        clientPhone: bookingData.clientPhone,
        serviceId: bookingData.service.id,
        date: bookingData.date,
        time: bookingData.time,
        status: 'confirmed' as const,
        paid: true,
        paymentProof: proofPreview,
        createdAt: new Date().toISOString(),
      };
      await saveAppointment(appointment);
      sessionStorage.removeItem('booking_draft');
      sessionStorage.setItem('last_appointment', JSON.stringify(appointment));
      setSaved(true);
      setTimeout(() => navigate('/success'), 500);
    } catch (err) {
      console.error('Erro ao salvar:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!bookingData) return null;

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
            <h3 style={{ color: 'var(--success)', margin: 0, fontSize: '1.3rem' }}>Pagamento Registrado!</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem' }}>Redirecionando...</p>
          </div>
        )}
        <h2 style={{ textAlign: 'center', marginBottom: '0.75rem', fontSize: '1.4rem' }}>
          <span className="gold-text">Finalizar Pagamento</span>
        </h2>
        <div style={{ background: 'var(--surface-elevated)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
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
            <strong style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-display)', background: 'var(--gold-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              R$ {bookingData.service.price.toFixed(2)}
            </strong>
          </div>
        </div>
        <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Pague via PIX para a chave abaixo:</div>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '0.75rem', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--gold-500)', wordBreak: 'break-all', marginBottom: '0.75rem', border: '1px solid var(--border)' }}>
            {PIX_KEY}
          </div>
          <button className={`btn ${copied ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', justifyContent: 'center', gap: '0.4rem' }} onClick={handleCopyPix}>
            {copied ? (<><CheckCircle size={16} /> Copiado</>) : (<><Copy size={16} /> Copiar Chave PIX</>)}
          </button>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>Após pagar, tire um print ou faça upload do comprovante abaixo</p>
        </div>
        <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: `1px dashed ${proofPreview ? 'var(--gold-500)' : 'var(--border)'}`, marginBottom: '1.25rem', textAlign: 'center' }}>
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />
          {proofPreview ? (
            <div style={{ marginBottom: '0.75rem' }}>
              {proofFile?.type === 'application/pdf' ? (
                <div style={{ width: 64, height: 64, margin: '0 auto 0.5rem', background: 'rgba(212,167,74,0.1)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={32} color="var(--gold-500)" />
                </div>
              ) : (
                <img src={proofPreview} alt="Comprovante" style={{ width: '100%', maxHeight: 180, objectFit: 'contain', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem' }} />
              )}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                <CheckCircle size={12} color="var(--success)" /> Comprovante anexado
              </div>
            </div>
          ) : (
            <div onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer', padding: '1rem 0' }}>
              <Upload size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '0.85rem' }}>Anexar Comprovante</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>PDF ou imagem (print do PIX)</p>
            </div>
          )}
          {proofPreview && (
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', marginTop: '0.5rem' }} onClick={() => fileInputRef.current?.click()}>Trocar arquivo</button>
          )}
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', opacity: !proofPreview || saving ? 0.5 : 1 }} disabled={!proofPreview || saving} onClick={handleConfirm}>
          {saving ? (<><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Salvando...</>) : (<><CheckCircle size={16} /> Confirmar Pagamento</>)}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <Shield size={11} /> Pagamento confirmado automaticamente
        </div>
      </div>
    </div>
  );
}