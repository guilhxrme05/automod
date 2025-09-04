import React, { useState } from 'react';
import './Home.css';

// icone provisorio
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 21L16.65 16.65" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


const Home = () => {
  const cars = [
    
    { name: 'Chevrolet Onix', category: 'Popular', image: 'https://i.imgur.com/8B26f32.png' },
    { name: 'Hyundai HB20', category: 'Popular', image: 'https://i.imgur.com/d722p8W.png' },
    { name: 'Fiat Argo', category: 'Popular', image: 'https://i.imgur.com/bL2a22b.png' },
    { name: 'Volkswagen Polo', category: 'Popular', image: 'https://i.imgur.com/UfnSyrd.png' },
    { name: 'Renault Kwid', category: 'Popular', image: 'https://i.imgur.com/u5j6v6v.png' },
    { name: 'BMW 320i', category: 'Luxo', image: 'https://i.imgur.com/M8AANjG.png' },
    { name: 'Mercedes-Benz C180', category: 'Luxo', image: 'https://i.imgur.com/9C3kL2Q.png' },
    { name: 'Audi Q5', category: 'Luxo', image: 'https://i.imgur.com/g8nN5d4.png' },
    { name: 'Range Rover Evoque', category: 'Luxo', image: 'https://i.imgur.com/JQLr2xz.png' },
    { name: 'Volvo XC60', category: 'Luxo', image: 'https://i.imgur.com/aLg17fX.png' },
    { name: 'Porsche Macan', category: 'Luxo', image: 'https://i.imgur.com/tVjY5Q3.png' },
    { name: 'Porsche 911', category: 'Esportivo', image: 'https://i.imgur.com/u42B3c1.png' },
    { name: 'Ford Mustang GT', category: 'Esportivo', image: 'https://i.imgur.com/kS7j84h.png' },
    { name: 'Chevrolet Corvette', category: 'Esportivo', image: 'https://i.imgur.com/8QG3X5f.png' },
    { name: 'Porsche 718 Cayman', category: 'Esportivo', image: 'https://i.imgur.com/vHq0gWk.png' },
    { name: 'BMW M4', category: 'Esportivo', image: 'https://i.imgur.com/Vb8lPqE.png' },
  ];

  const filterButtons = ['Todos', 'Popular', 'Esportivo', 'Luxo'];

  // cria os estados para os filtros
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  //  lógica para filtrar e exibir os carros
  const filteredCars = cars
    .filter(car => {
      // filtro de Categoria
      if (activeCategory === 'Todos') {
        return true;
      }
      return car.category === activeCategory;
    })
    .filter(car => {
      return car.name.toLowerCase().includes(searchTerm.toLowerCase());
    });


  return (
    <div className="catalog-container">
      <div className="catalog-header">
        <h1>Explore os Modelos</h1>
        <p>Selecione um veículo abaixo para iniciar a personalização.</p>
      </div>

      <div className="filter-controls">
        <div className="button-group">
     
          {filterButtons.map((category, index) => (
            <button 
              key={index} 
              className={`filter-button ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="search-sort-group">
          <div className="search-bar">
            <SearchIcon />
            <input 
              type="text" 
              placeholder="Buscar modelo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="sort-dropdown">
            <option value="name-asc">Ordenar por Nome</option>
            <option value="price-desc">Ordenar por Preço</option>
          </select>
        </div>
      </div>

      <main className="car-grid">
        {filteredCars.map((car, index) => (
          <div key={index} className="car-card">
            <div className="card-image-container">
              <img src={car.image} alt={car.name} />
            </div>
            <div className="card-content">
              <span className={`car-category category-${car.category.toLowerCase()}`}>{car.category}</span>
              <h3>{car.name}</h3>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default Home;