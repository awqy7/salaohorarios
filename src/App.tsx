import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Scissors, LogIn } from 'lucide-react';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { ClientPayment } from './pages/ClientPayment';
import { ClientSuccess } from './pages/ClientSuccess';
import { BarberLogin } from './pages/BarberLogin';
import { BarberDashboard } from './pages/BarberDashboard';

function App() {
  return (
    <Router>
      <Header />
      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem', flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/payment" element={<ClientPayment />} />
          <Route path="/success" element={<ClientSuccess />} />
          <Route path="/barber/login" element={<BarberLogin />} />
          <Route path="/barber/dashboard" element={<BarberDashboard />} />
        </Routes>
      </main>
      <footer style={{
        padding: '1.5rem 1rem',
        borderTop: '1px solid var(--border)',
        textAlign: 'center',
      }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/barber/login"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              fontSize: '0.75rem', color: 'var(--text-muted)',
              textDecoration: 'none', transition: 'color 0.2s',
              padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--gold-500)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <LogIn size={12} /> Área do Barbeiro
          </Link>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0 }}>
            &copy; {new Date().getFullYear()} GoldCuts — Agendamento Premium
          </p>
        </div>
      </footer>
    </Router>
  );
}

export default App;
