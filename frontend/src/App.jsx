import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // <--- IMPORTANTE: Importar o Provider
import './App.css'; 

// --- Importe os seus componentes ---
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Personalizacao from './pages/Personalizacao';
import Registro from './pages/Registro';
import Contato from './pages/Contato';
import Perfil from './pages/Perfil';
import Estoque from './pages/Estoque';

function App() {
  return (
    <Router>
      {/* O AuthProvider deve envolver tudo que precisa saber quem é o usuário */}
      <AuthProvider>
        
        {/* Navbar dentro do Provider para poder mostrar "Olá, Gui" ou botão de Sair */}
        <Navbar />
        
        <main className="page-content">
          <Routes>
            <Route path="/" element={<Landing />} />          
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/personalizar/:carId" element={<Personalizacao />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/contato" element={<Contato />} />
            
            {/* Agora a página Perfil consegue acessar o contexto sem dar erro */}
            <Route path="/perfil" element={<Perfil />} />
            
            <Route path="/estoque" element={<Estoque />} />
          </Routes>
        </main>

      </AuthProvider>
    </Router>
  );
}

export default App;