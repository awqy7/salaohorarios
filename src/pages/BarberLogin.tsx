import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, Eye, EyeOff, LogIn } from 'lucide-react';
import { supabase, supabaseAvailable } from '../lib/supabase';

export function BarberLogin() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (supabaseAvailable && supabase) {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError || !data.user) {
        setError('E-mail ou senha inválidos.');
        setIsLoading(false);
        return;
      }
      sessionStorage.setItem('barber_auth', 'true');
      navigate('/barber/dashboard');
    } else {
      setError('Supabase não configurado. Configure as variáveis de ambiente.');
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '380px', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--gold-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', boxShadow: '0 4px 16px rgba(212,167,74,0.2)',
          }}>
            <Scissors size={26} color="var(--text-inverse)" />
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>Área do Barbeiro</h2>
          <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-muted)' }}>Acesse o painel de controle</p>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-bg)', color: 'var(--danger)',
            padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.85rem',
            border: '1px solid rgba(248,113,113,0.15)',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>E-mail</label>
            <input type="email" className="input" value={email}
              onChange={e => setEmail(e.target.value)} required
              placeholder="admin@gmail.com" />
          </div>
          <div className="input-group">
            <label>Senha</label>
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} className="input" value={password}
                onChange={e => setPassword(e.target.value)} required placeholder="••••••" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  padding: 0, display: 'flex',
                }}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }} disabled={isLoading}>
            {isLoading ? 'Entrando...' : <><LogIn size={16} /> Entrar no Painel</>}
          </button>
        </form>
      </div>
    </div>
  );
}
