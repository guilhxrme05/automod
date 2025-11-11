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

// URL PÚBLICA DO CALLBACK (máquina real consegue acessar)
const CALLBACK_BASE = process.env.CALLBACK_BASE_URL || 'https://api-node-automod.onrender.com';

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
app.get('/', async (req, res) => res.json({ mensagem: 'API Automod Sprint03 FINALIZADA!' }));

// === CATÁLOGO ===
app.get('/api/carros', async (req, res) => {
    try {
        const query = `SELECT c.id, c.nome, cat.nome AS categoria, c.imagem_catalogo_url AS image FROM carros c JOIN categorias cat ON c.categoria_id = cat.id;`;
        const resultado = await db.query(query);
        res.json(resultado.rows);
    } catch (err) {
        console.error('ERRO AO BUSCAR CARROS:', err.stack);
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
        console.error('ERRO AO BUSCAR CARRO POR ID:', err.stack);
        res.status(500).json({ erro: 'Não foi possível buscar o carro solicitado.' });
    }
});

// === PEDIDOS ===
app.get('/api/pedidos/historico', async (req, res) => {
    try {
        const query = `
            SELECT p.id, c.nome AS carro_nome, p.criado_em, p.status, p.valor, p.slot_expedicao
            FROM pedidos p JOIN carros c ON p.carro_id = c.id
            WHERE p.status != 'No carrinho'
            ORDER BY p.criado_em DESC;
        `;
        const resultado = await db.query(query);
        res.json(resultado.rows);
    } catch (err) {
        res.status(500).json({ erro: 'Não foi possível buscar o histórico.' });
    }
});

app.get('/api/pedidos/carrinho', async (req, res) => {
    try {
        const query = `SELECT p.id, c.nome AS carro_nome, p.criado_em, p.status, p.valor FROM pedidos p JOIN carros c ON p.carro_id = c.id WHERE p.status = 'No carrinho' ORDER BY p.criado_em ASC;`;
        const resultado = await db.query(query);
        res.json(resultado.rows);
    } catch (err) {
        res.status(500).json({ erro: 'Não foi possível buscar o carrinho.' });
    }
});

// === CRIAR PEDIDO ===
app.post('/api/pedidos', async (req, res) => {
    const { carroId, personalizacoes, valor } = req.body;
    if (!carroId || !personalizacoes || !valor) {
        return res.status(400).json({ erro: 'Dados incompletos.' });
    }
    try {
        const { combustivel, cambio, cor_externa, acabamento, material_externo, aerofolio, roda, tracao, material_interno, iluminacao } = personalizacoes;
        const query = `INSERT INTO pedidos (carro_id, valor, status, combustivel, cambio, cor_externa, acabamento, material_externo, aerofolio, roda, tracao, material_interno, iluminacao) 
                       VALUES ($1, $2, 'No carrinho', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *;`;
        const values = [carroId, valor, combustivel, cambio, cor_externa, acabamento, material_externo, aerofolio, roda, tracao, material_interno, iluminacao];
        const resultado = await db.query(query, values);
        res.status(201).json(resultado.rows[0]);
    } catch (err) {
        console.error('ERRO AO CRIAR PEDIDO:', err.stack);
        res.status(500).json({ erro: 'Não foi possível salvar o pedido.' });
    }
});

// === ENVIAR PARA PRODUÇÃO ===
app.post('/api/pedidos/:id/produzir', async (req, res) => {
    const { id } = req.params;
    try {
        // Evita reenvio
        const jaEnviado = await db.query("SELECT status FROM pedidos WHERE id = $1 AND status != 'No carrinho'", [id]);
        if (jaEnviado.rows.length > 0) {
            return res.status(409).json({ erro: `Pedido já está ${jaEnviado.rows[0].status}` });
        }

        const pedido = (await db.query(`
            SELECT p.*, c.num_blocos, c.id as carro_id 
            FROM pedidos p 
            JOIN carros c ON p.carro_id = c.id 
            WHERE p.id = $1`, [id])).rows[0];

        if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado.' });

        const caixa = converterParaFormatoCaixa(pedido, pedido);

        // CALLBACK PÚBLICO!
        const callbackUrl = `${CALLBACK_BASE}/api/pedidos/callback/${id}`;

        const payload = {
            payload: {
                orderId: `PEDIDO-${pedido.id}`,
                sku: `CARRO-${pedido.carro_id}`,
                caixa
            },
            callbackUrl
        };

        // TROCA AQUI PRA MÁQUINA REAL (só mudar a variável)
        const USE_REAL_MACHINE = false;
        const MIDDLEWARE_URL = USE_REAL_MACHINE
            ? 'http://52.1.197.112:3000'
            : 'http://localhost:3001';

        const response = await axios.post(`${MIDDLEWARE_URL}/queue/items`, payload);
        const jobId = response.data.id;

        await db.query("UPDATE pedidos SET status = 'Enviado para produção', middleware_job_id = $1 WHERE id = $2", [jobId, id]);

        res.json({ mensagem: 'Enviado para produção!', jobId });
    } catch (err) {
        console.error('ERRO AO ENVIAR PARA PRODUÇÃO:', err.response?.data || err.message);
        await db.query("UPDATE pedidos SET status = 'Erro ao enviar' WHERE id = $1", [id]).catch(() => {});
        res.status(500).json({ erro: 'Falha ao enviar para produção.' });
    }
});

