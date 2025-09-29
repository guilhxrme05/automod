import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Personalizacao.css';

// Estrutura de opções com as 'key' corrigidas para corresponderem ao banco de dados
const customizationOptions = [
  {
    title: 'Motor e Transmissão',
    options: [
      { name: 'Tipo de Combustível', type: 'select', key: 'combustivel', values: ['Gasolina', 'Elétrico', 'Híbrido'] },
      { name: 'Tipo de Câmbio', type: 'select', key: 'cambio', values: ['Manual', 'Automático', 'CVT', 'Borboleta'] },
    ]
  },
  {
    title: 'Exterior',
    options: [
      // <<< CORREÇÃO AQUI >>>
      { name: 'Cor Externa', type: 'color', key: 'cor_externa', items: [
        { value: '#ffffff' }, { value: '#000000' }, 
        { value: '#ff0000' }, { value: '#0000ff' }, 
        { value: '#f8ff32' }, { value: '#008000' }
      ]},
      // <<< CORREÇÃO AQUI >>>
      { name: 'Acabamento', type: 'select', key: 'acabamento', values: ['Metálico', 'Fosco', 'Perolado', 'Sólido'] },
      // <<< CORREÇÃO AQUI >>>
      { name: 'Material Exterior', type: 'select', key: 'material_externo', values: ['Aço comum', 'Aço premium', 'Fibra de Carbono', 'Titânio'] },
      { name: 'Aerofólio', type: 'select', key: 'aerofolio', values: ['Sem', 'Lip Type', 'Ducktail Type', 'Gt Wing Type', 'Swan Neck Type', 'Retrátil'] },
    ]
  },
  {
    title: 'Rodas e Tração',
    options: [
      { name: 'Rodas', type: 'select', key: 'roda', values: ['Asfalto comum', 'Asfalto premium', 'Drift', 'Rally', 'Off-road'] },
      { name: 'Tipo de Tração', type: 'select', key: 'tracao', values: ['Dianteira', 'Traseira', '4x4'] },
    ]
  },
  {
    title: 'Interior e Iluminação',
    options: [
      // <<< CORREÇÃO AQUI >>>
      { name: 'Material dos Bancos', type: 'select', key: 'material_interno', values: ['Couro', 'Couro sintético', 'Tecido', 'Alcântara'] },
      { name: 'Tecnologia dos Faróis', type: 'select', key: 'iluminacao', values: ['LED', 'OLED', 'Neon', 'Xenon', 'Laser'] },
    ]
  },
];

const blockConfig = {
  // <<< CORREÇÃO AQUI >>>
  1: ['combustivel', 'cambio', 'cor_externa', 'roda'],
  2: ['combustivel', 'cambio', 'cor_externa', 'roda', 'acabamento', 'tracao', 'aerofolio'],
};

const Personalizacao = () => {
  const { carId } = useParams();
  const navigate = useNavigate();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selections, setSelections] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Busca os dados do carro
  useEffect(() => {
    const fetchCarData = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/carros/${carId}`);
        if (!response.ok) throw new Error('Não foi possível encontrar o carro solicitado.');
        const data = await response.json();
        setCar(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCarData();
  }, [carId]);


  const optionsParaExibir = React.useMemo(() => {
    if (!car) return [];
    if (car.num_blocos >= 3 || !blockConfig[car.num_blocos]) {
      return customizationOptions;
    }
    const allowedKeys = blockConfig[car.num_blocos];
    return customizationOptions.map(section => {
      const filteredOptions = section.options.filter(option => allowedKeys.includes(option.key));
      return filteredOptions.length > 0 ? { ...section, options: filteredOptions } : null;
    }).filter(Boolean);
  }, [car]);


  useEffect(() => {
    if (optionsParaExibir.length > 0) {
      const initialSelections = {};
      optionsParaExibir.forEach(section => {
        section.options.forEach(option => {
          if (!option.key) return;
          if (option.type === 'select') initialSelections[option.key] = option.values[0];
          else if (option.type === 'toggle') initialSelections[option.key] = false;
          else if (option.type === 'color') initialSelections[option.key] = option.items[0].value;
        });
      });
      setSelections(initialSelections);
    }
  }, [optionsParaExibir]);

  const handleSelect = (key, value) => {
    setSelections(prev => ({ ...prev, [key]: value }));
  };

  // FUNÇÃO ATUALIZADA PARA O CARRINHO
  const handleAddToCart = async () => {
    setIsSubmitting(true);
    setError(null);
    const pedidoData = {
      carroId: car.id,
      personalizacoes: selections,
      valor: 250000.00 
    };
    try {
      const response = await fetch('http://localhost:3001/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedidoData),
      });
      if (!response.ok) throw new Error('Falha ao adicionar o item ao carrinho.');
      navigate('/perfil');
    } catch (err) {
      setError("Não foi possível adicionar o item ao carrinho. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="status-page">A carregar o personalizador...</div>;
  if (error) return <div className="status-page error">{error}</div>;
  if (!car) return <div className="status-page">Carro não encontrado.</div>;

  return (
    <div className="personalizacao-container">
      <section className="car-showcase">
        <div className="car-info">
          <h1>{car.nome}</h1>
          <img src={car.image} alt={car.nome} className="car-image" />
          {car.descricao && (
            <p className="car-description">"{car.descricao}"</p>
          )}
        </div>
      </section>

      <aside className="options-panel">
        <div className="panel-header">
          <h2>Personalização</h2>
          <button 
            className="finish-button"
            onClick={handleAddToCart}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'A adicionar...' : 'Adicionar ao Carrinho'}
          </button>
        </div>

        <div className="options-list">
          {optionsParaExibir.map((section, sectionIndex) => (
            <div key={sectionIndex} className="option-section">
              <h3>{section.title}</h3>
              {section.options.map((option, optionIndex) => (
                <div key={option.key || optionIndex} className="option-item">
                  <h4>{option.name}</h4>
                  {option.type === 'select' && (
                    <div className="select-group">
                      {option.values.map((value) => (
                        <button 
                          key={value}
                          className={`select-button ${selections[option.key] === value ? 'active' : ''}`}
                          onClick={() => handleSelect(option.key, value)}
                        >{value}</button>
                      ))}
                    </div>
                  )}
                  {option.type === 'color' && (
                    <div className="option-grid">
                      {option.items.map((item) => (
                        <div 
                          key={item.value}
                          className={`option-swatch color-swatch ${selections[option.key] === item.value ? 'selected' : ''}`}
                          style={{ background: item.value }}
                          onClick={() => handleSelect(option.key, item.value)}
                        ></div>
                      ))}
                    </div>
                  )}
                  {option.type === 'toggle' && (
                    <button 
                      className={`toggle-button ${selections[option.key] ? 'active' : ''}`}
                      onClick={() => handleSelect(option.key, !selections[option.key])}
                    >
                      {selections[option.key] ? 'Sim' : 'Não'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </aside> 
    </div>
  );
};

export default Personalizacao;

