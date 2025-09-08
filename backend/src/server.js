// Importa os pacotes necessários
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Garante que as variáveis de ambiente sejam carregadas

// Importa a função de consulta do nosso arquivo de configuração do banco de dados
const db = require('./config/db');

// Inicializa a aplicação Express
const app = express();
const PORTA = process.env.PORT || 3001;

// --- Middlewares ---
app.use(cors());
app.use(express.json());




// Rota de Teste
app.get('/', async (req, res) => {
  try {
    const resultado = await db.query('SELECT NOW()');
    res.json({
      mensagem: '🚀 API a funcionar e ligada ao PostgreSQL!',
      horaDoBanco: resultado.rows[0].now,
    });
  } catch (err) {
    console.error('Erro ao conectar-se à base de dados:', err);
    res.status(500).json({ erro: 'Falha ao ligar à base de dados.' });
  }
});

// Rota para buscar os carros
app.get('/api/carros', async (req, res) => {
    try {
        const query = `
            SELECT
                carros.id,
                carros.nome,
                categorias.nome AS categoria,
                carros.imagem_catalogo_url AS image
            FROM
                carros
            JOIN
                categorias ON carros.categoria_id = categorias.id;
        `;
        const resultado = await db.query(query);
        res.json(resultado.rows);
    } catch (err) {
        // --- logzinha de erro
        console.error('----------------------------------');
        console.error('🛑 ERRO AO EXECUTAR A CONSULTA SQL:');
        console.error('----------------------------------');
        console.error('Consulta SQL:', err.query); // Mostra a consulta que falhou
        console.error('Erro Detalhado:', err.stack); // Mostra o erro completo
        console.error('----------------------------------');

        res.status(500).json({ erro: 'Não foi possível buscar os carros.' });
    }
});



app.listen(PORTA, () => {
  console.log(`✅ Servidor a rodar em http://localhost:${PORTA}`);
});

