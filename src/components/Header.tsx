import { Link } from 'react-router-dom';
import { Scissors } from 'lucide-react';

export function Header() {
  return (
    <header className="header">
      <div className="container header-inner" style={{ justifyContent: 'center' }}>
        <Link to="/" className="header-logo">
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--gold-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(212,167,74,0.25)',
          }}>
            <Scissors size={20} color="var(--text-inverse)" />
          </div>
          <span className="header-logo-text" style={{ fontSize: '1.25rem' }}>
            Gold<span>Cuts</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
