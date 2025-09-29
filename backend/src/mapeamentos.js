const mapeamentos = {

    corDoBloco: {
    'Gasolina': 1, 
    'Elétrico': 2, 
    'Híbrido':  3, 
    },

    corExterna: {
    '#ffffff': 6,
    '#000000': 5,
    '#ff0000': 1,
    '#0000ff': 2,
    '#f8ff32': 3,
    '#008000': 4,
    },

   acabamentoCor: {
    'Metálico': 6,
    'Fosco': 5,
    'Perolado': 2,
    'Sólido': 0,
   },

   materialExterno: {
    'Aço comum': 0,
    'Aço premium': 4,
    'Fibra de Carbono': 5,
    'Titânio': 2,
   },

   materialInterno: {
    'Couro': 5,
    'Couro Sintético': 6,
    'Tecido': 3,
    'Alcântara': 1,
   },

   iluminacao: {
    'Led': 0,
    'Oled': 5,
    'Neon': 2,
    'Xenon': 4,
    'Laser': 1,
   },

   tracao: {
    'Dianteira': 0,
    'Traseira': 5,
    '4x4': 4,
   },

   cambio: {
    'Manual': 0,
    'Automático': 5, 
    'CVT': 2,
    'Borboleta': 6
   },

   roda: {
    'Asfalto comum': 0, 
    'Asfalto premium': 3, 
    'Drift': 6, 
    'Rally': 4, 
    'Off-road': 1
   },

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