

import React, { useState } from 'react';
import './Login.css'; 

const Register = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('Dados de Registro:', { email, name, password });
  };

  return (
    <div className="auth-container">
      <div className="auth-image-panel">
        <span className="auth-logo">AUTOMOD</span>
      </div>
      <div className="auth-form-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Registro</h1>
          
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
            <label htmlFor="name">Nome</label>
            <input 
              type="text" 
              id="name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
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

          <button type="submit" className="auth-button">REGISTRAR</button>

          <p className="auth-link">
            Já tem uma conta? <a href="/login">Entrar</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;