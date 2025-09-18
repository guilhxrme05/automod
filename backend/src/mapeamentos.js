

const mapeamentos = {
    // Regra 1: Cor do Bloco = Tipo de Combustível
    corDoBloco: {
        'Gasolina': 1, // Preto
        'Elétrico': 2, // Vermelho
        'Híbrido':  3, // Azul
    },
    
    //  Códigos de cores para as "Placas" (baseado na sua lista de LÂMINAS)
    // Usaremos isto para todas as opções onde "Cor Importa? = Sim"
    coresDasPlacas: {
        // Cores da Lataria
        '#ffffff': 6, '#000000': 5, '#ff0000': 1, '#0000ff': 2,
        '#f8ff32': 3, '#008000': 4, '#c0c0c0': 6, '#808080': 5,

        // tipo de tração
        'Dianteira': 4, 'Traseira': 1, '4x4': 2, // Ex: Verde, Vermelho, Azul

        // acabamento
        'Metálico': 1, 'Fosco': 5, 'Perolado': 6,

        // interior e Faróis
        'Couro': 5, 'Tecido': 6, 'Alcântara': 2,
        'LED': 6, 'OLED': 0, 'Neon': 2, 'Xenon': 3, 'Laser': 1,
    },
    
    // Regra 3: Mapeamento especial para Câmbio (Preto = Manual, Branco = Automático)
    cambio: {
        'Manual': 5,     // Código 5 = Preto
        'Automático': 6, // Código 6 = Branco
        'CVT': 0,        // Padrão sem cor
        'Borboleta': 1   // Padrão com cor
    }
};


module.exports = mapeamentos;

