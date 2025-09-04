// src/components/Login.jsx

import React, { useState } from 'react';
import './Login.css'; // Reutilizando o mesmo CSS

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Lógica para enviar os dados de login para a API
    console.log('Dados de Login:', { email, password });
  };

  return (
    <div className="auth-container">
      <div className="auth-image-panel">
        <span className="auth-logo">AUTOMOD</span>
      </div>
      <div className="auth-form-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Login</h1>
          
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Senha</label>
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="auth-button">ENTRAR</button>

          <p className="auth-link">
            Não tem uma conta? <a href="/register">Registrar</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;