import React, { useState, useEffect } from 'react';
import './Perfil.css';

// Dados do usuário fixos
const userData = {
  id: 1,
  name: 'teste teste',
  email: 'teste@email.com',
  phone: '(48) 1990-1990',
  address: 'endereço',
  memberSince: '01/01/1990',
  avatar: '' 
};

// --- FUNÇÃO CORRIGIDA ---
const formatarData = (dataISO) => {
  if (!dataISO) return ''; // Proteção para caso a data seja nula
  const data = new Date(dataISO); // Converte a string em um objeto Date
  return data.toLocaleDateString('pt-BR', { // Formata o objeto Date
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};


const Perfil = () => {
  const [activeTab, setActiveTab] = useState('perfil');
  const [isEditing, setIsEditing] = useState(false);
  
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  const [formData, setFormData] = useState({
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    address: userData.address
  });

  useEffect(() => {
    if (activeTab === 'pedidos' && orders.length === 0) {
      const fetchOrders = async () => {
        setOrdersLoading(true);
        setOrdersError(null);
        try {
          const response = await fetch(`http://localhost:3001/api/pedidos`);
          if (!response.ok) {
            throw new Error('Falha ao buscar os pedidos.');
          }
          const data = await response.json();
          setOrders(data);
        } catch (error) {
          setOrdersError(error.message);
        } finally {
          setOrdersLoading(false);
        }
      };
      fetchOrders();
    }
  }, [activeTab, orders.length]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if(isEditing) {
        setFormData({ name: userData.name, email: userData.email, phone: userData.phone, address: userData.address });
    }
  };

  const handleSaveChanges = (e) => {
    e.preventDefault();
    console.log('Salvando dados:', formData);
    setIsEditing(false);
  };

  return (
    <div className="profile-container">
      <aside className="profile-sidebar">
        {/* ... (código da sidebar sem alterações) ... */}
        <div className="user-info">
           <img src={userData.avatar} alt="Avatar do usuário" className="user-avatar" />
           <h2>{userData.name}</h2>
           <p>Membro desde {userData.memberSince}</p>
         </div>
         <nav className="profile-nav">
           <a href="#perfil" className={activeTab === 'perfil' ? 'active' : ''} onClick={() => setActiveTab('perfil')}>
             Meu Perfil
           </a>
           <a href="#pedidos" className={activeTab === 'pedidos' ? 'active' : ''} onClick={() => setActiveTab('pedidos')}>
             Meus Pedidos
           </a>
           <a href="#sair" className="logout-button">Sair</a>
         </nav>
      </aside>

      <main className="profile-content">
        {activeTab === 'perfil' && (
           <section id="perfil" className="profile-centered-section">
                {/* ... (código do formulário de perfil sem alterações) ... */}
           </section>
        )}

        {activeTab === 'pedidos' && (
          <section id="pedidos">
            <h1>Histórico de Pedidos</h1>
            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>ID do Pedido</th><th>Carro</th><th>Data</th><th>Status</th><th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersLoading && (
                    <tr><td colSpan="5">Carregando pedidos...</td></tr>
                  )}
                  {ordersError && (
                    <tr><td colSpan="5" className="error-message">{ordersError}</td></tr>
                  )}
                  {!ordersLoading && !ordersError && orders.length === 0 && (
                    <tr><td colSpan="5">Você ainda não fez nenhum pedido.</td></tr>
                  )}
                  {!ordersLoading && !ordersError && orders.map(order => (
                    <tr key={order.id}>
                      <td>#{String(order.id).padStart(5, '0')}</td>
                      <td>{order.carro_nome}</td>
                      {/* A chamada da função aqui continua a mesma, mas agora a função está correta */}
                      <td>{formatarData(order.criado_em)}</td>
                      <td>
                        <span className={`status-badge status-${order.status.replace(/\s+/g, '-').toLowerCase()}`}>
                          {order.status}
                        </span>

                      </td>
                      <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.valor)}</td>
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