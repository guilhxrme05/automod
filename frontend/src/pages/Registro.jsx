import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css'; // Reutiliza o mesmo CSS do login para manter padrão

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Registro = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    endereco: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Envia para a rota de registro que criamos no Node
      await axios.post(`${API_URL}/api/auth/registro`, formData);
      
      alert('Conta criada com sucesso! Faça login para continuar.');
      navigate('/login'); // Redireciona para o login

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.erro || 'Erro ao criar conta.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-image-panel">
        <span className="auth-logo">AUTOMOD</span>
      </div>
      <div className="auth-form-panel">
        <form className="auth-form" onSubmit={handleSubmit} style={{maxWidth: '400px'}}>
          <h1>Criar Conta</h1>

          {error && <div className="error-message" style={{color: 'red', marginBottom: '10px'}}>{error}</div>}
          
          <div className="input-group">
            <label htmlFor="nome">Nome Completo</label>
            <input type="text" name="nome" value={formData.nome} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label htmlFor="telefone">Telefone</label>
            <input type="text" name="telefone" value={formData.telefone} onChange={handleChange} placeholder="(XX) XXXXX-XXXX" />
          </div>

          <div className="input-group">
            <label htmlFor="endereco">Endereço</label>
            <input type="text" name="endereco" value={formData.endereco} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label htmlFor="senha">Senha</label>
            <input type="password" name="senha" value={formData.senha} onChange={handleChange} required />
          </div>

          <button type="submit" className="auth-button">CADASTRAR</button>

          <p className="auth-link">
            Já tem conta? <a href="/login">Fazer Login</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Registro;