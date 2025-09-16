import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

// Ícone de busca (pode ser movido para um arquivo separado se preferir)
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 21L16.65 16.65" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Home = () => {
  // Estados para dados, carregamento e filtros
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  const filterButtons = ['Todos', 'Popular', 'Esportivo', 'Luxo'];

  // Efeito para buscar os carros da API
  useEffect(() => {
    fetch('http://localhost:3001/api/carros')
      .then(response => {
        if (!response.ok) {
          throw new Error('Falha na resposta da rede');
        }
        return response.json();
      })
      .then(data => {
        setCars(data); 
        setLoading(false); 
      })
      .catch(err => {
        console.error("Falha ao buscar carros:", err);
        setError("Não foi possível carregar os modelos. Tente novamente mais tarde.");
        setLoading(false); 
      });
  }, []); 

  // Lógica para filtrar os carros com base na categoria e termo de busca
  const filteredCars = cars
    .filter(car => {
      if (activeCategory === 'Todos') return true;
      return car.categoria === activeCategory;
    })
    .filter(car => {
      return car.nome.toLowerCase().includes(searchTerm.toLowerCase());
    });

  // Renderização condicional para estados de carregamento e erro
  if (loading) {
    return <div className="status-message">Carregando modelos...</div>;
  }
  if (error) {
    return <div className="status-message error">{error}</div>;
  }

  return (
    <div className="catalog-container">
      <div className="catalog-header">
        <h1>Explore Nossos Modelos</h1>
        <p>Selecione um veículo abaixo para iniciar a jornada de personalização.</p>
      </div>

      <div className="filter-controls">
        <div className="button-group">
          {filterButtons.map((category) => (
            <button 
              key={category} 
              className={`filter-button ${activeCategory === category ? 'active' : ''}`} 
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="search-bar">
          <SearchIcon />
          <input 
            type="text" 
            placeholder="Buscar modelo..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      <main className="car-grid">
        {filteredCars.length > 0 ? (
          filteredCars.map((car) => (
            // --- ALTERAÇÃO PRINCIPAL AQUI ---
            // O Link usa o ID na URL (para refresh/links) e passa o objeto 'car' no state (para velocidade)
            <Link 
              key={car.id} 
              to={`/personalizar/${car.id}`} 
              state={{ carro: car }}
              className="car-card-link"
            >
              <div className="car-card">
                <div className="card-image-container">
                  <img src={car.image} alt={car.nome} />
                </div>
                <div className="card-content">
                  <span className={`car-category category-${car.categoria.toLowerCase()}`}>{car.categoria}</span>
                  <h3>{car.nome}</h3>
                  <div className="card-footer">
                    <span>Personalizar</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p className="no-results-message">Nenhum modelo encontrado com os filtros selecionados.</p>
        )}
      </main>
    </div>
  );
};

export default Home;