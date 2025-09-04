

import React, { useState } from 'react';
import './Perfil.css';

// --- temporario sem api
const userData = {
  name: 'Felipe Mancini',
  email: 'felipe.mancini@email.com',
  phone: '(48) 1990-1990',
  address: 'casa da prima do felipe',
  memberSince: '01/01/1990',
  avatar: 'public/images/felipe.png' 
};

const userOrders = [
  { id: 'PED-001', car: 'Porsche 911', date: '25/08/2023', status: 'Em produção', value: 'R$ 850.000,00' },
  { id: 'PED-002', car: 'Chevrolet Onix', date: '12/07/2023', status: 'Entregue', value: 'R$ 95.000,00' },
  { id: 'PED-003', car: 'BMW M4', date: '02/06/2023', status: 'Entregue', value: 'R$ 780.000,00' }
];



const Perfil = () => {
  const [activeTab, setActiveTab] = useState('perfil');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    address: userData.address
  });

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
    // lógica para salvar os dados na API
    console.log('Salvando dados:', formData);
    setIsEditing(false); // sai do modo de edição
  };


  return (
    <div className="profile-container">
      <aside className="profile-sidebar">
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
            <div className="profile-form-container">
                <h1>Detalhes do Perfil</h1>
                <form onSubmit={handleSaveChanges} className="profile-form">
                    <div className="form-group">
                        <label htmlFor="name">Nome Completo</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} disabled={!isEditing} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} disabled={!isEditing} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="phone">Telefone</label>
                        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} disabled={!isEditing} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="address">Endereço</label>
                        <input type="text" id="address" name="address" value={formData.address} onChange={handleInputChange} disabled={!isEditing} />
                    </div>
                    <div className="form-actions">
                        {isEditing ? (
                        <>
                            <button type="submit" className="button-primary">Salvar Alterações</button>
                            <button type="button" className="button-secondary" onClick={handleEditToggle}>Cancelar</button>
                        </>
                        ) : (
                        <button type="button" className="button-primary" onClick={handleEditToggle}>Editar Perfil</button>
                        )}
                    </div>
                </form>
            </div>
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
                    {userOrders.map(order => (
                    <tr key={order.id}>
                        <td>{order.id}</td><td>{order.car}</td><td>{order.date}</td>
                        <td><span className={`status-badge status-${order.status.replace(' ', '-').toLowerCase()}`}>{order.status}</span></td>
                        <td>{order.value}</td>
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