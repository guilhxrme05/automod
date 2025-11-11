import React, { useState } from 'react';
import './AICustomizationQuiz.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Perguntas do Quiz
const quizQuestions = [
    { id: 'estilo', question: "Qual é o seu estilo de carro preferido?", options: ["Desportivo Agressivo", "Luxuoso Elegante", "Urbano Moderno", "Aventureiro Off-road"] },
    { id: 'performance', question: "Que tipo de performance procura?", options: ["Aceleração máxima", "Conforto na estrada", "Economia de combustível", "Capacidade em terrenos difíceis"] },
    { id: 'cores', question: "Qual paleta de cores lhe atrai mais?", options: ["Cores vibrantes (Vermelho, Amarelo)", "Tons sóbrios (Preto, Cinza, Branco)", "Cores metálicas (Prata, Grafite)", "Tons terrosos (Verde Musgo, Areia)"] },
    { id: 'interior', question: "Qual detalhe é mais importante no interior?", options: ["Tecnologia de ponta (ecrãs, som)", "Materiais premium (Couro, Alcântara)", "Espaço e praticidade", "Durabilidade e fácil limpeza"] },
];

const AICustomizationQuiz = () => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [quizComplete, setQuizComplete] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [recomendacao, setRecomendacao] = useState(null);

    const handleAnswerSelect = (option) => {
        const currentQuestionId = quizQuestions[currentQuestionIndex].id;
        const newAnswers = { ...answers, [currentQuestionId]: option };
        setAnswers(newAnswers);

        if (currentQuestionIndex < quizQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            setQuizComplete(true);
            // Envia as respostas finais para o nosso backend
            getAIRecommendations(newAnswers);
        }
    };

    // --- AQUI FAZEMOS A CHAMADA PARA O NOSSO BACKEND ---
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
                const errData = await response.json();
                throw new Error(errData.erro || "Falha ao buscar recomendação.");
            }

            const data = await response.json();
            const cleanedText = data.recomendacao.replace(/```markdown\n?|\n?```/g, '').trim();
            setRecomendacao(cleanedText);

        } catch (err) {
            console.error("Erro ao chamar nossa API:", err);
            setError(`Não foi possível obter recomendações: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const resetQuiz = () => {
        setCurrentQuestionIndex(0);
        setAnswers({});
        setQuizComplete(false);
        setRecomendacao(null);
        setError(null);
    };

    // --- Ecrã de Resultados ---
    if (quizComplete) {
        return (
            <div className="ai-quiz-container ai-results">
                <h2>Recomendações Personalizadas para Si:</h2>
                {loading && <div className="ai-loading"><div className="spinner"></div><p>A gerar as suas recomendações...</p></div>}
                {error && <p className="ai-error">{error}</p>}
                {recomendacao && (
                    <div className="ai-recomendacao">
                       {recomendacao.split('\n').map((line, index) => {
                           if (line.startsWith('* ') || line.startsWith('- ')) {
                               return <p key={index} className="ai-bullet">{line.substring(2)}</p>;
                           }
                           return <p key={index}>{line}</p>;
                       })}
                    </div>
                )}
                 <button onClick={resetQuiz} className="ai-button">Refazer Quiz</button>
            </div>
        );
    }

    // --- Ecrã de Perguntas ---
    const currentQuestion = quizQuestions[currentQuestionIndex];
    return (
        <div className="ai-quiz-container">
            <h2>Descubra a Sua Personalização Ideal!</h2>
            <p>Responda a algumas perguntas e deixe a nossa IA sugerir o estilo perfeito para si.</p>
            <div className="ai-quiz-progress">
                Pergunta {currentQuestionIndex + 1} de {quizQuestions.length}
            </div>
            <div className="ai-quiz-question">
                <h3>{currentQuestion.question}</h3>
                <div className="ai-quiz-options">
                    {currentQuestion.options.map((option, index) => (
                        <button key={index} onClick={() => handleAnswerSelect(option)} className="ai-option-button">
                            {option}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AICustomizationQuiz;