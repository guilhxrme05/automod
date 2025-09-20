import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Personalizacao.css';

// opcoes de customizacoes possiveos
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
      { name: 'Cor da Lataria', type: 'color', key: 'corExterna', items: [
        { value: '#ffffff' }, { value: '#c0c0c0' }, { value: '#808080' }, { value: '#000000' }, 
        { value: '#ff0000' }, { value: '#0000ff' }, { value: '#f8ff32' }, { value: '#008000' }
      ]},
      { name: 'Acabamento da Cor', type: 'select', key: 'acabamentoCor', values: ['Metálico', 'Fosco', 'Perolado'] },
      { name: 'Material da Carroceria', type: 'select', key: 'materialExterno', values: ['Aço Comum', 'Aço Premium', 'Fibra de Carbono'] },
      { name: 'Aerofólio', type: 'toggle', key: 'aerofolio' },
    ]
  },
  {
    title: 'Rodas e Tração',
    options: [
      { name: 'Tipo de Roda', type: 'select', key: 'roda', values: ['Asfalto', 'Premium', 'Drift'] },
      { name: 'Tipo de Tração', type: 'select', key: 'tracao', values: ['Dianteira', 'Traseira', '4x4'] },
    ]
  },
  {
    title: 'Interior e Iluminação',
    options: [
      { name: 'Material dos Bancos', type: 'select', key: 'materialInterno', values: ['Couro', 'Tecido', 'Alcântara'] },
      { name: 'Tecnologia dos Faróis', type: 'select', key: 'iluminacao', values: ['LED', 'OLED', 'Neon', 'Xenon', 'Laser'] },
    ]
  },
];


const blockConfig = {
  1: ['combustivel', 'cambio', 'corExterna', 'roda'],
  2: ['combustivel', 'cambio', 'corExterna', 'roda', 'acabamentoCor', 'tracao', 'aerofolio'],
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

