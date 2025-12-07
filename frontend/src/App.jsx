import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './App.css';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Personalizacao from './pages/Personalizacao';
import Registro from './pages/Registro';
import Contato from './pages/Contato';
import Perfil from './pages/Perfil';
import Estoque from './pages/Estoque';

// Componente pequeno pra detectar a rota atual
function MainContent() {
  const location = useLocation();
  const isHome = location.pathname === '/home';

  return (
    <main className={`page-content ${isHome ? 'home-scroll' : ''}`}>
      <Routes>
        <Route path="/" element={<Landing />} />          
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/personalizar/:carId" element={<Personalizacao />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/contato" element={<Contato />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/estoque" element={<Estoque />} />
      </Routes>
    </main>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <MainContent />          {/* <-- agora controla o scroll com classe */}
      </AuthProvider>
    </Router>
  );
}

export default App;