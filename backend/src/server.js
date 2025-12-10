// --- IMPORTAÇÕES ---
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Adicione isso no seu .env depois: JWT_SECRET=uma_frase_muito_secreta_e_aleatoria
const JWT_SECRET = process.env.JWT_SECRET || 'segredo_temporario_dev';

const db = require('./config/db');
const mapeamentos = require('./mapeamentos');

// --- CONFIGURAÇÃO E MIDDLEWARES ---
const app = express();
const PORTA = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });

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
app.get('/', async (req, res) => res.json({ mensagem: 'rodando xd' }));

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

// === CARRINHO (Agora protegido e filtrado por usuário) ===
app.get('/api/pedidos/carrinho', autenticarToken, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, c.nome AS carro_nome 
       FROM pedidos p 
       JOIN carros c ON p.carro_id = c.id 
       WHERE p.status = 'No carrinho' AND p.user_id = $1`,
      [req.usuario.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar carrinho' });
  }
});

app.post('/api/ia/recomendacao', async (req, res) => {
    try {
        const { respostas } = req.body;

        if (!respostas || Object.keys(respostas).length === 0) {
            return res.status(400).json({ erro: "Respostas não fornecidas." });
        }

        const prompt = `
Você é o consultor premium da Automod. SÓ recomende carros e opções que existem de verdade no nosso catálogo.

=== CARROS REAIS COM CATEGORIA E ID ===
POPULAR (poucas opções - use para economia, dia a dia, urbano):
→ 14 - Chevrolet Onix
→ 15 - Volkswagen Polo  
→ 16 - Hyundai HB20

ESPORTIVO (média/alta personalização - use para performance, visual agressivo):
→ 8  - BMW M4
→ 9  - Audi R8
→ 10 - Porsche 911

LUXO (todas as opções liberadas - use para exclusividade, tecnologia máxima):
→ 11 - Lamborghini Urus
→ 12 - Bentley Bentayga
→ 13 - Rolls-Royce Cullinan

=== REGRAS DE PERSONALIZAÇÃO POR CATEGORIA ===

POPULAR (Onix, Polo, HB20):
→ Permitido: combustivel, cambio, cor_externa, roda
→ NÃO tem: acabamento, aerofolio, tracao 4x4, material_interno premium, iluminacao avançada

ESPORTIVO (M4, R8, 911):
→ Tudo do Popular +
→ acabamento: Metálico, Fosco, Perolado, Sólido
→ aerofolio: Sem, Lip Type, Ducktail Type, Gt Wing Type, Swan Neck Type, Retrátil
→ tracao: Dianteira, Traseira, 4x4

LUXO (Urus, Bentayga, Cullinan):
→ Tudo do Esportivo +
→ material_interno: Couro, Couro sintético, Tecido, Alcântara
→ iluminacao: LED, OLED, Neon, Xenon, Laser

Opções válidas em todas as categorias:
• combustivel: Gasolina, Elétrico, Híbrido
• cambio: Manual, Automático, CVT, Borboleta
• cor_externa: #ffffff(Branco), #000000(Preto), #ff0000(Vermelho), #0000ff(Azul), #f8ff32(Amarelo), #008000(Verde)
• roda: Asfalto comum, Asfalto premium, Drift, Rally, Off-road

=== RESPOSTAS DO CLIENTE ===
${Object.entries(respostas)
  .map(([chave, valor]) => `• ${chave}: ${valor}`)
  .join('\n')}

=== TAREFAS ===
1. Escolha a categoria mais adequada (Popular / Esportivo / Luxo)
2. Escolha EXATAMENTE 1 carro real da categoria (use o nome completo)
3. Monte a personalização usando SOMENTE as opções permitidas naquela categoria
4. Responda APENAS com JSON válido, exatamente neste formato:

{
  "categoria": "Popular" | "Esportivo" | "Luxo",
  "carro_recomendado": "nome completo do carro",
  "carro_id": ID_NUMÉRICO,
  "motivo": "máximo 2 frases curtas justificando",
  "personalizacoes": {
    // inclua apenas as chaves permitidas na categoria!
    "combustivel": "...",
    "cambio": "...",
    "cor_externa": "#ffffff",
    "roda": "...",
    "acabamento": "...",
    "aerofolio": "...",
    "tracao": "...",
    "material_interno": "...",
    "iluminacao": "..."
  }
}

Responda SOMENTE o JSON. Sem \`\`\`json, sem texto extra, sem explicações.`.trim();

        console.log("Enviando prompt para o Gemini...");

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const texto = response.text().trim();

        console.log("Resposta do Gemini:", texto);

        res.json({ recomendacao: texto });

    } catch (err) {
        console.error('Erro Gemini:', err);
        res.status(500).json({ erro: 'Erro na IA. Tente novamente.' });
    }
});
// === CRIAR PEDIDO ===
// === CARRINHO (Agora protegido e filtrado por usuário) ===

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
// === ESTOQUE DE CORES DE CHASSIS - PERSISTENTE EM MEMÓRIA ===
let estoqueChassis = [
  { id: 1, nome: "Preto",    hex: "#000000", codigoBloco: 1, quantidade: 25 },
  { id: 2, nome: "Vermelho", hex: "#C62828", codigoBloco: 2, quantidade: 18 },
  { id: 3, nome: "Azul",     hex: "#1565C0", codigoBloco: 3, quantidade: 22 }
];