// === CALLBACK DA MÁQUINA (público) ===
app.post('/api/pedidos/callback/:pedidoId', async (req, res) => {
    const { pedidoId } = req.params;
    const { status = 'Erro', slot } = req.body;

    try {
        await db.query(
            'UPDATE pedidos SET status = $1, slot_expedicao = $2, atualizado_em = NOW() WHERE id = $3',
            [status, slot || null, pedidoId]
        );
        console.log(`CALLBACK → Pedido ${pedidoId} | Status: ${status} | Slot: ${slot}`);
        res.json({ ok: true });
    } catch (err) {
        console.error('ERRO NO CALLBACK:', err);
        res.status(500).json({ erro: 'callback falhou' });
    }
});

// === CONFIRMAR ENTREGA + LIBERAR SLOT ===
app.post('/api/pedidos/:id/entregar', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE pedidos SET status = 'Entregue', entregue_em = NOW() WHERE id = $1", [id]);

        const { rows } = await db.query("SELECT slot_expedicao FROM pedidos WHERE id = $1", [id]);
        const slot = rows[0]?.slot_expedicao;

        if (slot) {
            const liberarUrl = `http://52.1.197.112:3000/estoque/${slot}`;
            await fetch(liberarUrl, { method: 'DELETE' }).catch(() => {});
            console.log(`Slot ${slot} liberado na máquina real`);
        }

        res.json({ sucesso: true, mensagem: "Entrega confirmada! Slot liberado." });
    } catch (err) {
        console.error('ERRO AO CONFIRMAR ENTREGA:', err);
        res.status(500).json({ erro: err.message });
    }
});

// === LIMPAR CARRINHO ===
app.delete('/api/pedidos/carrinho', async (req, res) => {
    try {
        await db.query("DELETE FROM pedidos WHERE status = 'No carrinho'");
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao limpar carrinho' });
    }
});

app.delete('/api/pedidos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query("DELETE FROM pedidos WHERE id = $1 AND status = 'No carrinho' RETURNING *", [id]);
        if (result.rowCount === 0) return res.status(404).json({ erro: 'Item não encontrado ou já processado' });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao remover item' });
    }
});

// === MOCK DA MÁQUINA (slots 1-12) ===
const crypto = require('crypto');
const jobQueue = {};

app.post('/queue/items', (req, res) => {
    if (!req.body?.payload?.caixa) return res.status(400).json({ error: "Payload inválido" });

    const jobId = crypto.randomBytes(12).toString('hex');
    const { payload, callbackUrl } = req.body;

    jobQueue[jobId] = { id: jobId, status: 'Na fila', payload, callbackUrl, criadoEm: new Date() };
    res.status(201).json({ id: jobId });

    setTimeout(async () => {
        if (jobQueue[jobId]) {
            jobQueue[jobId].status = 'Concluído';
            jobQueue[jobId].concluidoEm = new Date();
            const slot = String(Math.floor(Math.random() * 12) + 1);
            jobQueue[jobId].slot = slot;

            await fetch(callbackUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Concluído', slot })
            }).catch(() => {});
        }
    }, 5000);
});

app.get('/queue/items', (req, res) => {
    const jobs = Object.values(jobQueue).map(j => ({
        id: j.id,
        status: j.status,
        orderId: j.payload?.orderId || null,
        slot: j.slot || null,
        concluido_em: j.concluidoEm || null
    }));
    res.json({ total: jobs.length, jobs });
});

// GET - CORES DE CHASSIS DISPONÍVEIS (mock perfeito)
app.get('/api/estoque/cores-chassis', (req, res) => {
  res.json([
    { id: 1, nome: "Preto",    hex: "#000000", codigoBloco: 1, quantidade: 25 },
    { id: 2, nome: "Vermelho", hex: "#C62828", codigoBloco: 2, quantidade: 18 },
    { id: 3, nome: "Azul",     hex: "#1565C0", codigoBloco: 3, quantidade: 22 }
  ]);
});

// === INICIALIZAÇÃO ===
app.listen(PORTA, () => {
    console.log(`API rodando na porta ${PORTA}`);
    console.log(`Callback público: ${CALLBACK_BASE}`);
});