import { Link, useLocation } from 'react-router-dom';
import { Scissors, LogIn } from 'lucide-react';

export function Header() {
  const location = useLocation();
  const isBarberArea = location.pathname.startsWith('/barber');

  return (
    <header className="header">
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Scissors color="var(--primary)" size={26} />
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Gold<span style={{ color: 'var(--primary)' }}>Cuts</span>
          </span>
        </Link>

        {!isBarberArea && (
          <Link to="/barber/login" className="btn btn-secondary" style={{ fontSize: '0.9rem' }}>
            <LogIn size={16} /> Área do Barbeiro
          </Link>
        )}
      </div>
    </header>
  );
}