// GET - lista todas as cores
app.get('/api/estoque/cores-chassis', (req, res) => {
  res.json(estoqueChassis);
});

// PUT - atualiza nome e/ou quantidade de uma cor
app.put('/api/estoque/cores-chassis/:id', (req, res) => {
  const id = Number(req.params.id);
  const { nome, quantidade } = req.body;

  const cor = estoqueChassis.find(c => c.id === id);
  if (!cor) return res.status(404).json({ erro: "Cor não encontrada" });

  if (nome !== undefined) cor.nome = nome;
  if (quantidade !== undefined) cor.quantidade = Number(quantidade);

  res.json(cor);
});

function autenticarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

    if (!token) return res.status(401).json({ erro: 'Acesso negado' });

    jwt.verify(token, JWT_SECRET, (err, usuario) => {
        if (err) return res.status(403).json({ erro: 'Token inválido' });
        req.usuario = usuario; // Salva o ID do usuário na requisição
        next();
    });
}

// === REGISTRO ===
app.post('/api/auth/registro', async (req, res) => {
    const { nome, email, senha, telefone, endereco } = req.body;
    try {
        // Criptografa a senha antes de salvar
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        const result = await db.query(
            'INSERT INTO usuarios (nome, email, senha_hash, telefone, endereco) VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, email',
            [nome, email, senhaHash, telefone, endereco]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ erro: 'Email já cadastrado' });
        res.status(500).json({ erro: 'Erro ao registrar usuário' });
    }
});

// === LOGIN ===
app.post('/api/auth/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(400).json({ erro: 'Usuário não encontrado' });

        const usuario = result.rows[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaValida) return res.status(400).json({ erro: 'Senha incorreta' });

        // Gera o Token
        const token = jwt.sign({ id: usuario.id, nome: usuario.nome }, JWT_SECRET, { expiresIn: '24h' });
        
        res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email } });
    } catch (err) {
        res.status(500).json({ erro: 'Erro no login' });
    }
});

// === ATUALIZAR PERFIL (Rota Nova) ===
app.put('/api/usuarios', autenticarToken, async (req, res) => {
    // Pegamos o ID do token (seguro) e os dados do corpo da requisição
    const userId = req.usuario.id;
    const { nome, telefone, endereco } = req.body;

    try {
        // Validação simples
        if (!nome) {
            return res.status(400).json({ erro: 'O nome é obrigatório.' });
        }

        // Atualiza no banco de dados e retorna os dados novos
        // O RETURNING é importante para atualizar o frontend imediatamente
        const query = `
            UPDATE usuarios 
            SET nome = $1, telefone = $2, endereco = $3 
            WHERE id = $4 
            RETURNING id, nome, email, telefone, endereco;
        `;
        
        const values = [nome, telefone, endereco, userId];
        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado.' });
        }

        // Retorna o objeto atualizado
        res.json(result.rows[0]);

    } catch (err) {
        console.error('ERRO AO ATUALIZAR PERFIL:', err);
        res.status(500).json({ erro: 'Erro interno ao atualizar perfil.' });
    }
});

