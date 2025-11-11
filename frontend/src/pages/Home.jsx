import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
// <<< 1. IMPORTA O TEU QUIZ (do caminho que você criou) E O ÍCONE DE FECHAR >>>
import AICustomizationQuiz from '../components/AIcustomization.jsx';
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;


// --- A URL DA API VEM DA VARIÁVEL DE AMBIENTE ---
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Ícone de busca
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 21L16.65 16.65" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Home = () => {
  
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  // <<< 2. NOVO ESTADO PARA CONTROLAR O MODAL (O "CARD") DO QUIZ >>>
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  
  const filterButtons = ['Todos', 'Popular', 'Esportivo', 'Luxo'];

  
  useEffect(() => {
    fetch(`${API_URL}/api/carros`)
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

  // filtrar os carros
  const filteredCars = cars
    .filter(car => {
      if (activeCategory === 'Todos') return true;
      return car.categoria === activeCategory;
    })
    .filter(car => {
      return car.nome.toLowerCase().includes(searchTerm.toLowerCase());
    });

  // renderizacoes condicionais para erros
  if (loading) {
    return <div className="status-message">Carregando modelos...</div>;
  }
  if (error) {
    return <div className="status-message error">{error}</div>;
  }

  return (
    // Usamos um Fragment <> para permitir que o modal fique "por cima" de tudo
    <>
      <div className="catalog-container">
        <div className="catalog-header">
          <h1>Explore Nossos Modelos</h1>
          <p>Selecione um veículo ou use nosso assistente de IA para encontrar sua personalização ideal.</p>
          {/* <<< 3. NOVO BOTÃO PARA ABRIR O QUIZ >>> */}
          <button className="ai-quiz-trigger-button" onClick={() => setIsQuizOpen(true)}>
            Descubra seu Estilo (IA)
          </button>
        </div>

        {/* Divisor Visual (removido para não separar o quiz do resto) */}
        {/* <hr className="section-divider" /> */}

        {/* Seção de Filtros e Carros */}
        <section className="car-selection-section">
            <h2>Explore por categoria:</h2>
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
        </section>
      </div>

      {/* <<< 4. O "CARD" (MODAL) DO QUIZ >>> */}
      {isQuizOpen && (
        <div className="quiz-modal-overlay" onClick={() => setIsQuizOpen(false)}>
          <div className="quiz-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="quiz-modal-close" onClick={() => setIsQuizOpen(false)}>
              <CloseIcon />
            </button>
            {/* O componente do Quiz é renderizado aqui dentro */}
            <AICustomizationQuiz />
          </div>
        </div>
      )}
    </>
  );
};

export default Home;