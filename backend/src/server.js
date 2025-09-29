// --- IMPORTAÇÕES ---
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const db = require('./config/db');
const mapeamentos = require('./mapeamentos');

// --- CONFIGURAÇÃO E MIDDLEWARES ---
const app = express();
const PORTA = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());


// --- FUNÇÃO TRADUTORA FINAL ---
// Esta versão usa a estrutura de banco de dados (com colunas separadas)
// e o dicionário completo para traduzir o pedido para a "caixa".
function converterParaFormatoCaixa(pedido, carroInfo) {
    const p = pedido; // 'p' agora é a linha inteira da tabela 'pedidos'

    // 1. Traduz cada valor das colunas do banco para o código da máquina.
    const codigoCor = mapeamentos.corDoBloco[p.combustivel] || 1;
    const codigoLamina1 = mapeamentos.cor_externa[p.cor_externa] || 0;
    const codigoLamina2 = mapeamentos.acabamento[p.acabamento] || 0;
    const codigoLamina3 = mapeamentos.material_externo[p.material_externo] || 0;
    const codigoPadrao1 = mapeamentos.roda[p.roda] || "0";
    const codigoPadrao2 = mapeamentos.cambio[p.cambio] || "0";
    const codigoPadrao3 = mapeamentos.tracao[p.tracao] || "0";
    
    // As outras opções ('aerofolio', 'material_interno', 'iluminacao')
    // ficam guardadas no nosso BD, mas não são enviadas pois não há
    // mais parâmetros disponíveis na "caixa" da máquina.

    // 2. Monta a configuração do bloco.
    const blocoConfig = {
        cor: codigoCor,
        lamina1: codigoLamina1,
        lamina2: codigoLamina2,
        lamina3: codigoLamina3,
        padrao1: codigoPadrao1,
        padrao2: codigoPadrao2,
        padrao3: codigoPadrao3,
    };

    // 3. Monta o objeto 'caixa' final.
    const caixa = { codigoProduto: carroInfo.num_blocos };
    if (carroInfo.num_blocos >= 1) caixa.bloco1 = blocoConfig;
    if (carroInfo.num_blocos >= 2) caixa.bloco2 = { ...blocoConfig };
    if (carroInfo.num_blocos >= 3) caixa.bloco3 = { ...blocoConfig };

    console.log("Objeto 'caixa' gerado para o Alexpress:", JSON.stringify(caixa, null, 2));
    return caixa;
}


// --- ROTAS DA API ---

app.get('/', async (req, res) => res.json({ mensagem: '🚀 API Automod a funcionar!' }));

app.get('/api/carros', async (req, res) => {
    try {
        const query = `
            SELECT c.id, c.nome, cat.nome AS categoria, c.imagem_catalogo_url AS image
            FROM carros c JOIN categorias cat ON c.categoria_id = cat.id;
        `;
        const resultado = await db.query(query);
        res.json(resultado.rows);
    } catch (err) {
        res.status(500).json({ erro: 'Não foi possível buscar os carros.' });
    }
});

app.get('/api/carros/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT c.id, c.nome, cat.nome AS categoria, c.imagem_personalizacao_url AS image, c.num_blocos, c.descricao
            FROM carros c JOIN categorias cat ON c.categoria_id = cat.id
            WHERE c.id = $1;
        `;
        const resultado = await db.query(query, [id]);
        if (resultado.rows.length > 0) res.json(resultado.rows[0]);
        else res.status(404).json({ erro: 'Carro não encontrado.' });
    } catch (err) {
        res.status(500).json({ erro: 'Não foi possível buscar o carro solicitado.' });
    }
});

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

// <<< ROTA ATUALIZADA para corresponder à nova estrutura da tabela 'pedidos' >>>
app.post('/api/pedidos', async (req, res) => {
    const { carroId, personalizacoes, valor } = req.body;
    if (!carroId || !personalizacoes || !valor) {
        return res.status(400).json({ erro: 'Dados do pedido incompletos.' });
    }
    try {
        // Desestrutura o objeto 'personalizacoes' para pegar cada valor individualmente
        const {
            combustivel, cambio, cor_externa, acabamento,
            material_externo, aerofolio, roda, tracao,
            material_interno, iluminacao
        } = personalizacoes;

        const query = `
            INSERT INTO pedidos (
                carro_id, valor, status, combustivel, cambio, cor_externa, 
                acabamento, material_externo, aerofolio, roda, tracao, 
                material_interno, iluminacao
            ) VALUES ($1, $2, 'No carrinho', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *;
        `;
        const values = [
            carroId, valor, combustivel, cambio, cor_externa, 
            acabamento, material_externo, aerofolio, roda, tracao, 
            material_interno, iluminacao
        ];
        
        const resultado = await db.query(query, values);
        res.status(201).json(resultado.rows[0]);
    } catch (err) {
        console.error('🛑 ERRO AO CRIAR O PEDIDO:', err.stack);
        res.status(500).json({ erro: 'Não foi possível salvar o pedido.' });
    }
});

// Rotas DELETE (sem alterações)
app.delete('/api/pedidos/carrinho', async (req, res) => { /* ...código da rota... */ });
app.delete('/api/pedidos/:id', async (req, res) => { /* ...código da rota... */ });


// <<< ROTA ATUALIZADA para ler as colunas individuais antes de traduzir >>>
app.post('/api/pedidos/:id/produzir', async (req, res) => {
    const { id } = req.params;
    try {
        // A consulta SQL agora busca todas as colunas de personalização individualmente
        const resultadoPedido = await db.query(
            `SELECT p.*, c.num_blocos, c.id as carro_id, cat.nome as categoria 
             FROM pedidos p 
             JOIN carros c ON p.carro_id = c.id 
             JOIN categorias cat ON c.categoria_id = cat.id 
             WHERE p.id = $1`,
            [id]
        );
        if (resultadoPedido.rows.length === 0) return res.status(404).json({ erro: 'Pedido não encontrado.' });
        
        const pedidoDoBanco = resultadoPedido.rows[0];
        
        // A função tradutora agora recebe a linha inteira do pedido (que já contém as personalizações)
        const caixaParaMaquina = converterParaFormatoCaixa(pedidoDoBanco, pedidoDoBanco);

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

// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORTA, () => {
    console.log(`✅ Servidor a rodar em http://localhost:${PORTA}`);
});

