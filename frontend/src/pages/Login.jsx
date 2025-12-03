import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css'; // Certifique-se que o CSS está importado

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpa erros antigos

    try {
      // O backend espera { email, senha } conforme seu código anterior
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
      navigate('/perfil'); // Redireciona para a tela de perfil ou home

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.erro || 'Falha ao conectar com o servidor.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-image-panel">
        <span className="auth-logo">AUTOMOD</span>
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