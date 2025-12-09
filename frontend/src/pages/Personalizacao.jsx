import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // <--- Adicionado useLocation
import './Personalizacao.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
      { name: 'Cor Externa', type: 'color', key: 'cor_externa', items: [
        { value: '#ffffff' }, { value: '#000000' }, 
        { value: '#ff0000' }, { value: '#0000ff' }, 
        { value: '#f8ff32' }, { value: '#008000' }
      ]},
      { name: 'Acabamento', type: 'select', key: 'acabamento', values: ['Metálico', 'Fosco', 'Perolado', 'Sólido'] },
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
      { name: 'Material dos Bancos', type: 'select', key: 'material_interno', values: ['Couro', 'Couro sintético', 'Tecido', 'Alcântara'] },
      { name: 'Tecnologia dos Faróis', type: 'select', key: 'iluminacao', values: ['LED', 'OLED', 'Neon', 'Xenon', 'Laser'] },
    ]
  },
];

const blockConfig = {
  1: ['combustivel', 'cambio', 'cor_externa', 'roda'],
  2: ['combustivel', 'cambio', 'cor_externa', 'roda', 'acabamento', 'tracao', 'aerofolio'],
};

const Personalizacao = () => {
  const { carId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // <--- Hook para acessar o state da navegação

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selections, setSelections] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [iaAplicada, setIaAplicada] = useState(false);

  // BUSCA O CARRO
  useEffect(() => {
    const fetchCarData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/carros/${carId}`);
        if (!response.ok) throw new Error('Carro não encontrado');
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

  // APLICA AS SUGESTÕES DA IA (Lógica Atualizada)
  useEffect(() => {
    if (!car || loading) return;

    // 1. Tenta pegar do state da navegação (Método Principal da Opção 1)
    const iaSugestoesState = location.state?.iaData;

    // 2. Tenta pegar do localStorage (Fallback caso o usuário dê Refresh/F5)
    const iaSugestoesStorage = localStorage.getItem('ia_personalizacoes_sugeridas');
    const iaCarroId = localStorage.getItem('ia_carro_id');

    let sugestoes = null;

    if (iaSugestoesState) {
        // Prioridade: Dados vindos via navigate
        sugestoes = iaSugestoesState;
    } else if (iaCarroId === carId && iaSugestoesStorage) {
        // Fallback: Dados do localStorage (se o ID do carro bater)
        try {
            sugestoes = JSON.parse(iaSugestoesStorage);
        } catch (e) {
            console.error("Erro ao ler JSON do Storage", e);
        }
    }

    if (sugestoes) {
      const aplicaveis = {};

      Object.keys(sugestoes).forEach(key => {
        const existe = customizationOptions.flatMap(s => s.options).some(o => o.key === key);
        if (existe) {
          aplicaveis[key] = sugestoes[key];
        }
      });

      if (Object.keys(aplicaveis).length > 0) {
        setSelections(aplicaveis);
        setIaAplicada(true);
      }
      
      // OBS: Removemos o localStorage.removeItem daqui para evitar o bug do StrictMode.
      // A limpeza agora é feita no handleAddToCart.
    }
  }, [car, carId, loading, location.state]); 

  // INICIALIZA VALORES DEFAULT APENAS SE NÃO VEIO DA IA
  useEffect(() => {
    if (!car || iaAplicada || Object.keys(selections).length > 0) return;

    const allowedKeys = car.num_blocos >= 3 || !blockConfig[car.num_blocos]
      ? customizationOptions.flatMap(s => s.options).map(o => o.key)
      : blockConfig[car.num_blocos];

    const initial = {};
    customizationOptions.forEach(section => {
      section.options.forEach(opt => {
        if (allowedKeys.includes(opt.key)) {
          initial[opt.key] = opt.type === 'select' ? opt.values[0] : opt.items[0].value;
        }
      });
    });

    setSelections(initial);
  }, [car, iaAplicada]);

  const handleSelect = (key, value) => {
    setSelections(prev => ({ ...prev, [key]: value }));
  };

  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Você precisa estar logado!");
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ carroId: car.id, personalizacoes: selections, valor: 250000.00 })
      });

      if (!res.ok) throw new Error("Erro ao adicionar");
      
      // SUCESSO! Agora limpamos os dados da IA do localStorage para não interferir no futuro
      localStorage.removeItem('ia_carro_id');
      localStorage.removeItem('ia_personalizacoes_sugeridas');

      alert("Carro adicionado com sucesso!");
      navigate('/perfil');
    } catch (err) {
      setError("Erro ao adicionar ao carrinho");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="status-page">Carregando...</div>;
  if (error) return <div className="status-page error">{error}</div>;
  if (!car) return <div className="status-page">Carro não encontrado</div>;

  return (
    <div className="personalizacao-container">



      <section className="car-showcase">
        <div className="car-info">
          <h1>{car.nome}</h1>
          <img src={car.image} alt={car.nome} className="car-image" />
          {car.descricao && <p className="car-description">"{car.descricao}"</p>}
        </div>
      </section>

      <aside className="options-panel">
        <div className="panel-header">
          <h2>Personalização</h2>
          <button className="finish-button" onClick={handleAddToCart} disabled={isSubmitting}>
            {isSubmitting ? 'Adicionando...' : 'Adicionar ao Carrinho'}
          </button>
        </div>

        <div className="options-list">
          {customizationOptions.map((section, i) => {
            const allowed = !car.num_blocos || car.num_blocos >= 3 || !blockConfig[car.num_blocos]
              ? section.options
              : section.options.filter(opt => blockConfig[car.num_blocos].includes(opt.key));

            if (allowed.length === 0) return null;

            return (
              <div key={i} className="option-section">
                <h3>{section.title}</h3>
                {allowed.map(opt => (
                  <div key={opt.key} className="option-item">
                    <h4>{opt.name}</h4>
                    {opt.type === 'select' && (
                      <div className="select-group">
                        {opt.values.map(v => (
                          <button
                            key={v}
                            className={`select-button ${selections[opt.key] === v ? 'active' : ''}`}
                            onClick={() => handleSelect(opt.key, v)}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    )}
                    {opt.type === 'color' && (
                      <div className="option-grid">
                        {opt.items.map(item => (
                          <div
                            key={item.value}
                            className={`option-swatch color-swatch ${selections[opt.key] === item.value ? 'selected' : ''}`}
                            style={{ background: item.value }}
                            onClick={() => handleSelect(opt.key, item.value)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
};

export default Personalizacao;