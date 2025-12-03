import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // Importe o contexto
import './Perfil.css';

// --- ÍCONES (Mantidos iguais) ---
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const BoxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2-0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline></svg>;
const CartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2 2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

// Função para formatar data
const formatarData = (dataISO) => {
  if (!dataISO) return '';
  const data = new Date(dataISO);
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Dicionário de nomes legíveis
const NomesPersonalizacoes = {
  combustivel: 'Combustível',
  cambio: 'Câmbio',
  cor_externa: 'Cor Externa',
  acabamento: 'Acabamento',
  material_externo: 'Material da Carroceria',
  aerofolio: 'Aerofólio',
  roda: 'Tipo de Roda',
  tracao: 'Tração',
  material_interno: 'Material dos Bancos',
  iluminacao: 'Tecnologia dos Faróis'
};

// Conversão de hex para nome (simplificada)
const corParaNome = (valor) => {
  if (!valor) return 'Padrão';
  const cores = {
    '#FFFFFF': 'Branco',
    '#000000': 'Preto',
    '#FF0000': 'Vermelho',
    '#0000FF': 'Azul',
    '#008000': 'Verde',
    '#FFFF00': 'Amarelo',
    '#808080': 'Cinza',
    '#FFA500': 'Laranja',
    '#800080': 'Roxo'
  };
  return cores[valor.toUpperCase()] || valor;
};

// Modal de detalhes
const DetalhesModal = ({ item, onClose }) => {
  const personalizacoes = Object.keys(item)
    .filter(key => NomesPersonalizacoes[key] && item[key] !== null)
    .map(key => ({
      nome: NomesPersonalizacoes[key],
      valor: String(item[key])
    }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><CloseIcon /></button>
        <h2 className="modal-title">{item.carro_nome}</h2>
        <p className="modal-subtitle">Detalhes da Personalização</p>
        <div className="modal-details">
          {personalizacoes.map(detalhe => (
            <div key={detalhe.nome} className="modal-detail-item">
              <span className="modal-detail-label">{detalhe.nome}:</span>
              <span className="modal-detail-value">
                {detalhe.nome.toLowerCase().includes('cor')
                  ? corParaNome(detalhe.valor)
                  : detalhe.valor}
              </span>
            </div>
          ))}
          {personalizacoes.length === 0 && (
            <p className="no-details">Este carro não possui personalizações adicionais.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const Perfil = () => {
  const { user, logout, API_URL } = useContext(AuthContext); // Hooks do Contexto
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('carrinho');
  const [isEditing, setIsEditing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState({ orders: false, cart: false, produce: null, entregar: null });
  const [error, setError] = useState({ orders: null, cart: null, produce: null, entregar: null });
  const [detailsModalItem, setDetailsModalItem] = useState(null);

  // Inicializa o form com vazio, será preenchido pelo useEffect
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // 1. Proteção de Rota + Carga de Dados do Usuário
  useEffect(() => {
    if (!user) {
      // Se não tiver usuário logado, manda pro login
      navigate('/login');
    } else {
      // Se tiver, preenche o formulário
      setFormData({
        name: user.nome || '',
        email: user.email || '',
        phone: user.telefone || '',
        address: user.endereco || ''
      });
    }
  }, [user, navigate]);

  // 2. Carga de Pedidos e Carrinho (Só se estiver logado)
  useEffect(() => {
    if (!user) return;

    if (activeTab === 'pedidos') {
      fetchOrders();
    } else if (activeTab === 'carrinho') {
      fetchCartItems();
    }
  }, [activeTab, user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchOrders = async () => {
    setLoading(prev => ({ ...prev, orders: true }));
    setError(prev => ({ ...prev, orders: null }));
    try {
      // IMPORTANTE: Agora usamos a rota "meus-pedidos" que filtra pelo token
      const res = await fetch(`${API_URL}/api/pedidos/meus-pedidos`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Falha ao buscar histórico');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      setError(prev => ({ ...prev, orders: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, orders: false }));
    }
  };

  const fetchCartItems = async () => {
    setLoading(prev => ({ ...prev, cart: true }));
    setError(prev => ({ ...prev, cart: null }));
    try {
      // Trazendo itens do carrinho (O Backend precisa filtrar por usuário também, idealmente)
      // Por enquanto, vamos assumir que o backend já trata ou filtrar no front (não ideal)
      // *Nota: Para produção, atualize o backend GET /carrinho para usar o token*
      const res = await fetch(`${API_URL}/api/pedidos/carrinho`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!res.ok) throw new Error('Falha ao buscar carrinho');
      const data = await res.json();
      
      // Filtrando no front temporariamente para garantir que só vê os meus
      // (O ideal é o backend fazer isso com WHERE usuario_id = $1)
      const meusItens = data.filter(item => item.usuario_id === user.id);
      setCartItems(meusItens);

    } catch (err) {
      setError(prev => ({ ...prev, cart: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, cart: false }));
    }
  };

  const handleRemoveItem = async (id) => {
    if (!window.confirm('Remover este item?')) return;
    try {
      const res = await fetch(`${API_URL}/api/pedidos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao remover o item.');
      setCartItems(prev => (prev ? prev.filter(i => i.id !== id) : []));
    } catch (err) {
      alert('Erro ao remover: ' + err.message);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Limpar tudo?')) return;
    try {
      await fetch(`${API_URL}/api/pedidos/carrinho`, { method: 'DELETE' });
      setCartItems([]);
    } catch (err) {
      alert('Erro ao limpar: ' + err.message);
    }
  };

  const handleProduzir = async (id) => {
    setLoading(prev => ({ ...prev, produce: id }));
    setError(prev => ({ ...prev, produce: null }));
    try {
      const res = await fetch(`${API_URL}/api/pedidos/${id}/produzir`, { method: 'POST' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.erro || 'Falha');
      }
      return true;
    } catch (err) {
      setError(prev => ({ ...prev, produce: err.message }));
      return false;
    } finally {
      setLoading(prev => ({ ...prev, produce: null }));
    }
  };

  const handleFinalizarCompra = async () => {
    setLoading(prev => ({ ...prev, produce: 'all' }));
    let ok = true;
    for (const item of cartItems) {
      if (!(await handleProduzir(item.id))) {
        ok = false;
        break;
      }
    }
    setLoading(prev => ({ ...prev, produce: null }));
    if (ok) {
      alert('Todos os pedidos enviados para produção!');
      setCartItems([]);
      setActiveTab('pedidos');
      fetchOrders();
    }
  };

  const confirmarEntrega = async (pedidoId) => {
    if (!window.confirm('Confirmar que recebeu o carro? Isso libera o slot.')) return;
    setLoading(prev => ({ ...prev, entregar: pedidoId }));
    setError(prev => ({ ...prev, entregar: null }));
    try {
      const response = await fetch(`${API_URL}/api/pedidos/${pedidoId}/entregar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!response.ok) {
        const erro = await response.json();
        throw new Error(erro.erro || 'Falha na entrega');
      }
      alert('Entrega confirmada! Slot liberado.');
      fetchOrders();
    } catch (err) {
      setError(prev => ({ ...prev, entregar: err.message }));
      alert('Erro: ' + err.message);
    } finally {
      setLoading(prev => ({ ...prev, entregar: null }));
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleEditToggle = () => setIsEditing(prev => !prev);
  const handleSaveChanges = (e) => {
    e.preventDefault();
    setIsEditing(false);
    alert("Função de atualizar perfil será implementada em breve no backend!");
  };

  // Se o user ainda não carregou, exibe loading ou nada
  if (!user) return <div className="loading-screen">Carregando perfil...</div>;

  return (
    <>
      {detailsModalItem && (
        <DetalhesModal item={detailsModalItem} onClose={() => setDetailsModalItem(null)} />
      )}

      <div className="profile-container">
        <aside className="profile-sidebar">
          <div className="user-info">
            {/* Imagem Padrão ou Avatar Gerado com as Iniciais */}
            <div className="user-avatar-placeholder" style={{
                width: '80px', height: '80px', borderRadius: '50%', 
                backgroundColor: '#333', color: '#fff', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', fontSize: '32px',
                margin: '0 auto 15px'
            }}>
                {user.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
            </div>
            <h2>{user.nome}</h2>
            <p>Membro da AutoMod</p>
          </div>
          <nav className="profile-nav">
            <button className={activeTab === 'perfil' ? 'active' : ''} onClick={() => setActiveTab('perfil')}>
              <UserIcon /> Meu Perfil
            </button>
            <button className={activeTab === 'carrinho' ? 'active' : ''} onClick={() => setActiveTab('carrinho')}>
              <CartIcon /> Carrinho
            </button>
            <button className={activeTab === 'pedidos' ? 'active' : ''} onClick={() => setActiveTab('pedidos')}>
              <BoxIcon /> Meus Pedidos
            </button>
            <button className="logout-button" onClick={handleLogout}><LogoutIcon /> Sair</button>
          </nav>
        </aside>

        <main className="profile-content">
          {activeTab === 'perfil' && (
            <section id="perfil">
              <h1>Detalhes do Perfil</h1>
              <p className="section-description">Suas informações pessoais.</p>
              <form onSubmit={handleSaveChanges} className="profile-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="name">Nome Completo</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={true} // Email geralmente não se muda fácil
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Telefone</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="address">Endereço</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="form-actions">
                  {isEditing ? (
                    <>
                      <button type="submit" className="button-primary">Salvar</button>
                      <button type="button" className="button-secondary" onClick={handleEditToggle}>Cancelar</button>
                    </>
                  ) : (
                    <button type="button" className="button-primary" onClick={handleEditToggle}>Editar</button>
                  )}
                </div>
              </form>
            </section>
          )}

          {activeTab === 'carrinho' && (
            <section id="carrinho">
              <h1>Carrinho de Compras</h1>
              <p className="section-description">Confira os seus carros personalizados antes de finalizar a compra.</p>
              <div className="orders-table-container">
                <table className="orders-table">
                  <thead>
                    <tr><th>ID</th><th>Carro</th><th>Data</th><th>Valor</th><th>Ações</th></tr>
                  </thead>
                  <tbody>
                    {loading.cart && <tr><td colSpan="5">Carregando...</td></tr>}
                    {error.cart && <tr><td colSpan="5" className="error-message">{error.cart}</td></tr>}
                    {!loading.cart && cartItems.length === 0 && <tr><td colSpan="5">Carrinho vazio</td></tr>}
                    {cartItems.map(item => (
                      <tr key={item.id}>
                        <td>#{String(item.id).padStart(5, '0')}</td>
                        <td>{item.carro_nome}</td>
                        <td>{formatarData(item.criado_em)}</td>
                        <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}</td>
                        <td className="acoes-carrinho">
                          <button className="btn-details-text" onClick={() => setDetailsModalItem(item)}>
                            Ver Detalhes
                          </button>
                          <button className="remove-item-button" onClick={() => handleRemoveItem(item.id)}>
                            <TrashIcon />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {cartItems.length > 0 && (
                <div className="cart-summary">
                  <button className="button-secondary clear-cart-button" onClick={handleClearCart}>Limpar</button>
                  <button className="button-primary checkout-button" onClick={handleFinalizarCompra} disabled={!!loading.produce}>
                    {loading.produce ? 'Enviando...' : 'Finalizar Compra'}
                  </button>
                </div>
              )}
              {error.produce && <p className="error-message produce-error">{error.produce}</p>}
            </section>
          )}

          {activeTab === 'pedidos' && (
            <section id="pedidos">
              <h1>Histórico de Pedidos</h1>
              <div className="orders-table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>ID</th><th>Carro</th><th>Data</th><th>Estado</th><th>Valor</th><th>Slot</th><th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading.orders && <tr><td colSpan="7">Carregando...</td></tr>}
                    {!loading.orders && orders.length === 0 && <tr><td colSpan="7">Nenhum pedido encontrado.</td></tr>}
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td>#{String(order.id).padStart(5, '0')}</td>
                        <td>{order.carro_nome}</td>
                        <td>{formatarData(order.criado_em)}</td>
                        <td><span className={`status-badge status-${order.status.replace(/\s+/g, '-').toLowerCase()}`}>{order.status}</span></td>
                        <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.valor)}</td>
                        <td>{order.slot_expedicao || '---'}</td>
                        <td>
                          {order.status === 'Concluído' && (
                            <button
                              className="btn-entregar"
                              onClick={() => confirmarEntrega(order.id)}
                              disabled={loading.entregar === order.id}
                            >
                              {loading.entregar === order.id ? 'Liberando...' : <>Confirmar Entrega <CheckIcon /></>}
                            </button>
                          )}
                          {order.status === 'Entregue' && <span className="status-entregue">Entregue</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
};

export default Perfil;