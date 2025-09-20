// imports
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

// 
// converte as personalizaços do site para o formato da "caixa" da máquina
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



// teste
app.get('/', async (req, res) => res.json({ mensagem: '🚀 API Automod a funcionar!' }));

// rota pra buscar os carros
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
        console.error('🛑 ERRO AO BUSCAR CARROS:', err.stack);
        res.status(500).json({ erro: 'Não foi possível buscar os carros.' });
    }
});

// rota pra buscar carro por ID
app.get('/api/carros/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
    SELECT
        c.id, c.nome, cat.nome AS categoria,
        c.imagem_personalizacao_url AS image,
        c.num_blocos,
        c.descricao -- <<< ADICIONE ESTA LINHA
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
        console.error('🛑 ERRO AO BUSCAR CARRO POR ID:', err.stack);
        res.status(500).json({ erro: 'Não foi possível buscar o carro solicitado.' });
    }
});

// rota buscar historico de pedidos
app.get('/api/pedidos/historico', async (req, res) => {
    try {
        const query = `
            SELECT p.id, c.nome AS carro_nome, p.criado_em, p.status, p.valor
            FROM pedidos p JOIN carros c ON p.carro_id = c.id
            WHERE p.status != 'No carrinho'
            ORDER BY p.criado_em DESC;
        `;
        const resultado = await db.query(query);
        res.json(resultado.rows);
    } catch (err) {
        res.status(500).json({ erro: 'Não foi possível buscar o histórico de pedidos.' });
    }
});

//rota buscar itens no carrinho
app.get('/api/pedidos/carrinho', async (req, res) => {
    try {
        const query = `
            SELECT p.id, c.nome AS carro_nome, p.criado_em, p.status, p.valor
            FROM pedidos p JOIN carros c ON p.carro_id = c.id
            WHERE p.status = 'No carrinho'
            ORDER BY p.criado_em ASC;
        `;
        const resultado = await db.query(query);
        res.json(resultado.rows);
    } catch (err) {
        res.status(500).json({ erro: 'Não foi possível buscar os itens do carrinho.' });
    }
});


app.post('/api/pedidos', async (req, res) => {
    const { carroId, personalizacoes, valor } = req.body;
    if (!carroId || !personalizacoes || !valor) {
        return res.status(400).json({ erro: 'Dados do pedido incompletos.' });
    }
    try {
        const {
            combustivel, cambio, corExterna, acabamentoCor,
            materialExterno, aerofolio, roda, tracao,
            materialInterno, iluminacao
        } = personalizacoes;

        const query = `
            INSERT INTO pedidos (
                carro_id, valor, status, combustivel, cambio, cor_externa, 
                acabamento_cor, material_externo, aerofolio, roda, tracao, 
                material_interno, iluminacao
            )
            VALUES ($1, $2, 'No carrinho', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *;
        `;
        const values = [
            carroId, valor, combustivel, cambio, corExterna, acabamentoCor,
            materialExterno, aerofolio, roda, tracao, materialInterno, iluminacao
        ];
        
        const resultado = await db.query(query, values);
        res.status(201).json(resultado.rows[0]);
    } catch (err) {
        console.error('🛑 ERRO AO CRIAR O PEDIDO:', err.stack);
        res.status(500).json({ erro: 'Não foi possível salvar o pedido.' });
    }
});

// enviar pedido pra maquina produzir
app.post('/api/pedidos/:id/produzir', async (req, res) => {
    const { id } = req.params;
    try {
        const resultadoPedido = await db.query(
            `SELECT 
                p.id, c.num_blocos, c.id as carro_id, cat.nome as categoria,
                p.combustivel, p.cambio, p.cor_externa, p.acabamento_cor,
                p.material_externo, p.aerofolio, p.roda, p.tracao,
                p.material_interno, p.iluminacao
             FROM pedidos p 
             JOIN carros c ON p.carro_id = c.id 
             JOIN categorias cat ON c.categoria_id = cat.id 
             WHERE p.id = $1`,
            [id]
        );
        if (resultadoPedido.rows.length === 0) return res.status(404).json({ erro: 'Pedido não encontrado.' });
        
        const pedidoDoBanco = resultadoPedido.rows[0];

        // destrinchar as personalizacoes em individual
        const personalizacoesReconstruidas = {
            combustivel: pedidoDoBanco.combustivel,
            cambio: pedidoDoBanco.cambio,
            corExterna: pedidoDoBanco.cor_externa,
            acabamentoCor: pedidoDoBanco.acabamento_cor,
            materialExterno: pedidoDoBanco.material_externo,
            aerofolio: pedidoDoBanco.aerofolio,
            roda: pedidoDoBanco.roda,
            tracao: pedidoDoBanco.tracao,
            materialInterno: pedidoDoBanco.material_interno,
            iluminacao: pedidoDoBanco.iluminacao,
        };
        
        // passar pra traducao pra maquina
        const caixaParaMaquina = converterParaFormatoCaixa(personalizacoesReconstruidas, pedidoDoBanco);

        const middlewarePayload = {
            payload: {
                orderId: `PEDIDO-${pedidoDoBanco.id}`,
                sku: `CARRO-${pedidoDoBanco.carro_id}`,
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




// limpar carrinho todo
app.delete('/api/pedidos/carrinho', async (req, res) => {
    try {
        await db.query("DELETE FROM pedidos WHERE status = 'No carrinho'");
        res.status(204).send();
    } catch (err) {
        console.error('🛑 ERRO AO LIMPAR O CARRINHO:', err.stack);
        res.status(500).json({ erro: 'Não foi possível limpar o carrinho.' });
    }
});

// apagar item unico carrinho
app.delete('/api/pedidos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await db.query("DELETE FROM pedidos WHERE id = $1 AND status = 'No carrinho'", [id]);
        if (resultado.rowCount === 0) {
            return res.status(404).json({ erro: 'Item do carrinho não encontrado ou já processado.' });
        }
        res.status(204).send();
    } catch (err) {
        console.error('🛑 ERRO AO APAGAR ITEM DO CARRINHO:', err.stack);
        res.status(500).json({ erro: 'Não foi possível remover o item do carrinho.' });
    }
});

// iniciar server
app.listen(PORTA, () => {
    console.log(`Servidor a rodar em http://localhost:${PORTA}`);
});

