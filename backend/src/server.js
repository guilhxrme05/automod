
const express = require('express');
const cors = require('cors');
require('dotenv').config(); 


const db = require('./config/db');


const app = express();
const PORTA = process.env.PORT || 3001;


app.use(cors());
app.use(express.json());


function converterParaFormatoCaixa(personalizacoes, carro) {
    const p = personalizacoes;


    const blocoConfig = {
        cor: mapeamentos.corDoBloco[p.combustivel] || 1,
        lamina1: 0, lamina2: 0, lamina3: 0,
        padrao1: "0", padrao2: "0", padrao3: "0",
    };

    // Aplica as regras corretas com base na CATEGORIA do carro
    switch (carro.categoria) {
        case 'Popular':
            blocoConfig.lamina1 = mapeamentos.coresDasPlacas[p.corExterna] || 0; // Frente = Cor do Carro
            blocoConfig.lamina2 = mapeamentos.cambio[p.cambio] || 0;             // Direita = Câmbio
            // Esquerda = Tipo de Roda (Cor não importa, então fica 0)
            break;

        case 'Esportivo':
            blocoConfig.lamina1 = mapeamentos.coresDasPlacas[p.tracao] || 0;      // Frente = Tipo de Tração
            blocoConfig.lamina2 = mapeamentos.coresDasPlacas[p.acabamentoCor] || 0; // Direita = Acabamento
            // Esquerda = Aerofólio (Cor não importa, mas podemos indicar presença com uma cor padrão)
            blocoConfig.lamina3 = p.aerofolio ? 5 : 0; // Ex: Lâmina preta se tiver aerofólio
            break;

        case 'Luxo':
            blocoConfig.lamina1 = mapeamentos.coresDasPlacas[p.materialInterno] || 0; // Frente = Tipo de Interior
            blocoConfig.lamina2 = mapeamentos.coresDasPlacas[p.iluminacao] || 0;      // Direita = Faróis
            blocoConfig.lamina3 = mapeamentos.coresDasPlacas[p.materialInterno] || 0; // Esquerda = Material dos Bancos
            break;
    }

    // objeto caixa final
    const caixa = { codigoProduto: carro.num_blocos };
    if (carro.num_blocos >= 1) caixa.bloco1 = blocoConfig;
    if (carro.num_blocos >= 2) caixa.bloco2 = { ...blocoConfig };
    if (carro.num_blocos >= 3) caixa.bloco3 = { ...blocoConfig };

    console.log("Objeto 'caixa' gerado para o Alexpress:", JSON.stringify(caixa, null, 2));
    return caixa;
}


// teste
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

// rota buscar carros
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


// rota buscar carro pelo id pra personalizar
app.get('/api/carros/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT
                carros.id,
                carros.nome,
                categorias.nome AS categoria,
                carros.imagem_personalizacao_url AS image,
                carros.num_blocos -- <<< ADICIONE ESTA LINHA
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
        console.error('🛑 ERRO AO EXECUTAR A CONSULTA SQL (BUSCA POR ID):', err.stack);
        res.status(500).json({ erro: 'Não foi possível buscar o carro solicitado.' });
    }
});

// rota pra buscar pedidos
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



// rota criar pedido
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

// rota enviar pedido maquina
app.post('/api/pedidos/:id/produzir', async (req, res) => {
    const { id } = req.params;
    try {
        // Buscar o pedido E a categoria do carro
        const resultadoPedido = await db.query(
            `SELECT p.id, p.personalizacoes, c.num_blocos, c.id as carro_id, cat.nome as categoria 
             FROM pedidos p 
             JOIN carros c ON p.carro_id = c.id 
             JOIN categorias cat ON c.categoria_id = cat.id 
             WHERE p.id = $1`,
            [id]
        );
        if (resultadoPedido.rows.length === 0) return res.status(404).json({ erro: 'Pedido não encontrado.' });
        
        const pedido = resultadoPedido.rows[0];
        const caixaParaMaquina = converterParaFormatoCaixa(pedido.personalizacoes, pedido);

        const middlewarePayload = {
            payload: {
                orderId: `PEDIDO-${pedido.id}`,
                sku: `CARRO-${pedido.carro_id}`,
                caixa: caixaParaMaquina
            },
            callbackUrl: `http://localhost:3001/api/pedidos/callback`
        };

        const responseMiddleware = await axios.post('http://52.1.197.112:3000/queue/items', middlewarePayload);
        const jobId = responseMiddleware.data.id;

        await db.query("UPDATE pedidos SET status = 'Enviado para produção', middleware_job_id = $1 WHERE id = $2", [jobId, id]);

        res.json({ mensagem: 'Pedido enviado para a fila de produção com sucesso!', jobId: jobId });
    } catch (err) {
        console.error(' ERRO AO ENVIAR PARA A FILA DE PRODUÇÃO:', err.response ? err.response.data : err.message);
        res.status(500).json({ erro: 'Não foi possível enviar o pedido para a produção.' });
    }
});



app.listen(PORTA, () => {
  console.log(`✅ Servidor a rodar em http://localhost:${PORTA}`);
});