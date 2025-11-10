import React, { useState, useEffect } from 'react';
import './Perfil.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Ícones (mantidos)
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const BoxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
const CartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;

const userData = { id: 1, name: 'gui', email: 'teste@email.com', phone: '(48) 99999-9999', address: 'Florianópolis, SC', memberSince: '2025', avatar: 'public/images/perfil.png' };

const formatarData = (dataISO) => {
  if (!dataISO) return '';
  const data = new Date(dataISO);
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const Perfil = () => {
  const [activeTab, setActiveTab] = useState('carrinho');
  const [isEditing, setIsEditing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState({ orders: false, cart: false, produce: null, entregar: null });
  const [error, setError] = useState({ orders: null, cart: null, produce: null, entregar: null });
  const [formData, setFormData] = useState({ name: userData.name, email: userData.email, phone: userData.phone, address: userData.address });

  useEffect(() => {
    if (activeTab === 'pedidos') fetchOrders();
    else if (activeTab === 'carrinho') fetchCartItems();
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoading(prev => ({ ...prev, orders: true }));
    setError(prev => ({ ...prev, orders: null }));
    try {
      const res = await fetch(`${API_URL}/api/pedidos/historico`);
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
    try {
      const res = await fetch(`${API_URL}/api/pedidos/carrinho`);
      if (!res.ok) throw new Error('Falha ao buscar carrinho');
      const data = await res.json();
      setCartItems(data);
    } catch (err) {
      setError(prev => ({ ...prev, cart: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, cart: false }));
    }
  };

  const handleRemoveItem = async (id) => {
    if (!confirm('Remover este item?')) return;
    try {
      await fetch(`${API_URL}/api/pedidos/${id}`, { method: 'DELETE' });
      setCartItems(prev => prev.filter(i => i.id !== id));
    } catch (err) { alert('Erro ao remover'); }
  };

  const handleClearCart = async () => {
    if (!confirm('Limpar tudo?')) return;
    try {
      await fetch(`${API_URL}/api/pedidos/carrinho`, { method: 'DELETE' });
      setCartItems([]);
    } catch (err) { alert('Erro ao limpar'); }
  };

  const handleProduzir = async (id) => {
    setLoading(prev => ({ ...prev, produce: id }));
    try {
      const res = await fetch(`${API_URL}/api/pedidos/${id}/produzir`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.erro || 'Falha');
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
      if (!(await handleProduzir(item.id))) { ok = false; break; }
    }
    setLoading(prev => ({ ...prev, produce: null }));
    if (ok) {
      alert('Todos os pedidos enviados para produção!');
      setCartItems([]);
      setActiveTab('pedidos');
      fetchOrders();
    }
  };

  // NOVA FUNÇÃO: CONFIRMAR ENTREGA
  const confirmarEntrega = async (pedidoId) => {
    if (!confirm('Confirmar que recebeu o carro? Isso libera o slot.')) return;
    setLoading(prev => ({ ...prev, entregar: pedidoId }));
    try {
      const res = await fetch(`${API_URL}/api/pedidos/${pedidoId}/entregar`, { method: 'POST' });
      if (!res.ok) throw new Error('Falha ao confirmar');
      alert('Entrega confirmada! Slot liberado.');
      fetchOrders(); // atualiza a tabela
    } catch (err) {
      alert('Erro: ' + err.message);
    } finally {
      setLoading(prev => ({ ...prev, entregar: null }));
    }
  };

  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleEditToggle = () => setIsEditing(!isEditing);
  const handleSaveChanges = (e) => { e.preventDefault(); setIsEditing(false); };

  return (
    <div className="profile-container">
      {/* SIDEBAR (sem mudanças) */}
      <aside className="profile-sidebar">
        <div className="user-info">
          <img src={userData.avatar} alt="Avatar" className="user-avatar" />
          <h2>{userData.name}</h2>
          <p>Membro desde {userData.memberSince}</p>
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
          <button className="logout-button"><LogoutIcon /> Sair</button>
        </nav>
      </aside>

      <main className="profile-content">
        {/* PERFIL */}
        {activeTab === 'perfil' && (
          <section id="perfil">
            <h1>Detalhes do Perfil</h1>
            <form onSubmit={handleSaveChanges} className="profile-form">
              <div className="form-grid">
                <div className="form-group"><label>Nome</label><input name="name" value={formData.name} onChange={handleInputChange} disabled={!isEditing} /></div>
                <div className="form-group"><label>Email</label><input name="email" value={formData.email} onChange={handleInputChange} disabled={!isEditing} /></div>
                <div className="form-group"><label>Telefone</label><input name="phone" value={formData.phone} onChange={handleInputChange} disabled={!isEditing} /></div>
                <div className="form-group"><label>Endereço</label><input name="address" value={formData.address} onChange={handleInputChange} disabled={!isEditing} /></div>
              </div>
              <div className="form-actions">
                {isEditing ? (
                  <><button type="submit" className="button-primary">Salvar</button><button type="button" className="button-secondary" onClick={handleEditToggle}>Cancelar</button></>
                ) : <button type="button" className="button-primary" onClick={handleEditToggle}>Editar</button>}
              </div>
            </form>
          </section>
        )}

        {/* CARRINHO */}
        {activeTab === 'carrinho' && (
          <section id="carrinho">
            <h1>Carrinho de Compras</h1>
            <div className="orders-table-container">
              <table className="orders-table">
                <thead><tr><th>ID</th><th>Carro</th><th>Data</th><th>Valor</th><th>Ações</th></tr></thead>
                <tbody>
                  {loading.cart && <tr><td colSpan="5">Carregando...</td></tr>}
                  {cartItems.length === 0 && <tr><td colSpan="5">Carrinho vazio</td></tr>}
                  {cartItems.map(item => (
                    <tr key={item.id}>
                      <td>#{String(item.id).padStart(5, '0')}</td>
                      <td>{item.carro_nome}</td>
                      <td>{formatarData(item.criado_em)}</td>
                      <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}</td>
                      <td><button className="remove-item-button" onClick={() => handleRemoveItem(item.id)} title="Remover"><TrashIcon /></button></td>
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
            {error.produce && <p className="error-message">{error.produce}</p>}
          </section>
        )}

        {/* HISTÓRICO DE PEDIDOS + BOTÃO CONFIRMAR ENTREGA */}
        {activeTab === 'pedidos' && (
          <section id="pedidos">
            <h1>Histórico de Pedidos</h1>
            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Carro</th>
                    <th>Data</th>
                    <th>Estado</th>
                    <th>Valor</th>
                    <th>Slot</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {loading.orders && <tr><td colSpan="7">Carregando...</td></tr>}
                  {orders.length === 0 && <tr><td colSpan="7">Nenhum pedido finalizado</td></tr>}
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
  );
};

export default Perfil;