import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Registro.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Registro = () => {
  const navigate = useNavigate();
  
  // Estado do formulário
  const [formData, setFormData] = useState({
    nome: '', email: '', senha: '', telefone: '', endereco: ''
  });
  
  // Estado separado para confirmação de senha (não enviamos isso pro back)
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // --- VALIDAÇÕES ---
    if (formData.senha !== confirmarSenha) {
      setError('As senhas não coincidem.');
      return;
    }

    if (formData.senha.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        return;
    }

    try {
      // Enviamos apenas o formData, sem o confirmarSenha
      await axios.post(`${API_URL}/api/auth/registro`, formData);
      alert('Conta criada com sucesso! Faça login para continuar.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao criar conta.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-image-panel"></div>
      
      <div className="auth-form-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Criar Conta</h1>

          {error && <div className="error-message">{error}</div>}

          <div className="input-group">
            <label>Nome Completo</label>
            <input 
                type="text" 
                name="nome" 
                value={formData.nome} 
                onChange={handleChange} 
                required 
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                required 
            />
          </div>

          <div className="input-group">
            <label>Senha</label>
            <input 
                type="password" 
                name="senha" 
                value={formData.senha} 
                onChange={handleChange} 
                required 
            />
          </div>

          {/* NOVO CAMPO DE CONFIRMAR SENHA */}
          <div className="input-group">
            <label>Confirmar Senha</label>
            <input 
                type="password" 
                name="confirmarSenha" 
                value={confirmarSenha} 
                onChange={(e) => setConfirmarSenha(e.target.value)} 
                required 
            />
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