
const express = require('express');
const cors = require('cors');
const axios = require('axios'); 
require('dotenv').config();

const db = require('./config/db');
const mapeamentos = require('./mapeamentos'); 


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

    switch (carro.categoria) {
        case 'Popular':
            blocoConfig.lamina1 = mapeamentos.coresGerais[p.corExterna] || 0;
            blocoConfig.lamina2 = mapeamentos.cambio[p.cambio] || 0;
            break;
        case 'Esportivo':
            blocoConfig.lamina1 = mapeamentos.coresGerais[p.tracao] || 0;
            blocoConfig.lamina2 = mapeamentos.coresGerais[p.acabamentoCor] || 0;
            blocoConfig.lamina3 = p.aerofolio ? 5 : 0;
            break;
        case 'Luxo':
            blocoConfig.lamina1 = mapeamentos.coresGerais[p.materialInterno] || 0;
            blocoConfig.lamina2 = mapeamentos.coresGerais[p.iluminacao] || 0;
            blocoConfig.lamina3 = mapeamentos.coresGerais[p.materialInterno] || 0;
            break;
    }

    const caixa = { codigoProduto: carro.num_blocos };
    if (carro.num_blocos >= 1) caixa.bloco1 = blocoConfig;
    if (carro.num_blocos >= 2) caixa.bloco2 = { ...blocoConfig };
    if (carro.num_blocos >= 3) caixa.bloco3 = { ...blocoConfig };

    console.log("Objeto 'caixa' gerado para o Alexpress:", JSON.stringify(caixa, null, 2));
    return caixa;
}



// rota teste
app.get('/', async (req, res) => {
    res.json({ mensagem: '🚀 API Automod a funcionar!' });
});

// buscar carros
app.get('/api/carros', async (req, res) => {
    try {
        const query = `
            SELECT c.id, c.nome, cat.nome AS categoria, c.imagem_catalogo_url AS image
            FROM carros c
            JOIN categorias cat ON c.categoria_id = cat.id;
        `;
        const resultado = await db.query(query);
        res.json(resultado.rows);
    } catch (err) {
        res.status(500).json({ erro: 'Não foi possível buscar os carros.' });
    }
});

// buscar carro por ID
app.get('/api/carros/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT c.id, c.nome, cat.nome AS categoria, c.imagem_personalizacao_url AS image, c.num_blocos
            FROM carros c
            JOIN categorias cat ON c.categoria_id = cat.id
            WHERE c.id = $1;
        `;
        const resultado = await db.query(query, [id]);
        if (resultado.rows.length > 0) {
            res.json(resultado.rows[0]);
        } else {
            res.status(404).json({ erro: 'Carro não encontrado.' });
        }
    } catch (err) {
        res.status(500).json({ erro: 'Não foi possível buscar o carro solicitado.' });
    }
});

// buscar pedidos
app.get('/api/pedidos', async (req, res) => {
    try {
        const query = `
            SELECT p.id, c.nome AS carro_nome, p.criado_em, p.status, p.valor
            FROM pedidos p
            JOIN carros c ON p.carro_id = c.id
            ORDER BY p.criado_em DESC;
        `;
        const resultado = await db.query(query);
        res.json(resultado.rows);
    } catch (err) {
        res.status(500).json({ erro: 'Não foi possível buscar os pedidos.' });
    }
});

// criar novo pedido
app.post('/api/pedidos', async (req, res) => {
    const { carroId, personalizacoes, valor } = req.body;
    if (!carroId || !personalizacoes || !valor) {
        return res.status(400).json({ erro: 'Dados do pedido incompletos.' });
    }
    try {
        const query = `
            INSERT INTO pedidos (carro_id, personalizacoes, valor, status)
            VALUES ($1, $2, $3, 'No carrinho')
            RETURNING *;
        `;
        const resultado = await db.query(query, [carroId, personalizacoes, valor]);
        res.status(201).json(resultado.rows[0]);
    } catch (err) {
        console.error('🛑 ERRO AO CRIAR O PEDIDO:', err.stack);
        res.status(500).json({ erro: 'Não foi possível salvar o pedido.' });
    }
});

// enviar pedido para a maquina
app.post('/api/pedidos/:id/produzir', async (req, res) => {
    const { id } = req.params;
    try {
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

        console.log('✅ Pedido enviado com sucesso! ID da Máquina (jobId):', jobId);
        res.json({ mensagem: 'Pedido enviado para a fila de produção com sucesso!', jobId: jobId });
    } catch (err) {
        console.error('🛑 ERRO AO ENVIAR PARA A FILA DE PRODUÇÃO:', err.response ? err.response.data : err.message);
        res.status(500).json({ erro: 'Não foi possível enviar o pedido para a produção.' });
    }
});

app.listen(PORTA, () => {
    console.log(`✅ Servidor a rodar em http://localhost:${PORTA}`);
});

