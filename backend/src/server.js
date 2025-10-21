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


// --- FUNÇÃO TRADUTORA (sem alterações) ---
function converterParaFormatoCaixa(pedido, carroInfo) {
    const p = pedido;
    const configBase = { cor: 0, lamina1: 0, lamina2: 0, lamina3: 0, padrao1: "0", padrao2: "0", padrao3: "0" };
    let bloco1Config = { ...configBase };
    let bloco2Config = { ...configBase };
    let bloco3Config = { ...configBase };
    const codigoCorBase = mapeamentos.corDoBloco[p.combustivel] || 1;
    bloco1Config.cor = codigoCorBase;
    bloco2Config.cor = codigoCorBase;
    bloco3Config.cor = codigoCorBase;
    if (carroInfo.num_blocos >= 1) {
        bloco1Config.lamina1 = mapeamentos.cor_externa[p.cor_externa] || 0;
        bloco1Config.lamina2 = mapeamentos.acabamento[p.acabamento] || 0;
        bloco1Config.padrao1 = mapeamentos.roda[p.roda] || "0";
    }
    if (carroInfo.num_blocos >= 2) {
        bloco2Config.lamina1 = mapeamentos.tracao[p.tracao] || 0;
        bloco2Config.padrao1 = mapeamentos.cambio[p.cambio] || "0";
        bloco2Config.lamina2 = mapeamentos.aerofolio[p.aerofolio] === 'Sem' ? 0 : 5;
    }
    if (carroInfo.num_blocos >= 3) {
        bloco3Config.lamina1 = mapeamentos.material_interno[p.material_interno] || 0;
        bloco3Config.lamina2 = mapeamentos.iluminacao[p.iluminacao] || 0;
        bloco3Config.lamina3 = mapeamentos.material_externo[p.material_externo] || 0;
    }
    const caixa = { codigoProduto: carroInfo.num_blocos };
    if (carroInfo.num_blocos >= 1) caixa.bloco1 = bloco1Config;
    if (carroInfo.num_blocos >= 2) caixa.bloco2 = bloco2Config;
    if (carroInfo.num_blocos >= 3) caixa.bloco3 = bloco3Config;
    return caixa;
}


// --- ROTAS DA API ---

app.get('/', async (req, res) => res.json({ mensagem: '🚀 API Automod a funcionar!' }));

// Suas rotas GET existentes (sem alterações)
app.get('/api/carros', async (req, res) => {
    try {
        const query = `SELECT c.id, c.nome, cat.nome AS categoria, c.imagem_catalogo_url AS image FROM carros c JOIN categorias cat ON c.categoria_id = cat.id;`;
        const resultado = await db.query(query);
        res.json(resultado.rows);
    } catch (err) {
        console.error('🛑 ERRO AO BUSCAR CARROS:', err.stack);
        res.status(500).json({ erro: 'Não foi possível buscar os carros.' });
    }
});

app.get('/api/carros/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `SELECT c.id, c.nome, cat.nome AS categoria, c.imagem_personalizacao_url AS image, c.num_blocos, c.descricao FROM carros c JOIN categorias cat ON c.categoria_id = cat.id WHERE c.id = $1;`;
        const resultado = await db.query(query, [id]);
        if (resultado.rows.length > 0) res.json(resultado.rows[0]);
        else res.status(404).json({ erro: 'Carro não encontrado.' });
    } catch (err) {
        console.error('🛑 ERRO AO BUSCAR CARRO POR ID:', err.stack);
        res.status(500).json({ erro: 'Não foi possível buscar o carro solicitado.' });
    }
});

app.get('/api/pedidos/historico', async (req, res) => {
    try {
        const query = `SELECT p.id, c.nome AS carro_nome, p.criado_em, p.status, p.valor FROM pedidos p JOIN carros c ON p.carro_id = c.id WHERE p.status != 'No carrinho' ORDER BY p.criado_em DESC;`;
        const resultado = await db.query(query);
        res.json(resultado.rows);
    } catch (err) {
        res.status(500).json({ erro: 'Não foi possível buscar o histórico de pedidos.' });
    }
});

app.get('/api/pedidos/carrinho', async (req, res) => {
    try {
        const query = `SELECT p.id, c.nome AS carro_nome, p.criado_em, p.status, p.valor FROM pedidos p JOIN carros c ON p.carro_id = c.id WHERE p.status = 'No carrinho' ORDER BY p.criado_em ASC;`;
        const resultado = await db.query(query);
        res.json(resultado.rows);
    } catch (err) {
        res.status(500).json({ erro: 'Não foi possível buscar os itens do carrinho.' });
    }
});

// Sua rota POST para criar pedidos (sem alterações)
app.post('/api/pedidos', async (req, res) => {
    const { carroId, personalizacoes, valor } = req.body;
    if (!carroId || !personalizacoes || !valor) {
        return res.status(400).json({ erro: 'Dados do pedido incompletos.' });
    }
    try {
        const { combustivel, cambio, cor_externa, acabamento, material_externo, aerofolio, roda, tracao, material_interno, iluminacao } = personalizacoes;
        const query = `INSERT INTO pedidos (carro_id, valor, status, combustivel, cambio, cor_externa, acabamento, material_externo, aerofolio, roda, tracao, material_interno, iluminacao) VALUES ($1, $2, 'No carrinho', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *;`;
        const values = [carroId, valor, combustivel, cambio, cor_externa, acabamento, material_externo, aerofolio, roda, tracao, material_interno, iluminacao];
        const resultado = await db.query(query, values);
        res.status(201).json(resultado.rows[0]);
    } catch (err) {
        console.error('🛑 ERRO AO CRIAR O PEDIDO:', err.stack);
        res.status(500).json({ erro: 'Não foi possível salvar o pedido.' });
    }
});


