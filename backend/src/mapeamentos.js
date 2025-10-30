// Dicionário final com todas as traduções DE/PARA,
// agora 100% sincronizado com o frontend e o backend.
const mapeamentos = {
    // Regra 1: Cor do Bloco é definida pelo Tipo de Combustível
    corDoBloco: {
        'Gasolina': 1, 
        'Elétrico': 2, 
        'Híbrido':  3, 
    },
    
    // Regra 2: Cor da Lataria (chave 'cor_externa' para bater com o frontend/BD)
    cor_externa: {
        '#ffffff': 6,
        '#000000': 5,
        '#ff0000': 1,
        '#0000ff': 2,
        '#f8ff32': 3,
        '#008000': 4,
    },
    
    // Regra 3: Acabamento (chave 'acabamento' para bater com o frontend/BD)
   acabamento: {
        'Metálico': 6,
        'Fosco': 5,
        'Perolado': 2,
        'Sólido': 0,
   },

   // Regra 4: Material Externo (chave 'material_externo' para bater com o frontend/BD)
   material_externo: {
        'Aço comum': 0,
        'Aço premium': 4,
        'Fibra de Carbono': 5,
        'Titânio': 2,
   },

   // Regra 5: Material Interno (chave 'material_interno' e corrigido 'Couro sintético')
   material_interno: {
        'Couro': 5,
        'Couro sintético': 6, // Corrigido para 's' minúsculo
        'Tecido': 3,
        'Alcântara': 1,
   },

   // Regra 6: Iluminação (corrigido 'LED')
   iluminacao: {
        'LED': 0, // Corrigido para 'LED' maiúsculo
        'OLED': 5,
        'Neon': 2,
        'Xenon': 4,
        'Laser': 1,
   },

   // Regra 7: Tração
   tracao: {
        'Dianteira': 0,
        'Traseira': 5,
        '4x4': 4,
   },

   // Regra 8: Câmbio
   cambio: {
        'Manual': 0,
        'Automático': 5, 
        'CVT': 2,
        'Borboleta': 6
   },

   // Regra 9: Roda
   roda: {
        'Asfalto comum': 0, 
        'Asfalto premium': 3, 
        'Drift': 6, 
        'Rally': 4, 
        'Off-road': 1
   },

   // Regra 10: Aerofólio
    aerofolio: {
        'Sem': 0,
        'Lip Type': 3,
        'Ducktail Type': 6,
        'Gt Wing Type': 5,
        'Swan Neck Type': 1,
        'Retrátil': 4,
    },
};

module.exports = mapeamentos;

