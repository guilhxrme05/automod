# AutoMod

## 👥 Integrantes do Projeto

- [Guilherme Cabral](https://github.com/guilhxrme05)
- [Pedro Henrique](https://github.com/phenrique180)
- [Thomaz B.](https://github.com/T0MMY-z)
- [Felipe](https://github.com/felipewnoob)

---


## Introdução

O projeto AutoMod foi desenvolvido por nosso grupo com o objetivo de criar uma plataforma online que permite aos usuários personalizar carros de forma simples e intuitiva. Através do sistema, o cliente pode escolher modelos, cores, interiores e outros detalhes, além de realizar pedidos diretamente pela plataforma. Para enriquecer a experiência, integramos uma bancada física que simula as personalizações feitas, trazendo a inovação da automação industrial para a indústria automotiva de forma educativa e prática.

## 🧱 Analogia Física: Blocos, Placas e Chassis

O projeto AutoMod utiliza uma bancada automatizada para representar fisicamente a personalização dos carros feitos no site. Cada carro é representado por um **bloco** (ou mais), montado sobre um **chassi**, com **placas coloridas** indicando características específicas.

---

### 🔵 Cor do Bloco = Tipo de Combustível

| Cor do Bloco | Combustível     |
|--------------|-----------------|
| Vermelho     | Gasolina        |
| Verde        | Elétrico        |
| Azul         | Híbrido         |

---

## 🚗 Carro Popular (1 bloco)

| Posição da Placa | Representa            | Cor Importa? | Observação                         |
|------------------|-----------------------|--------------|------------------------------------|
| Frente           | Cor do carro          | ✅ Sim       | Define a cor da lataria do carro   |
| Direita          | Câmbio                | ✅ Sim       | Preto = Manual, Branco = Automático |
| Esquerda         | Tipo de roda          | ❌ Não       | Sem placa = roda padrão            |

---

## 🏎️ Carro Esportivo (2 blocos)

| Posição da Placa | Representa             | Cor Importa? | Observação                               |
|------------------|------------------------|--------------|------------------------------------------|
| Frente           | Tipo de tração         | ✅ Sim       | Ex: cor indica tração dianteira, traseira etc. |
| Direita          | Tipo de acabamento     | ✅ Sim       | Ex: metálico, fosco, perolado            |
| Esquerda         | Aerofólio              | ❌ Não       | Apenas a presença da placa já ativa      |

---

## 🚘 Carro de Luxo (3 blocos)

| Posição da Placa | Representa                  | Cor Importa? | Observação                                               |
|------------------|-----------------------------|--------------|----------------------------------------------------------|
| Frente           | Tipo de interior            | ✅ Sim       | Ex: couro, tecido, cor dos bancos                        |
| Direita          | IA implementada             | ❌Não        | Apenas a presença já indica personalização ativa         |
| Esquerda         | Personalização de placa     | ❌ Não       | Apenas a presença já indica personalização ativa         |

---

### 🧩 Chassis

| Cor do Chassi | Função                       |
|---------------|------------------------------|
| Azul          | Base superior                |
| Preto         | Base central (suporte principal) |
| Vermelho      | Base inferior                |

> *Os chassis servem como suporte estrutural para os blocos e não representam atributos personalizados.*

---


