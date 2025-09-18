const mapeamentos = {
    
    corDoBloco: {
        'Gasolina': 1, 
        'Elétrico': 2, 
        'Híbrido':  3, 
    },
    
    coresGerais: {
        '#ffffff': 6, '#000000': 5, '#ff0000': 1, '#0000ff': 2,
        '#f8ff32': 3, '#008000': 4, '#c0c0c0': 6, '#808080': 5,

        
        'Metálico': 1, 'Fosco': 5, 'Perolado': 6,          // Acabamento da Cor
        'Dianteira': 4, 'Traseira': 1, '4x4': 2,           // Tipo de Tração (Verde, Vermelho, Azul)
        'Couro': 5, 'Tecido': 6, 'Alcântara': 2,           // Material do Interior
        'LED': 6, 'OLED': 0, 'Neon': 2, 'Xenon': 3, 'Laser': 1, // Tecnologia dos Faróis
    },
    
   
    cambio: {
        'Manual': 5,     // Código 5 = Preto
        'Automático': 6, // Código 6 = Branco
        'CVT': 0,        // Padrão
        'Borboleta': 1   // Padrão
    }
};


module.exports = mapeamentos;

