import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css'; 
console.log('API_URL:', import.meta.env.VITE_API_URL);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // O hook navigate ainda existe, mas para o login vamos usar o window.location
  const navigate = useNavigate(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpa erros antigos

    try {
      // O backend espera { email, senha }
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        senha: password
      });

      // Salva o token e dados do usuário no navegador
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.usuario));

      // Configura o cabeçalho padrão para as próximas requisições
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

      console.log('Login realizado com sucesso!');

      // --- CORREÇÃO APLICADA AQUI ---
      // Usamos window.location.href em vez de navigate.
      // Isso força a página a recarregar, garantindo que o sistema "perceba" 
      // que o usuário está logado antes de entrar na tela de perfil.
      window.location.href = '/perfil'; 

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.erro || 'Falha ao conectar com o servidor.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-image-panel">
      </div>
      <div className="auth-form-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Login</h1>
          
          {error && <div className="error-message" style={{color: 'red', marginBottom: '15px'}}>{error}</div>}

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
            Não tem uma conta? <a href="/registro">Registrar</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;