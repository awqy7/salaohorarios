import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, Eye, EyeOff } from 'lucide-react';
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
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('Falha no login: verifique seu e-mail e senha.');
        setIsLoading(false);
        return;
      }

      if (data.user) {
        sessionStorage.setItem('barber_auth', 'true');
        navigate('/barber/dashboard');
      }
    } else {
      // Fallback local caso o Supabase não esteja conectado
      if (email === 'admin@barbearia.com' && password === 'admin') {
        sessionStorage.setItem('barber_auth', 'true');
        navigate('/barber/dashboard');
      } else {
        setError('Credenciais inválidas. Tente novamente.');
      }
    }
    setIsLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Scissors size={48} color="var(--primary)" style={{ display: 'block', margin: '0 auto 1rem' }} />
          <h2 style={{ marginBottom: '0.25rem' }}>Área do Barbeiro</h2>
          <p style={{ margin: 0 }}>Acesso restrito</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', color: 'var(--danger)',
            padding: '0.875rem 1rem', borderRadius: '8px',
            marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>E-mail</label>
            <input type="email" className="input" value={email}
              onChange={e => setEmail(e.target.value)} required placeholder="admin@barbearia.com" />
          </div>
          <div className="input-group">
            <label>Senha</label>
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} className="input" value={password}
                onChange={e => setPassword(e.target.value)} required placeholder="••••••" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'Entrar no Painel'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '1.5rem', marginBottom: 0, color: 'var(--text-muted)' }}>
          Acesso com a conta do Supabase: admin@barbearia.com
        </p>
      </div>
    </div>
  );
}
