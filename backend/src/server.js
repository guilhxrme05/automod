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

// Rota para buscar TODOS os carros
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
        console.error('----------------------------------');
        console.error('🛑 ERRO AO EXECUTAR A CONSULTA SQL:');
        console.error('----------------------------------');
        console.error('Consulta SQL:', err.query);
        console.error('Erro Detalhado:', err.stack);
        console.error('----------------------------------');
        res.status(500).json({ erro: 'Não foi possível buscar os carros.' });
    }
});

// Rota para buscar UM carro específico pelo ID
app.get('/api/carros/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT
                carros.id,
                carros.nome,
                categorias.nome AS categoria,
                carros.imagem_personalizacao_url AS image 
            FROM
                carros
            JOIN
                categorias ON carros.categoria_id = categorias.id
            WHERE
                carros.id = $1;
        `;
        const resultado = await db.query(query, [id]);
        if (resultado.rows.length > 0) {
            res.json(resultado.rows[0]);
        } else {
            res.status(404).json({ erro: 'Carro não encontrado.' });
        }
    } catch (err) {
        console.error('----------------------------------');
        console.error('🛑 ERRO AO EXECUTAR A CONSULTA SQL (BUSCA POR ID):');
        console.error('----------------------------------');
        console.error('ID Solicitado:', id);
        console.error('Erro Detalhado:', err.stack);
        console.error('----------------------------------');
        res.status(500).json({ erro: 'Não foi possível buscar o carro solicitado.' });
    }
});

// Rota para buscar TODOS os pedidos do sistema
app.get('/api/pedidos', async (req, res) => {
  try {
    const query = `
        SELECT
            pedidos.id,
            carros.nome AS carro_nome,
            pedidos.criado_em,
            pedidos.status,
            pedidos.valor
        FROM
            pedidos
        JOIN
            carros ON pedidos.carro_id = carros.id
        ORDER BY
            pedidos.criado_em DESC;
    `;
    const resultado = await db.query(query);
    res.json(resultado.rows);
  } catch (err) {
    console.error('🛑 ERRO AO BUSCAR OS PEDIDOS:', err.stack);
    res.status(500).json({ erro: 'Não foi possível buscar os pedidos.' });
  }
});



// Rota para CRIAR um novo pedido
app.post('/api/pedidos', async (req, res) => {
    const { carroId, personalizacoes, valor } = req.body;

    if (!carroId || !personalizacoes || !valor) {
        return res.status(400).json({ erro: 'Dados do pedido incompletos.' });
    }

    try {
        const query = `
            INSERT INTO pedidos (carro_id, personalizacoes, valor, status)
            VALUES ($1, $2, $3, 'Em Produção')
            RETURNING *;
        `;
        const resultado = await db.query(query, [carroId, personalizacoes, valor]);
        res.status(201).json(resultado.rows[0]);
    } catch (err) {
        console.error('🛑 ERRO AO CRIAR O PEDIDO:', err.stack);
        res.status(500).json({ erro: 'Não foi possível salvar o pedido.' });
    }
});


app.listen(PORTA, () => {
  console.log(`✅ Servidor a rodar em http://localhost:${PORTA}`);
});