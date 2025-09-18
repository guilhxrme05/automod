import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Personalizacao.css';

// A estrutura de TODAS as opções possíveis
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

// MAPA DE OPÇÕES PERMITIDAS POR BLOCO
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

  // Filtra as opções com base no num_blocos do carro
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

  // Inicializa as seleções padrão para as opções exibidas
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

  // <<< NOVA FUNÇÃO handleFinalizar COM FLUXO DIRETO >>>
  const handleFinalizar = async () => {
    setIsSubmitting(true);
    setError(null);

    const pedidoData = {
      carroId: car.id,
      personalizacoes: selections,
      valor: 250000.00
    };

    try {
      // --- ETAPA 1: Salvar o pedido no nosso banco de dados ---
      console.log("Etapa 1: Salvando pedido no banco de dados...");
      const responsePedido = await fetch('http://localhost:3001/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedidoData),
      });

      if (!responsePedido.ok) throw new Error('Falha ao salvar o pedido inicial.');
      
      const novoPedido = await responsePedido.json();
      const novoPedidoId = novoPedido.id;
      
      if (!novoPedidoId) throw new Error('O servidor não retornou um ID para o novo pedido.');
      console.log(`Pedido salvo com sucesso! ID: ${novoPedidoId}`);

      // --- ETAPA 2: Enviar o novo pedido para a produção na máquina ---
      console.log(`Etapa 2: Enviando pedido ${novoPedidoId} para a produção...`);
      const responseProducao = await fetch(`http://localhost:3001/api/pedidos/${novoPedidoId}/produzir`, {
        method: 'POST',
      });

      if (!responseProducao.ok) {
        // Se esta etapa falhar, o pedido foi criado mas não enviado.
        throw new Error('Pedido criado, mas falhou ao enviar para a produção. Contate o suporte.');
      }
      
      console.log('Pedido enviado para a máquina com sucesso!');
      
      // --- SUCESSO TOTAL: Navega para a página de perfil ---
      navigate('/perfil');

    } catch (err) {
      console.error("Erro no processo de finalização:", err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="status-page">Carregando personalizador...</div>;
  if (error) return <div className="status-page error">{error}</div>;
  if (!car) return <div className="status-page">Carro não encontrado.</div>;

  return (
    <div className="personalizacao-container">
      <section className="car-showcase">
        <div className="car-info">
          <h1>{car.nome}</h1>
          <img src={car.image} alt={car.nome} className="car-image" />
        </div>
      </section>

      <aside className="options-panel">
        <div className="panel-header">
          <h2>Personalização</h2>
          <button 
            className="finish-button"
            onClick={handleFinalizar}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enviando para Produção...' : 'Finalizar e Produzir'}
          </button>
        </div>

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
      </aside> 
    </div>
  );
};

export default Personalizacao;
