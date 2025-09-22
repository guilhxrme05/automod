import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'; // Ficheiro CSS para ajustes globais de layout

// --- Importe os seus componentes ---
import Navbar from './components/Navbar'; // 1. Importa a Navbar
import Home from './pages/Home';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Personalizacao from './pages/Personalizacao';
import Registro from './pages/Registro';
import Contato from './pages/Contato';
import Perfil from './pages/Perfil';

function App() {
  return (
    <Router>
      {/* 2. Coloca a Navbar aqui, fora das rotas */}
      <Navbar />
      
      {/* 3. Um contentor para o conteúdo da página, para evitar que fique por baixo da navbar */}
      <main className="page-content">
        <Routes>
          <Route path="/" element={<Landing />} />          
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/personalizar/:carId" element={<Personalizacao />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/perfil" element={<Perfil />} />
          {/* Adicione a rota do carrinho aqui se já a tiver */}
        </Routes>
      </main>
    </Router>
  );
}

export default App;