// <<< ROTA DE PRODUÇÃO ATUALIZADA PARA "FATIAR" O PEDIDO >>>
app.post('/api/pedidos/:id/produzir', async (req, res) => {
    const { id } = req.params;
    try {
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
        const caixaCompleta = converterParaFormatoCaixa(pedidoDoBanco, pedidoDoBanco);

        await db.query("UPDATE pedidos SET status = 'Em produção' WHERE id = $1", [id]);

        const jobIds = [];

        for (let i = 1; i <= pedidoDoBanco.num_blocos; i++) {
            const blocoAtual = caixaCompleta[`bloco${i}`];
            if (!blocoAtual) continue;

            const produtoResult = await db.query(
                'INSERT INTO produtos_pedido (pedido_id, bloco_numero, status) VALUES ($1, $2, $3) RETURNING id',
                [id, i, 'Na fila']
            );
            const produtoId = produtoResult.rows[0].id;

            const middlewarePayload = {
                payload: {
                    orderId: `PEDIDO-${id}-BLOCO-${i}`,
                    sku: `BLOCO-${i}`,
                    caixa: { codigoProduto: 1, bloco1: blocoAtual }
                },
                callbackUrl: `http://localhost:3001/api/producao/callback/${produtoId}`
            };
            
            const responseMiddleware = await axios.post('http://52.1.197.112:3000/queue/items', middlewarePayload);
            const jobId = responseMiddleware.data.id;

            await db.query('UPDATE produtos_pedido SET middleware_job_id = $1, status = $2 WHERE id = $3', [jobId, 'Enviado', produtoId]);
            jobIds.push(jobId);
        }

        res.json({ mensagem: 'Todos os blocos foram enviados para a fila de produção!', jobIds: jobIds });

    } catch (err) {
        console.error('🛑 ERRO AO ENVIAR PARA A FILA DE PRODUÇÃO:', err.response ? err.response.data : err.message);
        res.status(500).json({ erro: 'Não foi possível enviar o pedido para a produção.' });
    }
});


// <<< NOVA ROTA PARA RECEBER O CALLBACK DO MIDDLEWARE >>>
app.post('/api/producao/callback/:produtoId', async (req, res) => {
    const { produtoId } = req.params;
    const { status, slot } = req.body; // Captura o novo status e o slot

    try {
        await db.query('UPDATE produtos_pedido SET status = $1 WHERE id = $2', [status, produtoId]);
        console.log(`✅ CALLBACK: Produto ${produtoId} atualizado para status: ${status}. Slot: ${slot || 'N/A'}`);
        
        // Lógica para verificar se todos os produtos de um pedido estão concluídos
        const pedidoResult = await db.query('SELECT pedido_id FROM produtos_pedido WHERE id = $1', [produtoId]);
        if (pedidoResult.rows.length > 0) {
            const pedidoId = pedidoResult.rows[0].pedido_id;
            const todosProdutos = await db.query('SELECT status FROM produtos_pedido WHERE pedido_id = $1', [pedidoId]);
            const todosConcluidos = todosProdutos.rows.every(p => p.status === 'Concluído');

            if (todosConcluidos) {
                await db.query("UPDATE pedidos SET status = 'Concluído' WHERE id = $1", [pedidoId]);
                console.log(`🎉 PEDIDO COMPLETO: Pedido ${pedidoId} finalizado.`);
            }
        }

        res.status(200).send('Callback recebido.');
    } catch (err) {
        console.error(`🛑 ERRO NO CALLBACK PARA PRODUTO ${produtoId}:`, err);
        res.status(500).send('Erro no callback.');
    }
});


// <<< NOVA ROTA PARA O FRONTEND RASTREAR UM PEDIDO >>>
app.get('/api/pedidos/:id/rastreio', async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await db.query('SELECT * FROM produtos_pedido WHERE pedido_id = $1 ORDER BY bloco_numero ASC', [id]);
        res.json(resultado.rows);
    } catch (err) {
        res.status(500).json({ erro: 'Não foi possível rastrear os produtos do pedido.' });
    }
});


// Suas rotas DELETE (sem alterações)
app.delete('/api/pedidos/carrinho', async (req, res) => {
    try {
        await db.query("DELETE FROM pedidos WHERE status = 'No carrinho'");
        res.status(204).send();
    } catch (err) {
        console.error('🛑 ERRO AO LIMPAR O CARRINHO:', err.stack);
        res.status(500).json({ erro: 'Não foi possível limpar o carrinho.' });
    }
});

app.delete('/api/pedidos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const resultado = await db.query("DELETE FROM pedidos WHERE id = $1 AND status = 'No carrinho' RETURNING *", [id]);
        if (resultado.rowCount === 0) {
            return res.status(404).json({ erro: 'Item do carrinho não encontrado ou já processado.' });
        }
        res.status(204).send();
    } catch (err) {
        console.error('🛑 ERRO AO APAGAR ITEM DO CARRINHO:', err.stack);
        res.status(500).json({ erro: 'Não foi possível remover o item do carrinho.' });
    }
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
app.listen(PORTA, () => {
    console.log(`✅ Servidor a rodar em http://localhost:${PORTA}`);
});

