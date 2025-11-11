// src/pages/Estoque.jsx
import React, { useState, useEffect } from 'react';
import './Estoque.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Estoque = () => {
  const [cores, setCores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null); // id da cor sendo editada
  const [tempData, setTempData] = useState({}); // dados temporários durante edição

  useEffect(() => {
    fetch(`${API_URL}/api/estoque/cores-chassis`)
      .then(r => r.json())
      .then(data => {
        setCores(data);
        setLoading(false);
      });
  }, []);

  const entrarModoEdicao = (cor) => {
    setEditando(cor.id);
    setTempData({
      nome: cor.nome,
      quantidade: cor.quantidade
    });
  };

const salvarEdicao = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/estoque/cores-chassis/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: tempData.nome,
        quantidade: Number(tempData.quantidade)
      })
    });

    if (!response.ok) throw new Error('Falha ao salvar');

    const corAtualizada = await response.json();
    
    // Atualiza o estado local
    setCores(prev => prev.map(c => c.id === id ? corAtualizada : c));
    
    setEditando(null);
    setTempData({});
  } catch (err) {
    alert('Erro ao salvar: ' + err.message);
  }
};
  const cancelarEdicao = () => {
    setEditando(null);
    setTempData({});
  };

  const atualizarTemp = (campo, valor) => {
    setTempData(prev => ({ ...prev, [campo]: valor }));
  };

  return (
    <div className="estoque-page">
      <h1>Gestão de Estoque - Cores de Chassis</h1>
      <p>Edite nome e quantidade disponível conforme necessário</p>

      {loading ? (
        <p>Carregando estoque...</p>
      ) : (
        <table className="estoque-tabela">
          <thead>
            <tr>
              <th>Cor</th>
              <th>Nome</th>
              <th>Código Máquina</th>
              <th>Quantidade em Estoque</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {cores.map(cor => (
              <tr key={cor.id}>
                <td>
                  <div 
                    className="cor-preview"
                    style={{ background: cor.hex }}
                  />
                </td>
                <td>
                  {editando === cor.id ? (
                    <input
                      type="text"
                      value={tempData.nome || ''}
                      onChange={(e) => atualizarTemp('nome', e.target.value)}
                      className="edit-input"
                      autoFocus
                    />
                  ) : (
                    <strong>{cor.nome}</strong>
                  )}
                </td>
                <td><code>{cor.codigoBloco}</code></td>
                <td>
                  {editando === cor.id ? (
                    <input
                      type="number"
                      value={tempData.quantidade || ''}
                      onChange={(e) => atualizarTemp('quantidade', e.target.value)}
                      className="edit-input qty"
                      min="0"
                    />
                  ) : (
                    <strong>{cor.quantidade}</strong>
                  )}
                </td>
                <td className="acoes">
                  {editando === cor.id ? (
                    <>
                      <button onClick={() => salvarEdicao(cor.id)} className="btn-salvar">
                        Salvar
                      </button>
                      <button onClick={cancelarEdicao} className="btn-cancelar">
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button onClick={() => entrarModoEdicao(cor)} className="btn-editar">
                      Editar
                    </button>
                  )}
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