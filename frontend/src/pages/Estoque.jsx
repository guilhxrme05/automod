import React, { useState, useEffect } from 'react';
import './Estoque.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Estoque = () => {
  const [cores, setCores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [novoNome, setNovoNome] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/estoque/cores-chassis`)
      .then(r => r.json())
      .then(data => {
        setCores(data);
        setLoading(false);
      });
  }, []);

  const repor = (id) => {
    setCores(prev => prev.map(c => 
      c.id === id ? { ...c, quantidade: c.quantidade + 10 } : c
    ));
  };

  const salvarNome = (id) => {
    setCores(prev => prev.map(c => 
      c.id === id ? { ...c, nome: novoNome } : c
    ));
    setEditando(null);
    setNovoNome('');
  };

  const remover = (id) => {
    if (window.confirm('Remover esta cor do estoque?')) {
      setCores(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <div className="estoque-page">
      <h1>Gestão de Estoque - Cores de Chassis</h1>
      <p>Controle das cores disponíveis para os blocos da máquina industrial</p>

      {loading ? (
        <p>Carregando estoque...</p>
      ) : (
        <table className="estoque-tabela">
          <thead>
            <tr>
              <th>Cor</th>
              <th>Nome</th>
              <th>Código Máquina</th>
              <th>Quantidade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {cores.map(cor => (
              <tr key={cor.id}>
                <td>
                  <div style={{ 
                    background: cor.hex, 
                    width: 40, height: 40, 
                    border: '2px solid #333',
                    borderRadius: '8px',
                    display: 'inline-block'
                  }}></div>
                </td>
                <td>
                  {editando === cor.id ? (
                    <input 
                      type="text" 
                      value={novoNome} 
                      onChange={(e) => setNovoNome(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && salvarNome(cor.id)}
                      autoFocus
                    />
                  ) : (
                    cor.nome
                  )}
                </td>
                <td><strong>{cor.codigoBloco}</strong></td>
                <td><strong>{cor.quantidade}</strong></td>
                <td className="acoes">
                  <button onClick={() => repor(cor.id)} className="btn-repor">
                    +10
                  </button>
                  {editando === cor.id ? (
                    <button onClick={() => salvarNome(cor.id)} className="btn-salvar">
                      Salvar
                    </button>
                  ) : (
                    <button onClick={() => { setEditando(cor.id); setNovoNome(cor.nome); }} className="btn-editar">
                      Editar
                    </button>
                  )}
                  <button onClick={() => remover(cor.id)} className="btn-remover">
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Estoque;