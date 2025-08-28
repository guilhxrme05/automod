import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

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
      <Routes>
        <Route path="/" element={<Landing />} />           
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/personalizacao" element={<Personalizacao />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/contato" element={<Contato />} />
        <Route path="/perfil" element={<Perfil />} />
      </Routes>
    </Router>
  );
}

export default App;