// === MEUS PEDIDOS (Rota Protegida) ===
// Substitua ou adicione esta rota para pegar apenas os pedidos DO USUÁRIO LOGADO
app.get('/api/pedidos/meus-pedidos', autenticarToken, async (req, res) => {
    try {
        const query = `
            SELECT p.id, c.nome AS carro_nome, p.criado_em, p.status, p.valor 
            FROM pedidos p 
            JOIN carros c ON p.carro_id = c.id 
            WHERE p.usuario_id = $1 
            ORDER BY p.criado_em DESC;
        `;
        const resultado = await db.query(query, [req.usuario.id]);
        res.json(resultado.rows);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao buscar pedidos' });
    }
});

// === ADICIONAR ITEM AO CARRINHO ===
// === ADICIONAR AO CARRINHO - VERSÃO COMPATÍVEL COM O NOVO BANCO ===
app.post('/api/pedidos', autenticarToken, async (req, res) => {
  const { carroId, personalizacoes, valor = 250000.00 } = req.body;
  const userId = req.usuario.id;

  try {
    if (!carroId || !personalizacoes) {
      return res.status(400).json({ erro: 'Dados obrigatórios faltando' });
    }

    const {
      combustivel = null,
      cambio = null,
      cor_externa = null,
      acabamento = null,
      material_externo = null,
      aerofolio = null,
      roda = null,
      tracao = null,
      material_interno = null,
      iluminacao = null
    } = personalizacoes;

    // EXATAMENTE AS COLUNAS QUE VOCÊ TEM NO BANCO (na ordem certa)
    await db.query(`
      INSERT INTO pedidos (
        user_id,
        carro_id,
        valor,
        status,
        combustivel,
        cambio,
        cor_externa,
        acabamento,
        material_externo,
        aerofolio,
        roda,
        tracao,
        material_interno,
        iluminacao,
        slot_expedicao,
        entregue_em,
        atualizado_em
      ) VALUES (
        $1, $2, $3, 'No carrinho',
        $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        null, null, NOW()
      )
    `, [
      userId,
      carroId,
      valor,
      combustivel,
      cambio,
      cor_externa,
      acabamento,
      material_externo,
      aerofolio,
      roda,
      tracao,
      material_interno,
      iluminacao
    ]);

    res.status(201).json({
      sucesso: true,
      mensagem: "Adicionado ao carrinho com sucesso!"
    });

  } catch (err) {
    console.error("ERRO FINAL NO INSERT:", err);
    res.status(500).json({
      erro: "Não foi possível salvar",
      postgres: err.message,
      code: err.code
    });
  }
});
// ROTA NOVA: TODOS OS PEDIDOS DO USUÁRIO (HISTÓRICO COMPLETO)
app.get('/api/pedidos/meus-todos', autenticarToken, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        p.id,
        p.valor,
        p.criado_em,
        p.status,
        p.slot_expedicao,
        c.nome AS carro_nome
      FROM pedidos p
      JOIN carros c ON p.carro_id = c.id
      WHERE p.user_id = $1 AND p.status != 'No carrinho'
      ORDER BY p.criado_em DESC
    `, [req.usuario.id]);

    res.json(rows);
  } catch (err) {
    console.error('ERRO AO BUSCAR HISTÓRICO:', err);
    res.status(500).json({ erro: 'Erro ao carregar histórico' });
  }
});

// === INICIALIZAÇÃO ===
app.listen(PORTA, () => {
    console.log(`API rodando na porta ${PORTA}`);
    console.log(`Callback público: ${CALLBACK_BASE}`);
});