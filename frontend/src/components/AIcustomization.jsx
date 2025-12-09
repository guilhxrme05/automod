import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // <--- IMPORT ESSENCIAL
import './AICustomizationQuiz.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const quizQuestions = [
    { id: 'estilo', question: "Qual é o seu estilo de carro preferido?", options: ["Desportivo Agressivo", "Luxuoso Elegante", "Urbano Moderno", "Aventureiro Off-road"] },
    { id: 'performance', question: "Que tipo de performance procura?", options: ["Aceleração máxima", "Conforto na estrada", "Economia de combustível", "Capacidade em terrenos difíceis"] },
    { id: 'cores', question: "Qual paleta de cores lhe atrai mais?", options: ["Cores vibrantes (Vermelho, Amarelo)", "Tons sóbrios (Preto, Cinza, Branco)", "Cores metálicas (Prata, Grafite)", "Tons terrosos (Verde Musgo, Areia)"] },
    { id: 'interior', question: "Qual detalhe é mais importante no interior?", options: ["Tecnologia de ponta (ecrãs, som)", "Materiais premium (Couro, Alcântara)", "Espaço e praticidade", "Durabilidade e fácil limpeza"] },
];

const AICustomizationQuiz = () => {
    const navigate = useNavigate(); // <--- ESSA LINHA É A MÁGICA

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [quizComplete, setQuizComplete] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [recomendacao, setRecomendacao] = useState(null);

    const handleAnswerSelect = (option) => {
        const currentId = quizQuestions[currentQuestionIndex].id;
        const newAnswers = { ...answers, [currentId]: option };
        setAnswers(newAnswers);

        if (currentQuestionIndex < quizQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            setQuizComplete(true);
            getAIRecommendations(newAnswers);
        }
    };

    const getAIRecommendations = async (finalAnswers) => {
        setLoading(true);
        setError(null);
        setRecomendacao(null);

        try {
            const response = await fetch(`${API_URL}/api/ia/recomendacao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ respostas: finalAnswers })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.erro || "Erro na comunicação com a IA");
            }

            const data = await response.json();
            let resultado;

            try {
                resultado = JSON.parse(data.recomendacao);
            } catch {
                const jsonMatch = data.recomendacao.match(/\{[\s\S]*\}/);
                if (!jsonMatch) throw new Error("Resposta da IA inválida");
                resultado = JSON.parse(jsonMatch[0]);
            }

            if (!resultado.carro_id || !resultado.carro_recomendado || !resultado.personalizacoes) {
                throw new Error("Recomendação incompleta");
            }

            setRecomendacao(resultado);

        } catch (err) {
            console.error("Erro na IA:", err);
            setError("Não foi possível gerar a recomendação. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    // FUNÇÃO CORRIGIDA: usa navigate() em vez de window.location
// AICustomizationQuiz.js

const irParaPersonalizacaoComIA = () => {
    // Não precisa mais de localStorage aqui
    navigate(`/personalizacao/${recomendacao.carro_id}`, { 
        state: { 
            iaData: recomendacao.personalizacoes,
            fromIA: true 
        } 
    });
};

    const resetQuiz = () => {
        setCurrentQuestionIndex(0);
        setAnswers({});
        setQuizComplete(false);
        setRecomendacao(null);
        setError(null);
    };

    // TELA DE RESULTADO
    if (quizComplete) {
        return (
            <div className="ai-quiz-container ai-results">
                <h2>Sua Recomendação Perfeita Está Pronta!</h2>

                {loading && (
                    <div className="ai-loading">
                        <div className="spinner"></div>
                        <p>A IA está montando seu carro dos sonhos...</p>
                    </div>
                )}

                {error && <p className="ai-error">{error}</p>}

                {recomendacao && (
                    <div className="ai-recomendacao-final">
                        <div className="categoria-badge">
                            {recomendacao.categoria}
                        </div>

                        <h3 className="carro-titulo">{recomendacao.carro_recomendado}</h3>

                        <p className="motivo">
                            <strong>Por que escolhemos este carro:</strong><br />
                            {recomendacao.motivo}
                        </p>

                        {/* BOTÃO 100% FUNCIONAL */}
                        <button
                            onClick={irParaPersonalizacaoComIA}
                            className="ai-button primary big"
                        >
                            Personalizar com Todas as Opções da IA
                        </button>

                        <details className="detalhes-personalizacao">
                            <summary>Ver configuração sugerida pela IA</summary>
                            <ul>
                                {Object.entries(recomendacao.personalizacoes || {}).map(([chave, valor]) => (
                                    <li key={chave}>
                                        <strong>
                                            {chave.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                                        </strong>{' '}
                                        {valor}
                                    </li>
                                ))}
                            </ul>
                        </details>

                        <button onClick={resetQuiz} className="ai-button secondary" style={{ marginTop: '20px' }}>
                            Refazer o Quiz
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // TELA DAS PERGUNTAS
    const currentQuestion = quizQuestions[currentQuestionIndex];

    return (
        <div className="ai-quiz-container">
            <h2>Monte Seu Carro dos Sonhos com Inteligência Artificial</h2>
            <p>Responda 4 perguntas e deixe a IA criar o carro perfeito para você.</p>

            <div className="ai-quiz-progress">
                Pergunta {currentQuestionIndex + 1} de {quizQuestions.length}
            </div>

            <div className="ai-quiz-question">
                <h3>{currentQuestion.question}</h3>
                <div className="ai-quiz-options">
                    {currentQuestion.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleAnswerSelect(option)}
                            className="ai-option-button"
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AICustomizationQuiz;