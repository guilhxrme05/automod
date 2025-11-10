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


// --- FUNÇÃO TRADUTORA (Correta - Monta a caixa completa) ---
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
    console.log("Objeto 'caixa' (multi-bloco) gerado:", JSON.stringify(caixa, null, 2));
    return caixa;
}


// --- ROTAS DA API ---

app.get('/', async (req, res) => res.json({ mensagem: '🚀 API Automod a funcionar!' }));

// Rotas GET
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
        // ATUALIZAÇÃO SPRINT 3: Adicionado "p.slot_expedicao" à consulta
        const query = `
            SELECT p.id, c.nome AS carro_nome, p.criado_em, p.status, p.valor, p.slot_expedicao
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
        const query = `SELECT p.id, c.nome AS carro_nome, p.criado_em, p.status, p.valor FROM pedidos p JOIN carros c ON p.carro_id = c.id WHERE p.status = 'No carrinho' ORDER BY p.criado_em ASC;`;
        const resultado = await db.query(query);
        res.json(resultado.rows);
    } catch (err) {
        res.status(500).json({ erro: 'Não foi possível buscar os itens do carrinho.' });
    }
});

// Rota POST para criar pedido
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

// Rota POST para enviar para produção
app.post('/api/pedidos/:id/produzir', async (req, res) => {
    const { id } = req.params;
    try {
        const checkExistente = await db.query("SELECT status FROM pedidos WHERE id = $1 AND status != 'No carrinho'", [id]);
        if (checkExistente.rows.length > 0) {
            console.warn(`⚠️ Tentativa de reenviar pedido ${id} que já está em processamento (${checkExistente.rows[0].status}).`);
            return res.status(409).json({ erro: `Este pedido (${checkExistente.rows[0].status}) já foi processado.` });
        }
        const resultadoPedido = await db.query( `SELECT p.*, c.num_blocos, c.id as carro_id, cat.nome as categoria FROM pedidos p JOIN carros c ON p.carro_id = c.id JOIN categorias cat ON c.categoria_id = cat.id WHERE p.id = $1`, [id] );
        if (resultadoPedido.rows.length === 0) return res.status(404).json({ erro: 'Pedido não encontrado.' });

        const pedidoDoBanco = resultadoPedido.rows[0];
        const caixaParaMaquina = converterParaFormatoCaixa(pedidoDoBanco, pedidoDoBanco);

        const middlewarePayload = {
            payload: {
                orderId: `PEDIDO-${pedidoDoBanco.id}`,
                sku: `CARRO-${pedidoDoBanco.carro_id}`,
                caixa: caixaParaMaquina
            },
            callbackUrl: `http://localhost:3001/api/pedidos/callback/${id}`
        };

        const responseMiddleware = await axios.post('http://localhost:3000/queue/items', middlewarePayload);
       //const responseMiddleware = await axios.post('http://52.1.197.112:3000/queue/items ', middlewarePayload);
    
        const jobId = responseMiddleware.data.id;

        await db.query("UPDATE pedidos SET status = 'Enviado para produção', middleware_job_id = $1 WHERE id = $2", [jobId, id]);

        console.log(`✅ Pedido ${id} enviado com sucesso! ID da Máquina (jobId):`, jobId);
        res.json({ mensagem: 'Pedido enviado para a fila de produção com sucesso!', jobId: jobId });
    } catch (err) {
        console.error(`🛑 ERRO AO ENVIAR O PEDIDO ${id} PARA A FILA:`, err.response ? err.response.data : err.message);
        if (!res.headersSent) {
             try { await db.query("UPDATE pedidos SET status = 'Erro ao enviar' WHERE id = $1", [id]); } 
             catch (revertError) { console.error('🛑 ERRO AO REVERTER STATUS:', revertError.stack); }
             res.status(500).json({ erro: 'Não foi possível enviar o pedido para a produção.' });
        }
    }
});

// Rota POST de Callback
app.post('/api/pedidos/callback/:pedidoId', async (req, res) => {
    const { pedidoId } = req.params;
    // ATUALIZAÇÃO SPRINT 3: Captura o 'slot' do corpo da requisição
    const { status, slot } = req.body;

    const statusValidos = ['Na fila', 'Enviado', 'Em produção', 'Concluído', 'Erro'];
    const novoStatus = status && statusValidos.includes(status) ? status : 'Erro no callback';

    try {
        // ATUALIZAÇÃO SPRINT 3: O comando UPDATE agora salva o 'status' E o 'slot_expedicao'
        await db.query(
            'UPDATE pedidos SET status = $1, slot_expedicao = $2 WHERE id = $3', 
            [novoStatus, slot, pedidoId] // Passa o slot para o SQL
        );
        
        console.log(`✅ CALLBACK: Pedido ${pedidoId} atualizado para status: ${novoStatus}. Slot: ${slot || 'N/A'}`);
        res.status(200).send('Callback recebido.');
    } catch (err) {
        console.error(`🛑 ERRO NO CALLBACK PARA PEDIDO ${pedidoId}:`, err);
        res.status(500).send('Erro no callback.');
    }
});



// Rota para limpar o carrinho todo
app.delete('/api/pedidos/carrinho', async (req, res) => {
    try {
        await db.query("DELETE FROM pedidos WHERE status = 'No carrinho'");
        res.status(204).send();
    } catch (err) {
        console.error('🛑 ERRO AO LIMPAR O CARRINHO:', err.stack);
        res.status(500).json({ erro: 'Não foi possível limpar o carrinho.' });
    }
});

// Rota para apagar um item único do carrinho
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




