import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
      <main className="container" style={{ padding: '2rem 1.5rem' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/payment" element={<ClientPayment />} />
          <Route path="/success" element={<ClientSuccess />} />
          <Route path="/barber/login" element={<BarberLogin />} />
          <Route path="/barber/dashboard" element={<BarberDashboard />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
