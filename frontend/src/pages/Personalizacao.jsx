// src/components/Personalizacao.jsx

import React, { useState } from 'react';
import './Personalizacao.css';

// --- Dados de Exemplo (Isso viria do backend/API no futuro) ---

// O carro que foi selecionado na tela Home
const carData = {
  name: 'Porsche 911',
  type: 'Esportivo', // Isso definiria quais opções de personalização mostrar
 image: '/images/porsche_template.png'
};

// Opções de personalização baseadas nas suas regras
const customizationOptions = {
  Esportivo: [
    {
      title: 'Cores exteriores',
      options: [
        { name: 'Metálico', items: [{ type: 'color', value: '#ababab' }, { type: 'color', value: '#222222' }] },
        { name: 'Sólida', items: [{ type: 'color', value: '#003366' }, { type: 'color', value: '#000000' }] },
        { name: 'Perolado', items: [{ type: 'color', value: '#f0f0f0' }] },
      ]
    },
    {
      title: 'Tipos de interiores',
      options: [
        { name: 'Couro', items: [
            { type: 'image', value: 'url(https://i.imgur.com/8mPYgAD.jpeg)'}, 
            { type: 'image', value: 'url(https://i.imgur.com/K0Yt424.jpeg)'}, 
            { type: 'image', value: 'url(https://i.imgur.com/j1s3N6d.jpeg)'}
        ]},
        { name: 'Tecido Automotivo', items: [
            { type: 'image', value: 'url(https://i.imgur.com/mC3mTC4.jpeg)'}, 
            { type: 'image', value: 'url(https://i.imgur.com/jJzO8gR.jpeg)'}, 
            { type: 'image', value: 'url(https://i.imgur.com/BfP14y3.jpeg)'}
        ]}
      ]
    },
    {
      title: 'Itens Adicionais',
      options: [
        { name: 'Aerofólio', type: 'toggle', key: 'aerofolio'},
        { name: 'Tipo de Tração', type: 'select', key: 'tracao', values: ['Traseira', 'Dianteira', 'Integral']}
      ]
    }
  ]
  // Aqui você adicionaria as opções para 'Popular' e 'Luxo'
};

// --- Fim dos Dados de Exemplo ---


const Personalizacao = () => {
  // Estado para guardar as seleções do usuário
  const [selections, setSelections] = useState({
    corExterna: '#ababab',
    interior: 'url(https://i.imgur.com/8mPYgAD.jpeg)',
    aerofolio: true,
    tracao: 'Traseira'
  });

  // Função para atualizar uma seleção
  const handleSelect = (key, value) => {
    setSelections(prev => ({ ...prev, [key]: value }));
  };

  // Pega as opções de personalização para o tipo de carro atual
  const optionsForCurrentCar = customizationOptions[carData.type];

  return (
    <div className="personalizacao-container">
      <section className="car-showcase">
        <span className="logo">AUTOMOD</span>
        <div className="car-info">
          <h1>{carData.name}</h1>
          <img src={carData.image} alt={carData.name} className="car-image" />
        </div>
      </section>

      <aside className="options-panel">
        <h2>Personalização</h2>
        
        {optionsForCurrentCar.map((section, sectionIndex) => (
          <div key={sectionIndex} className="option-section">
            <h3>{section.title}</h3>
            {section.options.map((sub, subIndex) => (
              <div key={subIndex} className="option-subsection">
                <h4>{sub.name}</h4>
                
                {/* Se for um grupo de cores/texturas */}
                {sub.items && (
                  <div className="option-grid">
                    {sub.items.map((item, itemIndex) => (
                      <div 
                        key={itemIndex}
                        className={`option-swatch ${selections.interior === item.value || selections.corExterna === item.value ? 'selected' : ''}`}
                        style={{ background: item.value, backgroundSize: 'cover' }}
                        onClick={() => handleSelect(sub.name === 'Couro' || sub.name === 'Tecido Automotivo' ? 'interior' : 'corExterna', item.value)}
                      ></div>
                    ))}
                  </div>
                )}

                {/* Se for um botão de ligar/desligar */}
                {sub.type === 'toggle' && (
                  <button 
                    className={`toggle-button ${selections[sub.key] ? 'active' : ''}`}
                    onClick={() => handleSelect(sub.key, !selections[sub.key])}
                  >
                    {selections[sub.key] ? 'Ativado' : 'Desativado'}
                  </button>
                )}
                
                {/* Se for uma lista de seleção */}
                {sub.type === 'select' && (
                  <div className="select-group">
                    {sub.values.map((value, valueIndex) => (
                        <button 
                            key={valueIndex}
                            className={`select-button ${selections[sub.key] === value ? 'active' : ''}`}
                            onClick={() => handleSelect(sub.key, value)}
                        >{value}</button>
                    ))}
                  </div>
                )}

              </div>
            ))}
          </div>
        ))}

      </aside>
    </div>
  );
};

export default Personalizacao;